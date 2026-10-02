import { useEffect, useState } from 'react'
import { loadTheme, saveTheme, type Theme } from '@/utils/storage'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setThemeRaw] = useState<Theme>(() => loadTheme())

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [theme])

  return { theme, setTheme: setThemeRaw }
}
