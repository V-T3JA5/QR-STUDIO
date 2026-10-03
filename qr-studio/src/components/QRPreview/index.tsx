import { QrCode } from 'lucide-react';
import type { Analysis } from '@/qr/pipeline';
import { PRESET_BY_ID } from '@/presets';
import type { QRState } from '@/types/qr';

export default function QRPreview({ state, analysis }: { state: QRState; analysis: Analysis }) {
  const message = analysis.encodeError ?? Object.values(analysis.errors)[0] ?? 'Fill in the details to see your code.';
  return (
    <div>
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        {analysis.svg && analysis.matrix ? (
          <div
            className="mx-auto aspect-square w-full max-w-[22rem] overflow-hidden rounded-sm"
            role="img"
            aria-label={`QR code preview, ${PRESET_BY_ID[state.presetId].name} style`}
            dangerouslySetInnerHTML={{ __html: analysis.svg }}
          />
        ) : (
          <div className="mx-auto flex aspect-square w-full max-w-[22rem] flex-col items-center justify-center gap-3 rounded-sm bg-surface-sunken px-8 text-center">
            <QrCode className="h-10 w-10 text-ink-secondary" strokeWidth={1.25} aria-hidden="true" />
            <p className="text-sm text-ink-secondary" role="status">{message}</p>
          </div>
        )}
      </div>
      {analysis.matrix && (
        <p className="mt-2.5 text-center text-sm text-ink-secondary">
          Version {analysis.matrix.version}, {analysis.matrix.size} × {analysis.matrix.size} modules, level {analysis.effectiveEc}
        </p>
      )}
    </div>
  );
}
