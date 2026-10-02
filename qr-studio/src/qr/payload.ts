import type { QRState } from '../types/qr'
const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
export function buildPayload(s: QRState): { text: string; error: string | null } {
  const c = s.content
  if (s.type === 'url') {
    const u = (c.url || '').trim(); if (!u) return { text: '', error: 'Enter a URL' }
    const t = /^[a-z]+:\/\//i.test(u) ? u : 'https://' + u
    try { new URL(t) } catch { return { text: '', error: 'That URL looks invalid' } }
    return { text: t, error: null }
  }
  if (s.type === 'text') return c.text ? { text: c.text, error: null } : { text: '', error: 'Enter some text' }
  if (!c.ssid) return { text: '', error: 'Enter the network name' }
  const t = c.sec === 'nopass' ? 'nopass' : 'WPA'
  return { text: `WIFI:T:${t};S:${esc(c.ssid)};P:${esc(c.pass || '')};;`, error: null }
}
