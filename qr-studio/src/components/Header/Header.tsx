import type { Theme } from '@/utils/storage'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

interface Props {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function Header({ theme, onThemeChange }: Props) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">QR Studio</h1>
        <p className="text-sm text-neutral-500">Create. Customize. Share.</p>
      </div>
      <ThemeToggle theme={theme} onChange={onThemeChange} />
    </header>
  )
}
