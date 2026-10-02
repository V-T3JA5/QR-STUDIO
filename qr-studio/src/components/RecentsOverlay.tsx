import { useEffect, useRef } from 'react'
import anime from 'animejs'
import type { RecentItem } from '../types/qr'
import { buildPayload } from '../qr/payload'
interface P { items: RecentItem[]; onClose: () => void; onReuse: (i: RecentItem) => void; onDelete: (id: string) => void }
export default function RecentsOverlay({ items, onClose, onReuse, onDelete }: P) {
  const panel = useRef<HTMLDivElement>(null), closeBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const a = anime({ targets: panel.current, translateX: ['100%', '0%'], duration: 420, easing: 'easeOutExpo' })
    closeBtn.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); return () => { a.pause(); removeEventListener('keydown', k) }
  }, [])
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Recent QR codes">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={panel} className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-neutral-50 p-4 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Recents</h2><button ref={closeBtn} className="btn btn-ghost" onClick={onClose}>Close</button></div>
        {items.length === 0 && <p className="text-sm text-neutral-500">Nothing yet. Download or save a code and it shows up here.</p>}
        <ul className="space-y-2">{items.map(i => (
          <li key={i.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <p className="truncate text-sm font-medium">{buildPayload(i.state).text || '(empty)'}</p>
            <p className="text-xs text-neutral-500">{i.state.type} · {i.state.preset} · {new Date(i.ts).toLocaleString()}</p>
            <div className="mt-2 flex gap-2"><button className="btn btn-primary" onClick={() => onReuse(i)}>Reuse</button><button className="btn btn-ghost" onClick={() => onDelete(i.id)}>Delete</button></div>
          </li>))}</ul>
      </div>
    </div>
  )
}
