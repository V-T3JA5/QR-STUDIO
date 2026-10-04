import { downloadBlob } from '@/utils/exportPng';
import { PRESET_BY_ID } from '@/presets';
import type { PresetId } from '@/types/qr';

export const svgSupported = (id: PresetId): boolean => PRESET_BY_ID[id].svgExportable;
export const svgUnsupportedReason = (id: PresetId): string => PRESET_BY_ID[id].svgNote ?? '';

export function downloadSvg(svg: string, filename: string): void {
  const doc = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
  downloadBlob(new Blob([doc], { type: 'image/svg+xml;charset=utf-8' }), filename);
}
