import type { QRState } from '../types/qr'
import type { Matrix } from './encoder'
export function render(canvas: HTMLCanvasElement, m: Matrix, s: QRState, logo?: HTMLImageElement | null) {
  const n = m.size, total = n + s.margin * 2, px = s.size, c = px / total
  canvas.width = canvas.height = px
  const g = canvas.getContext('2d')!
  g.fillStyle = s.bg; g.fillRect(0, 0, px, px)
  let fill: string | CanvasGradient = s.fg
  if (s.preset === 'duotone') {
    const gr = g.createLinearGradient(0, 0, px, px)
    gr.addColorStop(0, s.fg); gr.addColorStop(Math.max(0.1, 1 - s.param * 0.9), s.fg2); gr.addColorStop(1, s.fg2); fill = gr
  }
  g.fillStyle = fill
  if (s.preset === 'neon') { g.shadowColor = s.fg; g.shadowBlur = c * (0.5 + s.param * 3) }
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  const r = (c / 2) * (0.4 + 0.6 * s.param)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!m.get(x, y)) continue
    const X = (x + s.margin) * c, Y = (y + s.margin) * c
    if (s.preset === 'dots' && !finder(x, y)) { g.beginPath(); g.arc(X + c / 2, Y + c / 2, r, 0, Math.PI * 2); g.fill() }
    else g.fillRect(X, Y, c + 0.5, c + 0.5)
  }
  g.shadowBlur = 0
  if (s.logo && logo) {
    const L = px * 0.2, p = L * 0.12, o = (px - L) / 2
    g.fillStyle = s.bg; g.fillRect(o - p, o - p, L + p * 2, L + p * 2); g.drawImage(logo, o, o, L, L)
  }
}
