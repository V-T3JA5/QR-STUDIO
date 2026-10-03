import { useCallback, useMemo, useState } from 'react';
import type { ContentState, LogoState, Params, PresetId, QRState } from '@/types/qr';
import { analyze } from '@/qr/pipeline';
import { brandOverrides, defaultParams, PRESET_BY_ID } from '@/presets';
import { normalizeHex } from '@/qr/color';

export function createInitialState(): QRState {
  const preset = PRESET_BY_ID.classic;
  return {
    type: 'url',
    content: {
      url: 'https://example.com',
      text: '',
      email: { to: '', subject: '', body: '' },
      phone: '',
      wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
    },
    size: 320,
    fg: preset.defaults.fg,
    bg: preset.defaults.bg,
    ec: 'M',
    margin: 4,
    presetId: 'classic',
    params: defaultParams('classic'),
    logo: { mode: 'none', dataUrl: null, scale: 0.2, opacity: 0.2 },
    brand: { c1: '#3A5A40', c2: '' },
  };
}

/** Keep invariants: margin floor, size range, EC floor while a logo mode is selected. */
function normalize(s: QRState): QRState {
  let ec = s.ec;
  if (s.logo.mode !== 'none' && (ec === 'L' || ec === 'M')) ec = s.logo.mode === 'center' ? 'H' : 'Q';
  return { ...s, ec, margin: Math.max(4, Math.min(16, Math.round(s.margin))), size: Math.max(128, Math.min(1024, Math.round(s.size))) };
}

/** Merge a stored (possibly older or partial) state over the defaults. */
export function hydrate(raw: QRState): QRState {
  const d = createInitialState();
  const presetId: PresetId = raw.presetId in PRESET_BY_ID ? raw.presetId : d.presetId;
  return normalize({
    ...d,
    ...raw,
    presetId,
    content: { ...d.content, ...raw.content, email: { ...d.content.email, ...raw.content?.email }, wifi: { ...d.content.wifi, ...raw.content?.wifi } },
    params: { ...defaultParams(presetId), ...raw.params },
    logo: { ...d.logo, ...raw.logo },
    brand: { ...d.brand, ...raw.brand },
  });
}

export function useQR() {
  const [state, setState] = useState<QRState>(createInitialState);

  const update = useCallback((patch: Partial<QRState>) => setState((s) => normalize({ ...s, ...patch })), []);
  const setType = useCallback((type: QRState['type']) => update({ type }), [update]);
  const setContent = useCallback(
    (patch: Partial<ContentState>) => setState((s) => ({ ...s, content: { ...s.content, ...patch } })),
    [],
  );
  const setParam = useCallback(
    (key: string, value: Params[string]) => setState((s) => ({ ...s, params: { ...s.params, [key]: value } })),
    [],
  );
  const setLogo = useCallback(
    (patch: Partial<LogoState>) => setState((s) => normalize({ ...s, logo: { ...s.logo, ...patch } })),
    [],
  );
  const setBrand = useCallback(
    (patch: Partial<QRState['brand']>) => setState((s) => ({ ...s, brand: { ...s.brand, ...patch } })),
    [],
  );

  const selectPreset = useCallback((id: PresetId) => {
    const p = PRESET_BY_ID[id];
    setState((s) => normalize({ ...s, presetId: id, params: defaultParams(id), fg: p.defaults.fg, bg: p.defaults.bg }));
  }, []);

  /** Write the brand colours into the active preset (a one-time derivation the user can then edit). */
  const applyBrand = useCallback(() => {
    setState((s) => {
      const c1 = normalizeHex(s.brand.c1, '#3A5A40');
      const c2 = s.brand.c2 ? normalizeHex(s.brand.c2, '') : '';
      const o = brandOverrides(s.presetId, c1, c2);
      return normalize({ ...s, fg: o.fg ?? s.fg, bg: o.bg ?? s.bg, params: { ...s.params, ...o.params } });
    });
  }, []);

  const rehydrate = useCallback((saved: QRState) => setState(hydrate(saved)), []);
  const analysis = useMemo(() => analyze(state), [state]);

  return { state, analysis, update, setType, setContent, setParam, setLogo, setBrand, selectPreset, applyBrand, rehydrate };
}
