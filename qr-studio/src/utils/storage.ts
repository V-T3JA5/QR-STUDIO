import type { QRDesign } from '@/types/qr'

const RECENTS_KEY = 'qr-studio:recents'
const THEME_KEY = 'qr-studio:theme'
export const MAX_RECENTS = 10

export function loadRecents(): QRDesign[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt or inaccessible storage — fail safe to empty rather than throw.
    return []
  }
}

export function saveRecents(designs: QRDesign[]): void {
  try {
    const trimmed = designs.slice(0, MAX_RECENTS)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(trimmed))
  } catch {
    // Storage full or unavailable (private browsing, quota exceeded) — silently no-op.
    // The UI still functions for the current session, it just won't persist.
  }
}

export function addRecent(design: QRDesign): QRDesign[] {
  const current = loadRecents()
  const next = [design, ...current.filter((d) => d.id !== design.id)].slice(0, MAX_RECENTS)
  saveRecents(next)
  return next
}

export function deleteRecent(id: string): QRDesign[] {
  const current = loadRecents().filter((d) => d.id !== id)
  saveRecents(current)
  return current
}

export type Theme = 'light' | 'dark' | 'system'

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
    return 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // no-op
  }
}
