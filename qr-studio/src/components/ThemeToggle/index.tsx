import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import type { ThemeMode } from '@/types/qr';

const ITEMS: Array<{ mode: ThemeMode; label: string; Icon: LucideIcon }> = [
  { mode: 'light', label: 'Light theme', Icon: Sun },
  { mode: 'dark', label: 'Dark theme', Icon: Moon },
  { mode: 'system', label: 'Match system theme', Icon: Monitor },
];

export default function ThemeToggle({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Theme" className="flex divide-x divide-border overflow-hidden rounded-md border border-border bg-surface">
      {ITEMS.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-label={label}
          title={label}
          onClick={() => onChange(m)}
          className={`flex h-11 w-11 items-center justify-center transition-colors ${mode === m ? 'bg-active-fill text-active-text' : 'text-ink-secondary hover:bg-surface-sunken'}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
