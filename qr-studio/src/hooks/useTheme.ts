import { useEffect, useState } from 'react'
export type Theme = 'system' | 'light' | 'dark'
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('qrs:theme') as Theme) || 'system')
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches))
    apply(); mq.addEventListener('change', apply); localStorage.setItem('qrs:theme', theme)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  return { theme, cycle: () => setTheme(t => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system')) }
}
