import type { Params, ParamValue, PresetGroup, PresetId } from '@/types/qr';
import { darken, deriveSecond, ensureDark, lighten, mix } from '@/qr/color';

export interface ParamSpec {
  key: string;
  label: string;
  kind: 'range' | 'color';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: ParamValue;
}

export interface BrandResult {
  fg?: string;
  bg?: string;
  params?: Params;
}

export interface Preset {
  id: PresetId;
  name: string;
  group: PresetGroup;
  blurb: string;
  /** false when the preset takes its module colours from its own parameters. */
  usesFg: boolean;
  params: ParamSpec[];
  defaults: { fg: string; bg: string };
  brand: (c1: string, c2: string) => BrandResult;
  /** Colours the reliability check measures against the background. */
  contrast: (fg: string, bg: string, p: Params) => { modules: string[]; bg: string };
  svgExportable: boolean;
  svgNote?: string;
}

const range = (key: string, label: string, min: number, max: number, def: number, unit = '%', step = 1): ParamSpec =>
  ({ key, label, kind: 'range', min, max, step, unit, default: def });
const color = (key: string, label: string, def: string): ParamSpec =>
  ({ key, label, kind: 'color', default: def });

export const PRESETS: Preset[] = [
  {
    id: 'classic', name: 'Classic', group: 'Structural',
    blurb: 'Square modules. The most widely readable style.',
    usesFg: true,
    params: [range('cornerRadius', 'Corner rounding', 0, 50, 0), range('moduleGap', 'Module gap', 0, 20, 0)],
    defaults: { fg: '#1F1A14', bg: '#FFFFFF' },
    brand: (c1) => ({ fg: ensureDark(c1) }),
    contrast: (fg, bg) => ({ modules: [fg], bg }),
    svgExportable: true,
  },
  {
    id: 'dotMatrix', name: 'Dot Matrix', group: 'Structural',
    blurb: 'Round dots with softened finder patterns.',
    usesFg: true,
    params: [range('dotSize', 'Dot size', 55, 100, 86), range('finderRoundness', 'Finder rounding', 0, 50, 10)],
    defaults: { fg: '#1F1A14', bg: '#FFFFFF' },
    brand: (c1) => ({ fg: ensureDark(c1) }),
    contrast: (fg, bg) => ({ modules: [fg], bg }),
    svgExportable: true,
  },
  {
    id: 'neonGlow', name: 'Neon Glow', group: 'Vivid',
    blurb: 'Bright modules with a soft halo on a dark ground.',
    usesFg: true,
    params: [color('glowColor', 'Glow colour', '#35D6E8'), range('glowSpread', 'Glow spread', 0, 100, 55)],
    defaults: { fg: '#F2FEFF', bg: '#0E0B14' },
    brand: (c1) => ({ fg: lighten(c1, 0.82), bg: darken(c1, 0.88), params: { glowColor: c1 } }),
    contrast: (fg, bg) => ({ modules: [fg], bg }),
    svgExportable: true,
  },
  {
    id: 'duotone', name: 'Duotone Gradient', group: 'Vivid',
    blurb: 'A smooth two-colour gradient across the whole code.',
    usesFg: false,
    params: [
      color('from', 'Start colour', '#1E2A78'),
      color('to', 'End colour', '#B4237A'),
      range('angle', 'Angle', 0, 360, 135, '°'),
      range('moduleRadius', 'Corner rounding', 0, 50, 22),
    ],
    defaults: { fg: '#1E2A78', bg: '#FFFFFF' },
    brand: (c1, c2) => ({ params: { from: ensureDark(c1, 0.4), to: ensureDark(c2, 0.42) } }),
    contrast: (_fg, bg, p) => ({ modules: [String(p.from), String(p.to)], bg }),
    svgExportable: true,
  },
  {
    id: 'twoTone', name: 'Two-Tone by Role', group: 'Vivid',
    blurb: 'One colour for the finder patterns, another for the data.',
    usesFg: true,
    params: [
      color('finderColor', 'Finder colour', '#1D4E89'),
      range('finderRadius', 'Finder rounding', 0, 50, 18),
      range('dataRadius', 'Data rounding', 0, 50, 20),
    ],
    defaults: { fg: '#1F1A14', bg: '#FFFFFF' },
    brand: (c1, c2) => ({ fg: ensureDark(c2, 0.26), params: { finderColor: ensureDark(c1, 0.4) } }),
    contrast: (fg, bg, p) => ({ modules: [fg, String(p.finderColor)], bg }),
    svgExportable: true,
  },
  {
    id: 'retroGrain', name: 'Retro Grain', group: 'Textured',
    blurb: 'Uneven printed ink with speckle, like a risograph.',
    usesFg: true,
    params: [range('grain', 'Grain', 0, 100, 20), range('wobble', 'Ink wobble', 0, 100, 15), range('seed', 'Pattern seed', 1, 99, 7, '')],
    defaults: { fg: '#3B2A1E', bg: '#F1E7D0' },
    brand: (c1) => ({ fg: ensureDark(c1, 0.26), bg: mix(c1, '#FFFFFF', 0.88) }),
    contrast: (fg, bg) => ({ modules: [fg], bg }),
    svgExportable: true,
  },
  {
    id: 'glassPanel', name: 'Glass Panel', group: 'Textured',
    blurb: 'A frosted pane over soft, blurred colour.',
    usesFg: true,
    params: [
      color('blobA', 'Background colour A', '#7C9CF0'),
      color('blobB', 'Background colour B', '#F29FC4'),
      range('blur', 'Blur', 0, 60, 28),
      range('panelOpacity', 'Pane opacity', 25, 90, 62),
      range('panelRadius', 'Pane rounding', 0, 15, 6),
    ],
    defaults: { fg: '#1B2433', bg: '#E9EEF7' },
    brand: (c1, c2) => ({ fg: ensureDark(c1, 0.2), params: { blobA: c1, blobB: c2 } }),
    contrast: (fg, bg, p) => {
      const avg = mix(mix(String(p.blobA), String(p.blobB), 0.5), bg, 0.35);
      return { modules: [fg], bg: mix(avg, '#FFFFFF', Number(p.panelOpacity) / 100) };
    },
    svgExportable: false,
    svgNote: 'The frosted blur is built from SVG blur filters, which many design and print tools render inconsistently. Export as PNG instead.',
  },
  {
    id: 'embossed', name: 'Embossed', group: 'Textured',
    blurb: 'Raised modules with a lit edge and a soft shadow.',
    usesFg: true,
    params: [range('depth', 'Depth', 1, 10, 4, ''), range('lightAngle', 'Light angle', 0, 360, 315, '°'), range('cornerRadius', 'Corner rounding', 0, 50, 20)],
    defaults: { fg: '#4A3B2A', bg: '#D9CDB8' },
    brand: (c1) => ({ fg: ensureDark(c1, 0.26), bg: mix(c1, '#FFFFFF', 0.74) }),
    contrast: (fg, bg) => ({ modules: [fg], bg }),
    svgExportable: true,
  },
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p])) as Record<PresetId, Preset>;
export const GROUPS: PresetGroup[] = ['Structural', 'Vivid', 'Textured'];

export function defaultParams(id: PresetId): Params {
  const out: Params = {};
  for (const spec of PRESET_BY_ID[id].params) out[spec.key] = spec.default;
  return out;
}

/** Brand colours → preset overrides. A missing second colour is derived from the first. */
export function brandOverrides(id: PresetId, c1: string, c2: string): BrandResult {
  return PRESET_BY_ID[id].brand(c1, c2 || deriveSecond(c1));
}
