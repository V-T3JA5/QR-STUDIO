import type { QRState } from '../types/qr'
const lum = (hex: string) => {
  const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
export function reliability(s: QRState) {
  const notes: string[] = []; let score = 100
  const cr = s.preset === 'duotone' ? Math.min(ratio(s.fg, s.bg), ratio(s.fg2, s.bg)) : ratio(s.fg, s.bg)
  if (cr < 3) { score -= 60; notes.push(`Contrast ${cr.toFixed(1)}:1 — many scanners will fail`) }
  else if (cr < 5) { score -= 25; notes.push(`Contrast ${cr.toFixed(1)}:1 — marginal`) }
  if (lum(s.fg) > lum(s.bg)) { score -= 25; notes.push('Light-on-dark (inverted) — some scanners can’t read this') }
  if (s.margin < 4) { score -= 15; notes.push('Quiet zone under 4 modules') }
  if (s.logo) { score -= 8; notes.push('Logo covers ~4% of the code (EC locked to H)') }
  if (s.preset === 'neon') { score -= 10; notes.push('Glow blurs module edges') }
  if (s.preset === 'dots' && s.param < 0.55) { score -= 10; notes.push('Small dots reduce read distance') }
  score = Math.max(0, score)
  return { score, label: score >= 80 ? 'Reliable' : score >= 55 ? 'Test before printing' : 'Likely to fail', notes }
}
