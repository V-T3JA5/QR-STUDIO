import type { Theme } from '@/utils/storage'

interface Props {
  theme: Theme
  onChange: (theme: Theme) => void
}

const OPTIONS: { id: Theme; icon: string }[] = [
  { id: 'light', icon: '☀' },
  { id: 'dark', icon: '☾' },
  { id: 'system', icon: '◐' },
]

export function ThemeToggle({ theme, onChange }: Props) {
  return (
    <div className="flex rounded-full bg-black/5 dark:bg-white/5 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          aria-label={`${opt.id} theme`}
          className={`w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors ${
            theme === opt.id ? 'bg-accent text-white' : 'text-neutral-500'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
