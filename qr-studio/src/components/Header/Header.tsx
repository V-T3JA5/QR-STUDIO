import type { Theme } from '@/utils/storage'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

interface Props {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  docked: boolean
  onOpenRecents: () => void
}

export function Header({ theme, onThemeChange, docked, onOpenRecents }: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between py-4 px-4 md:px-8 bg-canvas-light/80 dark:bg-canvas-dark/80 backdrop-blur-md">
      <div
        className="transition-opacity duration-300"
        style={{ opacity: docked ? 1 : 0, pointerEvents: docked ? 'auto' : 'none' }}
      >
        <h1 className="text-xl font-display font-semibold tracking-tight">QR STUDIO</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenRecents}
          className="text-sm px-3 py-2 rounded-full bg-black/5 dark:bg-white/5 min-h-[40px]"
        >
          Recents
        </button>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    </header>
  )
}
