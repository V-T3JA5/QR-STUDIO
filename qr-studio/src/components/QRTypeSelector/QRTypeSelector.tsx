import type { QRContentType } from '@/types/qr'

const TYPES: { id: QRContentType; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'wifi', label: 'Wi-Fi' },
]

interface Props {
  active: QRContentType
  onChange: (type: QRContentType) => void
}

export function QRTypeSelector({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="QR content type">
      {TYPES.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 min-h-[44px] ${
              isActive
                ? 'bg-accent text-white shadow-elevate-sm'
                : 'btn-secondary text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
