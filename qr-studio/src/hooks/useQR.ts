import { useCallback, useMemo, useState } from 'react';
import type { ContentState, LogoState, Params, PresetId, QRState } from '@/types/qr';
import { analyze } from '@/qr/pipeline';
import { defaultParams, PRESET_BY_ID } from '@/presets';

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
    secondary: preset.defaults.secondary,
    bg: preset.defaults.bg,
    ec: 'M',
    margin: 4,
    presetId: 'classic',
    params: defaultParams('classic'),
    logo: { mode: 'none', dataUrl: null, scale: 0.2, opacity: 0.2 },
  };
}

/** Keep invariants: margin floor, size range, EC floor while a logo mode is selected. */
function normalize(s: QRState): QRState {
  let ec = s.ec;
  if (s.logo.mode !== 'none' && (ec === 'L' || ec === 'M')) ec = s.logo.mode === 'center' ? 'H' : 'Q';
  return { ...s, ec, margin: Math.max(4, Math.min(16, Math.round(s.margin))), size: Math.max(128, Math.min(1024, Math.round(s.size))) };
}

/** Merge a stored (possibly older or partial) state over the defaults. Unknown legacy fields are dropped. */
export function hydrate(raw: QRState): QRState {
  const d = createInitialState();
  const presetId: PresetId = raw.presetId in PRESET_BY_ID ? raw.presetId : d.presetId;
  const preset = PRESET_BY_ID[presetId];
  return normalize({
    type: raw.type ?? d.type,
    content: { ...d.content, ...raw.content, email: { ...d.content.email, ...raw.content?.email }, wifi: { ...d.content.wifi, ...raw.content?.wifi } },
    size: raw.size ?? d.size,
    fg: raw.fg ?? preset.defaults.fg,
    secondary: raw.secondary ?? preset.defaults.secondary,
    bg: raw.bg ?? preset.defaults.bg,
    ec: raw.ec ?? d.ec,
    margin: raw.margin ?? d.margin,
    presetId,
    params: { ...defaultParams(presetId), ...raw.params },
    logo: { ...d.logo, ...raw.logo },
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

  const selectPreset = useCallback((id: PresetId) => {
    const p = PRESET_BY_ID[id];
    setState((s) =>
      normalize({ ...s, presetId: id, params: defaultParams(id), fg: p.defaults.fg, secondary: p.defaults.secondary, bg: p.defaults.bg }),
    );
  }, []);

  const rehydrate = useCallback((saved: QRState) => setState(hydrate(saved)), []);
  const analysis = useMemo(() => analyze(state), [state]);

  return { state, analysis, update, setType, setContent, setParam, setLogo, selectPreset, rehydrate };
}
