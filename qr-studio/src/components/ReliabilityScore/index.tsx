import { useLayoutEffect, useRef } from 'react';
import anime from 'animejs';
import { Check, TriangleAlert, X } from 'lucide-react';
import type { CheckStatus, Reliability } from '@/types/qr';

const ICON = { pass: Check, warn: TriangleAlert, fail: X } as const;
const WORD: Record<CheckStatus, string> = { pass: 'Good', warn: 'Check', fail: 'Fix' };

/** Tween the number in place. The span is left empty for React so it never fights the animation. */
function Score({ value }: { value: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { v: shown.current };
    if (quick || state.v === value) {
      shown.current = value;
      node.textContent = String(value);
      return;
    }
    const a = anime({
      targets: state,
      v: value,
      duration: 450,
      easing: 'easeOutCubic',
      update: () => {
        shown.current = state.v;
        node.textContent = String(Math.round(state.v));
      },
      complete: () => {
        shown.current = value;
        node.textContent = String(value);
      },
    });
    return () => a.pause();
  }, [value]);
  return <span ref={el} />;
}

export default function ReliabilityScore({ reliability }: { reliability: Reliability | null }) {
  return (
    <section aria-labelledby="rel-h" className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="rel-h" className="font-display text-xl">Scan reliability</h2>
        {reliability && <p className="font-display text-4xl font-light leading-none tabular-nums"><Score value={reliability.score} />%</p>}
      </div>
      {reliability ? (
        <>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reliability.score} aria-label="Reliability score">
            <div className="h-full bg-active-fill transition-[width] duration-300" style={{ width: `${reliability.score}%` }} />
          </div>
          <ul className="mt-4 divide-y divide-border">
            {reliability.items.map((it) => {
              const Icon = ICON[it.status];
              return (
                <li key={it.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      it.status === 'pass' ? 'bg-active-fill text-active-text' : it.status === 'warn' ? 'border border-ink-primary' : 'border-2 border-ink-primary'
                    }`}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{it.label}: {WORD[it.status]}</p>
                    <p className="text-sm text-ink-secondary">{it.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-secondary">Complete the form and the checks appear here.</p>
      )}
    </section>
  );
}
