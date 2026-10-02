import { useEffect, useRef, useState } from 'react'
import type { QRState, RecentItem } from './types/qr'
import Header from './components/Header'
import Hero from './components/Hero'
import Editor from './components/Editor'
import Preview from './components/Preview'
import RecentsOverlay from './components/RecentsOverlay'
import { useTheme } from './hooks/useTheme'
import { useHeroScroll } from './hooks/useHeroScroll'
import { loadRecents, saveRecents } from './utils/storage'
const INIT: QRState = { type: 'url', content: { url: 'https://example.com' }, preset: 'classic', size: 512, fg: '#0b1f1d', fg2: '#0C9C8D', bg: '#ffffff', ec: 'M', margin: 4, logo: false, param: 0.7 }
export default function App() {
  const [s, setS] = useState<QRState>(INIT)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)
  const [recents, setRecents] = useState<RecentItem[]>(loadRecents)
  const [open, setOpen] = useState(false)
  const { theme, cycle } = useTheme()
  const hero = useRef<HTMLElement>(null), mark = useRef<HTMLDivElement>(null), bar = useRef<HTMLDivElement>(null), depth = useRef<HTMLDivElement>(null)
  useHeroScroll(hero, mark, bar, depth)
  useEffect(() => saveRecents(recents), [recents])
  const set = (p: Partial<QRState>) => setS(v => ({ ...v, ...p }))
  const onLogo = (f: File | null) => {
    if (!f) { setLogoImg(null); set({ logo: false }); return }
    const img = new Image(); img.onload = () => { setLogoImg(img); set({ logo: true }) }; img.src = URL.createObjectURL(f)
  }
  const save = () => setRecents(r => [{ id: crypto.randomUUID(), ts: Date.now(), state: { ...s, logo: false } }, ...r])
  return (
    <>
      <Header markRef={mark} barRef={bar} theme={theme} onTheme={cycle} onRecents={() => setOpen(true)} />
      <Hero ref={hero} depthRef={depth} />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-20 lg:grid-cols-2 lg:pt-10">
        <Editor s={s} set={set} onLogo={onLogo} hasLogo={!!logoImg} />
        <div className="lg:sticky lg:top-20 lg:self-start"><Preview s={s} logoImg={logoImg} onSave={save} /></div>
      </main>
      {open && <RecentsOverlay items={recents} onClose={() => setOpen(false)} onDelete={id => setRecents(r => r.filter(x => x.id !== id))}
        onReuse={i => { setS(i.state); setLogoImg(null); setOpen(false) }} />}
    </>
  )
}
