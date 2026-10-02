import type { QRState, QRType } from '../types/qr'
import { PRESETS } from '../presets'
interface P { s: QRState; set: (p: Partial<QRState>) => void; onLogo: (f: File | null) => void; hasLogo: boolean }
const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <section className="space-y-3"><h2 className="font-display text-base font-semibold">{t}</h2>{children}</section>)
export default function Editor({ s, set, onLogo, hasLogo }: P) {
  const c = (k: string, v: string) => set({ content: { ...s.content, [k]: v } })
  const preset = PRESETS.find(p => p.id === s.preset)!
  const colour = (label: string, k: 'fg' | 'fg2' | 'bg') => (
    <label className="flex items-center justify-between gap-3 text-sm">{label}
      <input type="color" className="h-11 w-16 cursor-pointer rounded-lg border border-neutral-300 bg-transparent p-1 dark:border-neutral-700" value={s[k]} onChange={e => set({ [k]: e.target.value })} /></label>)
  return (
    <div className="space-y-8">
      <Sec t="Content">
        <div className="flex gap-2" role="group" aria-label="QR type">
          {(['url', 'text', 'wifi'] as QRType[]).map(t => <button key={t} className="chip" aria-pressed={s.type === t} onClick={() => set({ type: t })}>{t === 'wifi' ? 'Wi-Fi' : t.toUpperCase()}</button>)}
        </div>
        {s.type === 'url' && <input className="field" aria-label="URL" placeholder="example.com" value={s.content.url || ''} onChange={e => c('url', e.target.value)} />}
        {s.type === 'text' && <textarea className="field py-2" rows={3} aria-label="Text" placeholder="Any text" value={s.content.text || ''} onChange={e => c('text', e.target.value)} />}
        {s.type === 'wifi' && <div className="space-y-2">
          <input className="field" aria-label="Network name" placeholder="Network name" value={s.content.ssid || ''} onChange={e => c('ssid', e.target.value)} />
          <input className="field" aria-label="Password" placeholder="Password" value={s.content.pass || ''} onChange={e => c('pass', e.target.value)} />
          <select className="field" aria-label="Security" value={s.content.sec || 'WPA'} onChange={e => c('sec', e.target.value)}><option value="WPA">WPA/WPA2</option><option value="nopass">Open</option></select></div>}
      </Sec>
      <Sec t="Style">
        {['Structural', 'Vivid'].map(g => <div key={g}><p className="mb-1 text-xs text-neutral-500">{g}</p>
          <div className="flex flex-wrap gap-2">{PRESETS.filter(p => p.group === g).map(p => <button key={p.id} className="chip" aria-pressed={s.preset === p.id} onClick={() => set({ preset: p.id })}>{p.name}</button>)}</div></div>)}
      </Sec>
      <Sec t="Customize">
        {colour('Foreground', 'fg')}{s.preset === 'duotone' && colour('Second colour', 'fg2')}{colour('Background', 'bg')}
        {preset.paramLabel && <label className="block text-sm">{preset.paramLabel}<input type="range" min={0} max={1} step={0.05} className="mt-1 h-11 w-full accent-turq-deep" value={s.param} onChange={e => set({ param: +e.target.value })} /></label>}
        <label className="block text-sm">Size · {s.size}px<input type="range" min={256} max={1024} step={64} className="mt-1 h-11 w-full accent-turq-deep" value={s.size} onChange={e => set({ size: +e.target.value })} /></label>
        <label className="block text-sm">Margin · {s.margin} modules<input type="range" min={0} max={8} className="mt-1 h-11 w-full accent-turq-deep" value={s.margin} onChange={e => set({ margin: +e.target.value })} /></label>
        <label className="block text-sm">Error correction{s.logo && ' (locked to H by logo)'}
          <select className="field mt-1" disabled={s.logo} value={s.logo ? 'H' : s.ec} onChange={e => set({ ec: e.target.value as QRState['ec'] })}>
            <option value="L">L · 7%</option><option value="M">M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option></select></label>
      </Sec>
      <Sec t="Logo">
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" aria-label="Logo image" className="field py-2" onChange={e => onLogo(e.target.files?.[0] ?? null)} />
          {hasLogo && <button className="btn btn-ghost" onClick={() => onLogo(null)}>Remove</button>}
        </div>
      </Sec>
    </div>
  )
}
