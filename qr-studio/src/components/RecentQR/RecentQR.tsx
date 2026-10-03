import { X } from 'lucide-react'
import type { QRDesign } from '@/types/qr'

interface Props {
  recents: QRDesign[]
  onReuse: (design: QRDesign) => void
  onDelete: (id: string) => void
}

export function RecentQR({ recents, onReuse, onDelete }: Props) {
  if (recents.length === 0) {
    return (
      <div className="panel p-6 text-center text-sm text-neutral-400">
        No recent QR codes yet — codes you download will appear here.
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {recents.map((design) => (
        <div
          key={design.id}
          className="panel p-3 min-w-[140px] flex-shrink-0 group relative hover:-translate-y-0.5 transition-transform duration-150"
        >
          <button onClick={() => onReuse(design)} className="w-full text-left">
            <div className="text-xs font-medium truncate">{design.name}</div>
            <div className="text-[11px] text-neutral-400 uppercase mt-0.5">{design.content.type}</div>
          </button>
          <button
            onClick={() => onDelete(design.id)}
            aria-label="Delete"
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  )
}
