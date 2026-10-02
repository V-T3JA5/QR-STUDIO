import QRCode from 'qrcode'
import type { EC } from '../types/qr'
export interface Matrix { size: number; get: (x: number, y: number) => boolean }
export function encode(text: string, ec: EC): Matrix {
  const q = QRCode.create(text, { errorCorrectionLevel: ec })
  return { size: q.modules.size, get: (x, y) => !!q.modules.data[y * q.modules.size + x] }
}
