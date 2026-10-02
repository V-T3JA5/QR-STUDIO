import { useState } from 'react'
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
          className="py-2.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-40 min-h-[44px]"
        >
          Download PNG
        </button>
        <button
          onClick={handleSvgDownload}
          disabled={!canvas || !svgSupported}
          title={!svgSupported ? 'SVG export requires page context and is unavailable for Glass Panel.' : undefined}
          className="py-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-sm font-medium disabled:opacity-40 min-h-[44px]"
        >
          Download SVG
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
        className="w-full py-2.5 rounded-lg border border-black/10 dark:border-white/10 text-sm min-h-[44px]"
      >
        {copied ? '✓ Copied to clipboard' : 'Copy content'}
      </button>
    </div>
  )
}
