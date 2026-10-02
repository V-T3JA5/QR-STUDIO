export type QRType = 'url' | 'text' | 'wifi'
export type PresetId = 'classic' | 'dots' | 'neon' | 'duotone'
export type EC = 'L' | 'M' | 'Q' | 'H'
export interface QRState {
  type: QRType; content: Record<string, string>; preset: PresetId
  size: number; fg: string; fg2: string; bg: string; ec: EC; margin: number
  logo: boolean; param: number
}
export interface RecentItem { id: string; ts: number; state: QRState }
