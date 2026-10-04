import type { Params, ParamValue, PresetGroup, PresetId } from '@/types/qr';
import { deriveSecond, mix } from '@/qr/color';

export interface ParamSpec {
  key: string;
  label: string;
  kind: 'range' | 'choice';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Array<{ value: string; label: string }>;
  default: ParamValue;
}

export interface Preset {
  id: PresetId;
  name: string;
  group: PresetGroup;
  blurb: string;
  /** Whether the Secondary colour does anything for this style, and what it paints. */
  usesSecondary: boolean;
  secondaryHint?: string;
  params: ParamSpec[];
  defaults: { fg: string; secondary: string; bg: string };
  /** Colours the reliability check measures against the background. */
  contrast: (fg: string, secondary: string, bg: string, p: Params) => { modules: string[]; bg: string };
  svgExportable: boolean;
  svgNote?: string;
}

const range = (key: string, label: string, min: number, max: number, def: number, unit = '%', step = 1): ParamSpec =>
  ({ key, label, kind: 'range', min, max, step, unit, default: def });
const choice = (key: string, label: string, options: Array<{ value: string; label: string }>, def: string): ParamSpec =>
  ({ key, label, kind: 'choice', options, default: def });

const one = (fg: string, _s: string, bg: string) => ({ modules: [fg], bg });
const two = (fg: string, s: string, bg: string) => ({ modules: [fg, s], bg });

export const PRESETS: Preset[] = [
  // ---------------------------------------------------------------- Structural
  {
    id: 'classic', name: 'Classic', group: 'Structural',
    blurb: 'Square modules. The most widely readable style.',
    usesSecondary: false,
    params: [range('cornerRadius', 'Corner rounding', 0, 50, 0), range('moduleGap', 'Module gap', 0, 20, 0)],
    defaults: { fg: '#1F1A14', secondary: '#1F1A14', bg: '#FFFFFF' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'dotMatrix', name: 'Dot Matrix', group: 'Structural',
    blurb: 'Round dots with softened finder patterns.',
    usesSecondary: false,
    params: [range('dotSize', 'Dot size', 55, 100, 92), range('finderRoundness', 'Finder rounding', 0, 50, 8)],
    defaults: { fg: '#1F1A14', secondary: '#1F1A14', bg: '#FFFFFF' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'liquid', name: 'Liquid', group: 'Structural',
    blurb: 'Neighbouring modules melt together into one flowing shape.',
    usesSecondary: false,
    params: [range('smooth', 'Smoothness', 0, 50, 50)],
    defaults: { fg: '#1B2A41', secondary: '#1B2A41', bg: '#FFFFFF' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'bars', name: 'Bars', group: 'Structural',
    blurb: 'Runs of modules fuse into long capsules, like a barcode.',
    usesSecondary: false,
    params: [
      choice('orientation', 'Direction', [{ value: 'h', label: 'Horizontal' }, { value: 'v', label: 'Vertical' }], 'h'),
      range('barGap', 'Gap between bars', 4, 30, 12),
      range('roundness', 'Capsule rounding', 0, 100, 100),
      range('finderRoundness', 'Finder rounding', 0, 50, 12),
    ],
    defaults: { fg: '#1F1A14', secondary: '#1F1A14', bg: '#FFFFFF' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'hex', name: 'Honeycomb', group: 'Structural',
    blurb: 'Hexagonal cells, with the finder patterns in the second colour.',
    usesSecondary: true, secondaryHint: 'Paints the three finder patterns.',
    params: [range('size', 'Cell size', 80, 110, 100), range('finderRadius', 'Finder rounding', 0, 30, 12)],
    defaults: { fg: '#17324D', secondary: '#C2410C', bg: '#FFFFFF' },
    contrast: two, svgExportable: true,
  },

  // ---------------------------------------------------------------- Vivid
  {
    id: 'neonGlow', name: 'Neon Glow', group: 'Vivid',
    blurb: 'Bright modules with a soft halo on a dark ground.',
    usesSecondary: true, secondaryHint: 'The glow around each module.',
    params: [range('glowSpread', 'Glow spread', 0, 100, 55)],
    defaults: { fg: '#F2FEFF', secondary: '#35D6E8', bg: '#0E0B14' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'duotone', name: 'Duotone Gradient', group: 'Vivid',
    blurb: 'A smooth two-colour gradient across the whole code.',
    usesSecondary: true, secondaryHint: 'Where the gradient ends. Primary is where it starts.',
    params: [range('angle', 'Angle', 0, 360, 135, '°'), range('moduleRadius', 'Corner rounding', 0, 50, 22)],
    defaults: { fg: '#1E2A78', secondary: '#B4237A', bg: '#FFFFFF' },
    contrast: two, svgExportable: true,
  },
  {
    id: 'twoTone', name: 'Two-Tone by Role', group: 'Vivid',
    blurb: 'One colour for the finder patterns, another for the data.',
    usesSecondary: true, secondaryHint: 'Paints the three finder patterns.',
    params: [range('finderRadius', 'Finder rounding', 0, 50, 18), range('dataRadius', 'Data rounding', 0, 50, 20)],
    defaults: { fg: '#1F1A14', secondary: '#1D4E89', bg: '#FFFFFF' },
    contrast: two, svgExportable: true,
  },

  // ---------------------------------------------------------------- Textured
  {
    id: 'halftone', name: 'Halftone', group: 'Textured',
    blurb: 'Print-style dots that shrink and shift colour across the code.',
    usesSecondary: true, secondaryHint: 'The colour the dots drift towards.',
    params: [
      choice('pattern', 'Direction', [{ value: 'radial', label: 'Radial' }, { value: 'diagonal', label: 'Diagonal' }, { value: 'horizontal', label: 'Across' }], 'radial'),
      range('minDot', 'Smallest dot', 45, 95, 74),
    ],
    defaults: { fg: '#1B1F3B', secondary: '#B4371E', bg: '#FFFFFF' },
    contrast: two, svgExportable: true,
  },
  {
    id: 'retroGrain', name: 'Retro Grain', group: 'Textured',
    blurb: 'Uneven printed ink with speckle, like a risograph.',
    usesSecondary: false,
    params: [range('grain', 'Grain', 0, 100, 20), range('wobble', 'Ink wobble', 0, 100, 15), range('seed', 'Pattern seed', 1, 99, 7, '')],
    defaults: { fg: '#3B2A1E', secondary: '#3B2A1E', bg: '#F1E7D0' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'glassPanel', name: 'Glass Panel', group: 'Textured',
    blurb: 'A frosted pane over soft, blurred colour.',
    usesSecondary: true, secondaryHint: 'The colour glowing behind the glass. A companion hue is added.',
    params: [range('blur', 'Blur', 0, 60, 28), range('panelOpacity', 'Pane opacity', 25, 90, 62), range('panelRadius', 'Pane rounding', 0, 15, 6)],
    defaults: { fg: '#1B2433', secondary: '#7C9CF0', bg: '#E9EEF7' },
    contrast: (fg, s, bg, p) => {
      const avg = mix(mix(s, deriveSecond(s), 0.5), bg, 0.35);
      return { modules: [fg], bg: mix(avg, '#FFFFFF', Number(p.panelOpacity) / 100) };
    },
    svgExportable: false,
    svgNote: 'The frosted blur is built from SVG blur filters, which many design and print tools render inconsistently. Export as PNG instead.',
  },
  {
    id: 'embossed', name: 'Embossed', group: 'Textured',
    blurb: 'Raised modules with a lit edge and a soft shadow.',
    usesSecondary: false,
    params: [range('depth', 'Depth', 1, 10, 4, ''), range('lightAngle', 'Light angle', 0, 360, 315, '°'), range('cornerRadius', 'Corner rounding', 0, 50, 20)],
    defaults: { fg: '#4A3B2A', secondary: '#4A3B2A', bg: '#D9CDB8' },
    contrast: one, svgExportable: true,
  },
  {
    id: 'crossStitch', name: 'Cross-stitch', group: 'Textured',
    blurb: 'Every module is a stitched X in two threads.',
    usesSecondary: true, secondaryHint: 'The second thread of each stitch.',
    params: [range('thread', 'Thread thickness', 30, 55, 44), range('finderRadius', 'Finder rounding', 0, 30, 10)],
    defaults: { fg: '#2B2F77', secondary: '#B4237A', bg: '#FBF7EE' },
    contrast: two, svgExportable: true,
  },
  {
    id: 'studs', name: 'Studs', group: 'Textured',
    blurb: 'Toy-brick tiles, each with a raised round stud.',
    usesSecondary: true, secondaryHint: 'The stud on top of each brick.',
    params: [range('studSize', 'Stud size', 20, 42, 27), range('shine', 'Shine', 0, 100, 40)],
    defaults: { fg: '#8E1B15', secondary: '#B8382E', bg: '#FFFFFF' },
    contrast: two, svgExportable: true,
  },
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p])) as Record<PresetId, Preset>;
export const GROUPS: PresetGroup[] = ['Structural', 'Vivid', 'Textured'];

export function defaultParams(id: PresetId): Params {
  const out: Params = {};
  for (const spec of PRESET_BY_ID[id].params) out[spec.key] = spec.default;
  return out;
}
