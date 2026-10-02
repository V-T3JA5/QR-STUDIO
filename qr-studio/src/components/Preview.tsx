import { useEffect, useRef, useState } from 'react'
import anime from 'animejs'
import type { QRState } from '../types/qr'
import { buildPayload } from '../qr/payload'
import { encode } from '../qr/encoder'
import { render } from '../qr/renderer'
import { reliability } from '../qr/reliability'
import { copyPng, downloadPng } from '../utils/exportPng'
interface P { s: QRState; logoImg: HTMLImageElement | null; onSave: () => void }
export default function Preview({ s, logoImg, onSave }: P) {
  const cv = useRef<HTMLCanvasElement>(null), bar = useRef<HTMLDivElement>(null)
  const [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState('')
  const { text, error } = buildPayload(s)
  const rel = reliability(s)
  useEffect(() => {
    setErr(error)
    if (error || !cv.current) return
    try { render(cv.current, encode(text, s.logo ? 'H' : s.ec), s, logoImg) } catch { setErr('Content too long for a QR code') }
  }, [text, error, s, logoImg])
  useEffect(() => { const a = anime({ targets: bar.current, width: rel.score + '%', duration: 500, easing: 'easeOutQuad' }); return () => a.pause() }, [rel.score])
  const ok = !err, flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 1800) }
  const tone = rel.score >= 80 ? 'bg-turq-deep dark:bg-turq-bright' : rel.score >= 55 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-6">
      <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <canvas ref={cv} className="h-full w-full" style={{ visibility: ok ? 'visible' : 'hidden' }} aria-label="QR code preview" role="img" />
        {!ok && <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-neutral-500">{err}</p>}
      </div>
      <section aria-label="Scan reliability">
        <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{rel.label}</span><span>{rel.score}/100</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"><div ref={bar} className={`h-full rounded-full ${tone}`} style={{ width: 0 }} /></div>
        {rel.notes.length > 0 && <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">{rel.notes.map(n => <li key={n}>{n}</li>)}</ul>}
      </section>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={!ok} onClick={() => { downloadPng(cv.current!); onSave() }}>Download PNG</button>
        <button className="btn btn-ghost" disabled={!ok} onClick={() => copyPng(cv.current!).then(() => flash('Copied'), () => flash('Copy not supported here'))}>Copy</button>
        <button className="btn btn-ghost" disabled={!ok} onClick={() => { onSave(); flash('Saved to recents') }}>Save</button>
        <span role="status" className="self-center text-sm text-neutral-500">{msg}</span>
      </div>
    </div>
  )
}
