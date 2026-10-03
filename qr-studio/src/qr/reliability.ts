import type { CheckStatus, ECLevel, QRState, Reliability, ReliabilityItem } from '@/types/qr';
import { PRESET_BY_ID } from '@/presets';
import { contrastRatio, luminance } from './color';

const WEIGHTS = { contrast: 25, polarity: 10, ec: 20, quiet: 15, logo: 15, pattern: 15 } as const;
const SCORE: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };
/** Share of the code area a centre logo may cover before scanning gets risky. */
const SAFE_COVERAGE: Record<ECLevel, number> = { L: 0.02, M: 0.06, Q: 0.1, H: 0.16 };

/** Settings that distort the finder patterns or module shapes. Thresholds come from decoding test renders. */
function patternCheck(state: QRState): { status: CheckStatus; detail: string } {
  const p = state.params;
  const n = (k: string) => Number(p[k]);
  const risks: Array<{ warn: boolean; fail?: boolean; msg: string }> = [];
  switch (state.presetId) {
    case 'classic':
      risks.push({ warn: n('moduleGap') > 5, fail: n('moduleGap') > 15, msg: 'Gaps between modules break up the finder patterns. Keep the gap under 5%.' });
      break;
    case 'dotMatrix':
      risks.push({ warn: n('finderRoundness') > 20, fail: n('finderRoundness') > 35, msg: 'Heavily rounded finder patterns are hard for scanners to lock on to.' });
      risks.push({ warn: n('dotSize') < 65, msg: 'Small dots leave little ink for scanners to sample.' });
      break;
    case 'twoTone':
      risks.push({ warn: n('finderRadius') > 25, fail: n('finderRadius') > 40, msg: 'Heavily rounded finder patterns are hard for scanners to lock on to.' });
      break;
    case 'neonGlow':
      risks.push({ warn: n('glowSpread') > 70, fail: n('glowSpread') > 90, msg: 'A wide glow merges neighbouring modules together.' });
      break;
    case 'retroGrain':
      risks.push({ warn: n('grain') > 35 || n('wobble') > 35, fail: n('grain') > 60 || n('wobble') > 60, msg: 'Heavy grain and wobble start to erase modules.' });
      break;
    case 'embossed':
      risks.push({ warn: n('depth') > 6, msg: 'Deep shadows bleed into neighbouring modules.' });
      break;
    case 'duotone':
      risks.push({ warn: n('moduleRadius') > 40, msg: 'Very round modules look like dots and lose their edges.' });
      break;
    case 'glassPanel':
      risks.push({ warn: n('panelOpacity') < 40, msg: 'A thin pane lets the colour behind it reduce contrast.' });
      break;
  }
  const hit = risks.filter((r) => r.warn);
  if (!hit.length) return { status: 'pass', detail: 'Finder patterns and modules are clean and solid.' };
  return { status: hit.some((r) => r.fail) ? 'fail' : 'warn', detail: hit[0].msg };
}

export function computeReliability(state: QRState, ec: ECLevel, matrixSize: number): Reliability {
  const preset = PRESET_BY_ID[state.presetId];
  const { modules, bg } = preset.contrast(state.fg, state.bg, state.params);
  const items: ReliabilityItem[] = [];

  // 1. Contrast between the weakest module colour and the background.
  const ratio = Math.min(...modules.map((m) => contrastRatio(m, bg)));
  items.push({
    id: 'contrast',
    label: 'Contrast',
    status: ratio >= 4.5 ? 'pass' : ratio >= 3 ? 'warn' : 'fail',
    detail: `${ratio.toFixed(1)}:1 between modules and background. Aim for 4.5:1 or more.`,
  });

  // 2. Polarity: light-on-dark ("inverted") codes fail on some scanners.
  const modLum = modules.reduce((a, m) => a + luminance(m), 0) / modules.length;
  const inverted = modLum > luminance(bg);
  items.push({
    id: 'polarity',
    label: 'Polarity',
    status: inverted ? 'warn' : 'pass',
    detail: inverted
      ? 'Light modules on a dark background. Most phone cameras read this, some older scanners do not.'
      : 'Dark modules on a light background, the most compatible arrangement.',
  });

  // 3. Error correction versus logo.
  const logoOn = state.logo.mode !== 'none' && !!state.logo.dataUrl;
  let ecStatus: CheckStatus = 'pass';
  let ecDetail = `Level ${ec}. No logo, so the full correction budget is free.`;
  if (logoOn) {
    if (ec === 'H') ecDetail = 'Level H leaves the most room for a logo.';
    else if (ec === 'Q') {
      ecStatus = state.logo.mode === 'center' ? 'warn' : 'pass';
      ecDetail = ecStatus === 'warn' ? 'Level Q works for a small logo. Use H for more margin.' : 'Level Q is enough for a faded logo.';
    } else {
      ecStatus = 'fail';
      ecDetail = `Level ${ec} cannot recover the modules a logo hides. Use Q or H.`;
    }
  }
  items.push({ id: 'ec', label: 'Error correction', status: ecStatus, detail: ecDetail });

  // 4. Quiet zone.
  items.push({
    id: 'quiet',
    label: 'Quiet zone',
    status: state.margin >= 4 ? 'pass' : 'fail',
    detail: `${state.margin} modules of margin. Scanners need at least 4.`,
  });

  // 5. Logo coverage.
  let logoStatus: CheckStatus = 'pass';
  let logoDetail = state.logo.mode === 'none' ? 'No logo in use.' : 'Add an image to use the logo.';
  if (logoOn && state.logo.mode === 'center') {
    const cov = Math.pow((state.logo.scale * matrixSize + 1.6) / matrixSize, 2);
    const safe = SAFE_COVERAGE[ec];
    logoStatus = cov <= safe ? 'pass' : cov <= safe * 1.6 ? 'warn' : 'fail';
    logoDetail = `Logo hides about ${Math.round(cov * 100)}% of the code. Level ${ec} is comfortable up to ${Math.round(safe * 100)}%.`;
  } else if (logoOn && state.logo.mode === 'fade') {
    const o = state.logo.opacity;
    logoStatus = o <= 0.3 ? 'pass' : o <= 0.5 ? 'warn' : 'fail';
    logoDetail = `Logo shows at ${Math.round(o * 100)}% opacity behind the modules. Keep it under 30%.`;
  }
  items.push({ id: 'logo', label: 'Logo coverage', status: logoStatus, detail: logoDetail });

  const pat = patternCheck(state);
  items.push({ id: 'pattern', label: 'Pattern fidelity', status: pat.status, detail: pat.detail });

  const score = Math.round(items.reduce((sum, it) => sum + WEIGHTS[it.id] * SCORE[it.status], 0));
  return { score, items };
}
