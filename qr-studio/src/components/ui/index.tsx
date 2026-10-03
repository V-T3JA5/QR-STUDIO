import { useEffect, useId, useState, type ReactNode } from 'react';
import { isHex, normalizeHex } from '@/qr/color';

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-display text-xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-secondary">{hint}</p>}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

export function Field({
  label, htmlFor, error, hint, children,
}: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-ink-secondary">{hint}</p>}
      {error && <p id={htmlFor + '-err'} role="alert" className="mt-1.5 text-sm font-medium">{error}</p>}
    </div>
  );
}

export interface SegOption<T extends string> { value: T; label: string; disabled?: boolean; title?: string }

export function Segmented<T extends string>({
  value, options, onChange, label,
}: { value: T; options: SegOption<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex divide-x divide-border overflow-hidden rounded-md border border-border bg-surface">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`seg-item disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'bg-active-fill text-active-text' : 'text-ink-secondary hover:bg-surface-sunken'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Range({
  label, value, min, max, step = 1, unit = '', onChange,
}: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        <span className="text-sm tabular-nums text-ink-secondary">{Math.round(value * 100) / 100}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block h-11 w-full cursor-pointer"
        style={{ accentColor: 'rgb(var(--ink-primary))' }}
      />
    </div>
  );
}

export function ColorField({
  label, value, onChange, disabled, hint,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; hint?: string }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = (v: string) => {
    setDraft(v);
    const t = v.startsWith('#') ? v : '#' + v;
    if (isHex(t)) onChange(normalizeHex(t));
  };
  const bad = !isHex(draft.startsWith('#') ? draft : '#' + draft);
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={label + ' picker'}
          disabled={disabled}
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-border bg-surface p-1 disabled:cursor-not-allowed"
        />
        <input
          id={id}
          type="text"
          inputMode="text"
          spellCheck={false}
          disabled={disabled}
          value={draft}
          aria-invalid={bad}
          onChange={(e) => commit(e.target.value)}
          className="field-input font-mono text-sm uppercase"
        />
      </div>
      {hint && <p className="mt-1.5 text-sm text-ink-secondary">{hint}</p>}
    </div>
  );
}
