import { Link2, Mail, Phone, Type, Wifi, type LucideIcon } from 'lucide-react';
import type { QRType } from '@/types/qr';
import { TYPE_LABEL } from '@/qr/payload';

const ITEMS: Array<{ type: QRType; Icon: LucideIcon }> = [
  { type: 'url', Icon: Link2 },
  { type: 'text', Icon: Type },
  { type: 'email', Icon: Mail },
  { type: 'phone', Icon: Phone },
  { type: 'wifi', Icon: Wifi },
];

export default function QRTypeSelector({ value, onChange }: { value: QRType; onChange: (t: QRType) => void }) {
  return (
    <div role="radiogroup" aria-label="Content type" className="grid grid-cols-5 divide-x divide-border overflow-hidden rounded-md border border-border bg-surface">
      {ITEMS.map(({ type, Icon }) => {
        const on = type === value;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(type)}
            className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors sm:min-h-12 sm:flex-row sm:gap-2 sm:text-sm ${
              on ? 'bg-active-fill text-active-text' : 'text-ink-secondary hover:bg-surface-sunken'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {TYPE_LABEL[type]}
          </button>
        );
      })}
    </div>
  );
}
