import type { RecentItem } from '../types/qr'
export const loadRecents = (): RecentItem[] => { try { return JSON.parse(localStorage.getItem('qrs:recents') || '[]') } catch { return [] } }
export const saveRecents = (r: RecentItem[]) => { try { localStorage.setItem('qrs:recents', JSON.stringify(r.slice(0, 20))) } catch {} }
