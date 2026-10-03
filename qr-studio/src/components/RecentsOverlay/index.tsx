import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { RotateCcw, Trash2, X } from 'lucide-react';
import type { RecentEntry } from '@/types/qr';
import { analyze } from '@/qr/pipeline';
import { TYPE_LABEL } from '@/qr/payload';
import { PRESET_BY_ID } from '@/presets';

interface Props {
  open: boolean;
  recents: RecentEntry[];
  onClose: () => void;
  onReuse: (e: RecentEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const ago = (t: number): string => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
};

export default function RecentsOverlay({ open, recents, onClose, onReuse, onRemove, onClear }: Props) {
  const [mounted, setMounted] = useState(open);
  const drawer = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    const d = drawer.current;
    const b = backdrop.current;
    if (!mounted || !d || !b) return;
    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (open) {
      anime({ targets: b, opacity: [0, 1], duration: quick ? 1 : 220, easing: 'linear' });
      anime({ targets: d, translateX: [quick ? 0 : '100%', 0], duration: quick ? 1 : 320, easing: 'easeOutCubic' });
      closeBtn.current?.focus();
    } else {
      anime({ targets: b, opacity: 0, duration: quick ? 1 : 200, easing: 'linear' });
      anime({
        targets: d,
        translateX: quick ? 0 : '100%',
        duration: quick ? 1 : 260,
        easing: 'easeInCubic',
        complete: () => {
          setMounted(false);
          returnFocus.current?.focus();
        },
      });
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !drawer.current) return;
      const f = drawer.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const rows = useMemo(
    () => (mounted ? recents.map((entry) => ({ entry, a: analyze(entry.state) })) : []),
    [mounted, recents],
  );

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div ref={backdrop} className="absolute inset-0 bg-ink-primary/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recents-h"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-canvas shadow-xl"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <h2 id="recents-h" className="font-display text-xl">Recent codes</h2>
          <button ref={closeBtn} type="button" className="btn !px-3" onClick={onClose} aria-label="Close recent codes">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {rows.length === 0 ? (
            <p className="mt-6 text-sm text-ink-secondary">
              Codes you export, copy or save appear here. The last 10 are kept on this device.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map(({ entry, a }) => (
                <li key={entry.id} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-surface-sunken" aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: a.svg ?? '' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{TYPE_LABEL[entry.state.type]}: {a.payload || 'Incomplete'}</p>
                    <p className="text-sm text-ink-secondary">{PRESET_BY_ID[entry.state.presetId].name}, {ago(entry.savedAt)}</p>
                  </div>
                  <button type="button" className="btn !px-3" onClick={() => onReuse(entry)} aria-label="Use this code again" title="Use again">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn !px-3" onClick={() => onRemove(entry.id)} aria-label="Delete this code" title="Delete">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {rows.length > 0 && (
          <div className="shrink-0 border-t border-border p-4">
            <button type="button" className="btn w-full" onClick={onClear}>Clear all</button>
          </div>
        )}
      </div>
    </div>
  );
}
