import type { PresetId } from '../types/qr'
export const PRESETS: { id: PresetId; name: string; group: string; paramLabel: string }[] = [
  { id: 'classic', name: 'Classic', group: 'Structural', paramLabel: '' },
  { id: 'dots', name: 'Dot Matrix', group: 'Structural', paramLabel: 'Dot size' },
  { id: 'neon', name: 'Neon Glow', group: 'Vivid', paramLabel: 'Glow' },
  { id: 'duotone', name: 'Duotone Gradient', group: 'Vivid', paramLabel: 'Second colour mix' },
]
