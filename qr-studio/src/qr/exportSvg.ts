import type { RenderConfig } from './renderer'
import { encodeToMatrix } from './encoder'
import { getPreset } from '@/presets'

export function isSvgSupported(presetId: string): boolean {
  return getPreset(presetId).svgExportSupported
}

export function renderQRToSvgString(config: RenderConfig): string {
  if (!isSvgSupported(config.presetId)) {
    throw new Error('SVG export is not supported for the Glass Panel preset.')
  }

  const matrix = encodeToMatrix(config.payload, config.errorCorrection)
  const totalModules = matrix.size + config.marginModules * 2
  const moduleSize = config.size / totalModules
  const offset = config.marginModules * moduleSize
  const p = config.presetParams

  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${config.size}" height="${config.size}" viewBox="0 0 ${config.size} ${config.size}">`,
  )
  parts.push(`<rect width="100%" height="100%" fill="${config.background}"/>`)

  const defs: string[] = []
  let fillRef = config.foreground

  if (config.presetId === 'duotone-gradient') {
    defs.push(
      `<linearGradient id="qrGrad" gradientTransform="rotate(${p.gradientAngle ?? 45})">
        <stop offset="0%" stop-color="${p.gradientStart ?? config.foreground}"/>
        <stop offset="100%" stop-color="${p.gradientEnd ?? config.foreground}"/>
      </linearGradient>`,
    )
    fillRef = 'url(#qrGrad)'
  }

  if (config.presetId === 'neon-glow') {
    defs.push(
      `<filter id="qrGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${(p.glowIntensity ?? 0.5) * moduleSize * 0.8}" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>`,
    )
  }

  if (defs.length) parts.push(`<defs>${defs.join('')}</defs>`)

  const moduleGroup: string[] = []
  if (config.presetId === 'neon-glow') moduleGroup.push('<g filter="url(#qrGlow)">')

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.isDark(row, col)) continue
      const x = offset + col * moduleSize
      const y = offset + row * moduleSize
      const isFinder = matrix.isFinderPattern(row, col)

      let fill = fillRef
      if (config.presetId === 'two-tone') {
        fill = isFinder ? p.finderColor ?? config.foreground : p.dataColor ?? config.foreground
      }

      if (config.presetId === 'dot-matrix') {
        const spacing = p.dotSpacingRatio ?? 0.15
        const r = (moduleSize / 2) * (1 - spacing)
        moduleGroup.push(
          `<circle cx="${x + moduleSize / 2}" cy="${y + moduleSize / 2}" r="${r}" fill="${fill}"/>`,
        )
      } else if (config.presetId === 'embossed') {
        const depth = p.bevelDepth ?? 3
        const angle = ((p.lightAngle ?? 135) * Math.PI) / 180
        const dx = Math.cos(angle) * depth
        const dy = Math.sin(angle) * depth
        moduleGroup.push(
          `<rect x="${x + dx}" y="${y + dy}" width="${moduleSize}" height="${moduleSize}" fill="rgba(0,0,0,0.35)"/>`,
        )
        moduleGroup.push(
          `<rect x="${x - dx}" y="${y - dy}" width="${moduleSize}" height="${moduleSize}" fill="rgba(255,255,255,0.25)"/>`,
        )
        moduleGroup.push(`<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${fill}"/>`)
      } else {
        moduleGroup.push(`<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${fill}"/>`)
      }
    }
  }

  if (config.presetId === 'neon-glow') moduleGroup.push('</g>')
  parts.push(moduleGroup.join(''))

  if (config.presetId === 'retro-grain') {
    const intensity = p.grainIntensity ?? 0.3
    const grainDots: string[] = []
    const count = Math.floor((config.size * config.size) / 60)
    for (let i = 0; i < count; i++) {
      const x = Math.random() * config.size
      const y = Math.random() * config.size
      const shade = Math.random() > 0.5 ? 255 : 0
      grainDots.push(
        `<rect x="${x}" y="${y}" width="1.5" height="1.5" fill="rgb(${shade},${shade},${shade})" opacity="${(
          Math.random() * intensity * 0.4
        ).toFixed(2)}"/>`,
      )
    }
    parts.push(`<g>${grainDots.join('')}</g>`)
  }

  if (config.logo.mode === 'center' && config.logo.imageDataUrl) {
    const logoSize = config.size * config.logo.sizeRatio
    const x = (config.size - logoSize) / 2
    const y = (config.size - logoSize) / 2
    const pad = config.logo.padding
    parts.push(
      `<rect x="${x - pad}" y="${y - pad}" width="${logoSize + pad * 2}" height="${logoSize + pad * 2}" rx="${
        config.logo.rounded ? (logoSize + pad * 2) / 6 : 0
      }" fill="${config.background}"/>`,
    )
    parts.push(
      `<image href="${config.logo.imageDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" ${
        config.logo.rounded ? `clip-path="inset(0 round ${logoSize / 6}px)"` : ''
      }/>`,
    )
  } else if (config.logo.mode === 'full-fade' && config.logo.imageDataUrl) {
    parts.unshift(
      `<image href="${config.logo.imageDataUrl}" x="0" y="0" width="${config.size}" height="${config.size}" preserveAspectRatio="xMidYMid slice" opacity="${config.logo.fadeOpacity}"/>`,
    )
  }

  parts.push('</svg>')
  return parts.join('')
}

export function downloadSvg(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
