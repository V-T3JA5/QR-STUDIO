import { Sun, Moon, Monitor } from 'lucide-react'
import type { Theme } from '@/utils/storage'

interface Props {
  theme: Theme
  onChange: (theme: Theme) => void
}

const OPTIONS: { id: Theme; Icon: typeof Sun }[] = [
  { id: 'light', Icon: Sun },
  { id: 'dark', Icon: Moon },
  { id: 'system', Icon: Monitor },
]

export function ThemeToggle({ theme, onChange }: Props) {
  return (
    <div className="flex rounded-full bg-black/5 dark:bg-white/5 p-1">
      {OPTIONS.map(({ id, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-label={`${id} theme`}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            theme === id ? 'bg-accent text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}
