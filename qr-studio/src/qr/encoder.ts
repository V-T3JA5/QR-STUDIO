import QRCode from 'qrcode';
import type { ECLevel } from '@/types/qr';

export interface QRMatrix {
  size: number;
  version: number;
  isDark: (row: number, col: number) => boolean;
  isFinder: (row: number, col: number) => boolean;
}

interface BitMatrixLike {
  size: number;
  get: (row: number, col: number) => number;
}

export function encodeMatrix(text: string, ec: ECLevel): QRMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: ec });
  const modules = qr.modules as unknown as BitMatrixLike;
  const size = modules.size;
  return {
    size,
    version: qr.version,
    isDark: (r, c) => modules.get(r, c) === 1,
    isFinder: (r, c) =>
      (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7),
  };
}
