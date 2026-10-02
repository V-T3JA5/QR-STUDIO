import { RefObject } from 'react'
import type { Theme } from '../hooks/useTheme'
interface P { markRef: RefObject<HTMLDivElement>; barRef: RefObject<HTMLDivElement>; theme: Theme; onTheme: () => void; onRecents: () => void }
export default function Header({ markRef, barRef, theme, onTheme, onRecents }: P) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14">
      <div ref={barRef} className="absolute inset-0 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80" />
      <div ref={markRef} className="font-display pointer-events-none absolute left-1/2 top-0 z-10 h-14 whitespace-nowrap text-[22px] font-extrabold leading-[56px] tracking-tight">
        QR <span className="text-turq-deep dark:text-turq-bright">STUDIO</span>
      </div>
      <div className="relative z-20 flex h-full items-center justify-between px-4">
        <button className="btn btn-ghost bg-transparent" onClick={onRecents}>Recents</button>
        <button className="btn btn-ghost bg-transparent" onClick={onTheme} aria-label={`Theme: ${theme}. Click to change`}>{theme}</button>
      </div>
    </header>
  )
}
