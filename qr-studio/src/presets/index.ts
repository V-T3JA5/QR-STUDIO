import type { StylePreset } from '@/types/qr'

export const PRESETS: StylePreset[] = [
  // ── Structural ──────────────────────────────────────────────
  {
    id: 'classic',
    name: 'Classic',
    group: 'structural',
    description: 'Square modules, solid colors. The reliable baseline.',
    foreground: '#111111',
    background: '#ffffff',
    errorCorrection: 'M',
    params: {},
    svgExportSupported: true,
  },
  {
    id: 'circuit',
    name: 'Circuit',
    group: 'structural',
    description: 'Copper trace lines on a PCB-style substrate.',
    foreground: '#e0a458',
    background: '#0c1f16',
    errorCorrection: 'M',
    params: { substrateColor: '#0c1f16' },
    svgExportSupported: true,
  },
  {
    id: 'dot-matrix',
    name: 'Dot Matrix',
    group: 'structural',
    description: 'Modules rendered as circular dots with adjustable spacing.',
    foreground: '#1d1d1f',
    background: '#f5f5f7',
    errorCorrection: 'M',
    params: { dotSpacingRatio: 0.15 },
    svgExportSupported: true,
  },

  // ── Vivid ────────────────────────────────────────────────────
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    group: 'vivid',
    description: 'Gradient fill with a real SVG blur-based light bloom.',
    foreground: '#ff2ec4',
    background: '#0a0a12',
    errorCorrection: 'Q',
    params: { glowIntensity: 0.6, glowColor: '#ff2ec4' },
    svgExportSupported: true,
  },
  {
    id: 'duotone-gradient',
    name: 'Duotone Gradient',
    group: 'vivid',
    description: 'Two-stop linear gradient across the whole code.',
    foreground: '#111111',
    background: '#ffffff',
    errorCorrection: 'M',
    params: { gradientStart: '#7c5cff', gradientEnd: '#00d9c0', gradientAngle: 45 },
    svgExportSupported: true,
  },
  {
    id: 'two-tone',
    name: 'Two-Tone by Role',
    group: 'vivid',
    description: 'Finder patterns and data modules colored independently.',
    foreground: '#111111',
    background: '#ffffff',
    errorCorrection: 'M',
    params: { finderColor: '#ff5a3c', dataColor: '#111111' },
    svgExportSupported: true,
  },

  // ── Textured ─────────────────────────────────────────────────
  {
    id: 'retro-grain',
    name: 'Retro Grain',
    group: 'textured',
    description: 'Vintage palette with a real noise-texture overlay.',
    foreground: '#4a3728',
    background: '#e8dcc4',
    errorCorrection: 'M',
    params: { grainIntensity: 0.35 },
    svgExportSupported: true,
  },
  {
    id: 'glass-panel',
    name: 'Glass Panel',
    group: 'textured',
    description: 'Translucent blurred panel behind the code (PNG only).',
    foreground: '#ffffff',
    background: '#1a1a2e',
    errorCorrection: 'M',
    params: { blurAmount: 12, panelOpacity: 0.35, panelTint: '#7c5cff' },
    svgExportSupported: false,
  },
  {
    id: 'embossed',
    name: 'Embossed',
    group: 'textured',
    description: 'Layered directional shadows for a raised relief look.',
    foreground: '#3a3a3a',
    background: '#d8d8d8',
    errorCorrection: 'M',
    params: { bevelDepth: 3, lightAngle: 135 },
    svgExportSupported: true,
  },
]

export function getPreset(id: string): StylePreset {
  const found = PRESETS.find((p) => p.id === id)
  if (!found) throw new Error(`Unknown preset id: ${id}`)
  return found
}

export const DEFAULT_PRESET_ID = 'classic'
