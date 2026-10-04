import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { QrCode } from 'lucide-react';
import type { Analysis } from '@/qr/pipeline';
import { PRESET_BY_ID } from '@/presets';
import type { QRState } from '@/types/qr';
import { useTilt } from '@/hooks/useTilt';

export default function QRPreview({ state, analysis }: { state: QRState; analysis: Analysis }) {
  const message = analysis.encodeError ?? Object.values(analysis.errors)[0] ?? 'Fill in the details to see your code.';
  const card = useRef<HTMLDivElement>(null);
  const face = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useTilt(card, 3);

  // A short settle when the *style* changes. Not on every slider tick: motion should confirm a choice, not decorate a drag.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = face.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    anime.remove(el);
    anime({ targets: el, opacity: [0.35, 1], scale: [0.985, 1], duration: 240, easing: 'easeOutQuad' });
  }, [state.presetId]);

  return (
    <div>
      <div ref={card} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <div ref={face}>
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
      </div>
      {analysis.matrix && (
        <p className="mt-2.5 text-center text-sm text-ink-secondary">
          Version {analysis.matrix.version}, {analysis.matrix.size} × {analysis.matrix.size} modules, level {analysis.effectiveEc}
        </p>
      )}
    </div>
  );
}
