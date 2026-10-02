import QRCodeLib from 'qrcode'
import type { ErrorCorrectionLevel } from '@/types/qr'

export interface QRMatrix {
  size: number
  isDark: (row: number, col: number) => boolean
  isFinderPattern: (row: number, col: number) => boolean
}

// The three finder patterns are 7x7 blocks anchored at the top-left,
// top-right, and bottom-left corners of every QR code, regardless of version.
function isFinderRegion(row: number, col: number, size: number): boolean {
  const inTopLeft = row < 7 && col < 7
  const inTopRight = row < 7 && col >= size - 7
  const inBottomLeft = row >= size - 7 && col < 7
  return inTopLeft || inTopRight || inBottomLeft
}

export function encodeToMatrix(payload: string, errorCorrection: ErrorCorrectionLevel): QRMatrix {
  const data = QRCodeLib.create(payload, { errorCorrectionLevel: errorCorrection })
  const { modules } = data
  const size = modules.size

  return {
    size,
    isDark: (row: number, col: number) => Boolean(modules.get(row, col)),
    isFinderPattern: (row: number, col: number) => isFinderRegion(row, col, size),
  }
}
