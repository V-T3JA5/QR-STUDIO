import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import type { RenderConfig } from '@/qr/renderer'
import { downloadCanvasAsPng, copyToClipboard } from '@/utils/exportPng'
import { isSvgSupported, renderQRToSvgString, downloadSvg } from '@/qr/exportSvg'

interface Props {
  canvas: HTMLCanvasElement | null
  renderConfig: RenderConfig
  payload: string
  onSaveToRecents: () => void
}

export function ExportPanel({ canvas, renderConfig, payload, onSaveToRecents }: Props) {
  const [copied, setCopied] = useState(false)
  const svgSupported = isSvgSupported(renderConfig.presetId)

  function handlePngDownload() {
    if (!canvas) return
    downloadCanvasAsPng(canvas, 'qr-code.png')
    onSaveToRecents()
  }

  function handleSvgDownload() {
    if (!svgSupported) return
    const svg = renderQRToSvgString(renderConfig)
    downloadSvg(svg, 'qr-code.svg')
    onSaveToRecents()
  }

  async function handleCopy() {
    const ok = await copyToClipboard(payload)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="panel p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handlePngDownload}
          disabled={!canvas}
          className="btn-primary py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Download size={15} strokeWidth={2.5} />
          PNG
        </button>
        <button
          onClick={handleSvgDownload}
          disabled={!canvas || !svgSupported}
          title={!svgSupported ? 'SVG export requires page context and is unavailable for Glass Panel.' : undefined}
          className="btn-secondary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40"
        >
          <Download size={15} strokeWidth={2} />
          SVG
        </button>
      </div>
      {!svgSupported && (
        <p className="text-xs text-neutral-500">
          Glass Panel's blur effect can't be exported to SVG — PNG only for this style.
        </p>
      )}
      <button
        onClick={handleCopy}
        disabled={!payload.trim()}
        className="btn-secondary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40"
      >
        {copied ? <Check size={15} strokeWidth={2.5} className="text-emerald-500" /> : <Copy size={15} strokeWidth={2} />}
        {copied ? 'Copied to clipboard' : 'Copy content'}
      </button>
    </div>
  )
}
