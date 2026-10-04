import type { ECLevel, QRState, Reliability } from '@/types/qr';
import { buildPayload } from './payload';
import { encodeMatrix, type QRMatrix } from './encoder';
import { buildSvg } from './renderer';
import { computeReliability } from './reliability';

export interface Analysis {
  payload: string;
  errors: Record<string, string>;
  valid: boolean;
  encodeError: string | null;
  matrix: QRMatrix | null;
  effectiveEc: ECLevel;
  svg: string | null;
  reliability: Reliability | null;
}

export const effectiveEc = (s: QRState): ECLevel =>
  s.logo.mode !== 'none' && (s.ec === 'L' || s.ec === 'M') ? (s.logo.mode === 'center' ? 'H' : 'Q') : s.ec;

export function analyze(state: QRState): Analysis {
  const ec = effectiveEc(state);
  const p = buildPayload(state.type, state.content);
  const base = { ...p, effectiveEc: ec, encodeError: null, matrix: null, svg: null, reliability: null };
  if (!p.valid) return base;
  try {
    const matrix = encodeMatrix(p.payload, ec);
    const svg = buildSvg(
      { matrix, fg: state.fg, secondary: state.secondary, bg: state.bg, margin: Math.max(4, state.margin), presetId: state.presetId, params: state.params, logo: state.logo },
    );
    return { ...base, matrix, svg, reliability: computeReliability(state, ec, matrix.size) };
  } catch {
    return {
      ...base,
      valid: false,
      encodeError: 'There is too much data for one QR code at this error-correction level. Shorten the content or lower the correction level.',
    };
  }
}

/** Fixed-size SVG for exports. */
export function exportSvgString(state: QRState, matrix: QRMatrix): string {
  return buildSvg(
    { matrix, fg: state.fg, secondary: state.secondary, bg: state.bg, margin: Math.max(4, state.margin), presetId: state.presetId, params: state.params, logo: state.logo },
    state.size,
  );
}
