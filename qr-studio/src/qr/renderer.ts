import type { ErrorCorrectionLevel, LogoConfig, PresetId, PresetParams } from '@/types/qr'
import { encodeToMatrix, type QRMatrix } from './encoder'

export interface RenderConfig {
  payload: string
  size: number // final canvas size in px
  marginModules: number
  foreground: string
  background: string
  errorCorrection: ErrorCorrectionLevel
  presetId: PresetId
  presetParams: PresetParams
  logo: LogoConfig
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r},${g},${b},${alpha})`
}

// Renders the QR matrix + active preset styling onto a canvas.
// Returns the canvas so callers can export it as PNG/data-URL.
export function renderQR(config: RenderConfig): HTMLCanvasElement {
  const matrix = encodeToMatrix(config.payload, config.errorCorrection)
  const canvas = document.createElement('canvas')
  canvas.width = config.size
  canvas.height = config.size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const totalModules = matrix.size + config.marginModules * 2
  const moduleSize = config.size / totalModules
  const offset = config.marginModules * moduleSize

  // 1. Background
  ctx.fillStyle = config.background
  ctx.fillRect(0, 0, config.size, config.size)

  // 2. Preset-specific background layer (glass panel, full-fade logo sit here)
  if (config.presetId === 'glass-panel') {
    drawGlassBackdrop(ctx, config)
  }
  if (config.logo.mode === 'full-fade' && config.logo.imageDataUrl) {
    drawFullFadeLogo(ctx, config)
  }

  // 3. Modules, styled per preset
  drawModules(ctx, matrix, config, moduleSize, offset)

  // 4. Preset post-processing overlays
  if (config.presetId === 'retro-grain') {
    drawGrainOverlay(ctx, config)
  }

  // 5. Center logo (drawn on top, after modules)
  if (config.logo.mode === 'center' && config.logo.imageDataUrl) {
    drawCenterLogoSync(ctx, config)
  }

  return canvas
}

// Note: image loading is async, but for the export path we pre-load images
// via loadImageSync helper before calling renderQR (see exportPng in utils).
// For live preview we use renderQRAsync below, which awaits image decode.

export async function renderQRAsync(config: RenderConfig): Promise<HTMLCanvasElement> {
  if (config.logo.imageDataUrl) {
    await preloadImage(config.logo.imageDataUrl)
  }
  return renderQR(config)
}

const imageCache = new Map<string, HTMLImageElement>()

function preloadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

function getCachedImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null
}

function drawModules(
  ctx: CanvasRenderingContext2D,
  matrix: QRMatrix,
  config: RenderConfig,
  moduleSize: number,
  offset: number,
) {
  const { presetId, presetParams: p, foreground } = config

  // Precompute a fill style function per preset
  let gradient: CanvasGradient | null = null
  if (presetId === 'duotone-gradient') {
    const angle = ((p.gradientAngle ?? 45) * Math.PI) / 180
    const x1 = config.size / 2 - (Math.cos(angle) * config.size) / 2
    const y1 = config.size / 2 - (Math.sin(angle) * config.size) / 2
    const x2 = config.size / 2 + (Math.cos(angle) * config.size) / 2
    const y2 = config.size / 2 + (Math.sin(angle) * config.size) / 2
    gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, p.gradientStart ?? foreground)
    gradient.addColorStop(1, p.gradientEnd ?? foreground)
  }

  // Real neon glow needs multiple blur passes with falling-off radius/alpha —
  // a single shadowBlur reads as a faint smudge, not a bloom. We draw the
  // module field 3 times (wide-soft, mid, tight-bright) before the crisp fill.
  if (presetId === 'neon-glow') {
    const glowColor = p.glowColor ?? foreground
    const intensity = p.glowIntensity ?? 0.5
    const passes = [
      { blur: moduleSize * 6 * intensity, alpha: 0.35 },
      { blur: moduleSize * 3 * intensity, alpha: 0.55 },
      { blur: moduleSize * 1.2 * intensity, alpha: 0.85 },
    ]
    for (const pass of passes) {
      ctx.save()
      ctx.shadowColor = glowColor
      ctx.shadowBlur = pass.blur
      ctx.globalAlpha = pass.alpha
      ctx.fillStyle = glowColor
      for (let row = 0; row < matrix.size; row++) {
        for (let col = 0; col < matrix.size; col++) {
          if (!matrix.isDark(row, col)) continue
          const x = offset + col * moduleSize
          const y = offset + row * moduleSize
          ctx.fillRect(x, y, moduleSize, moduleSize)
        }
      }
      ctx.restore()
    }
  }

  // Glass panel: modules are drawn with partial transparency so the blurred
  // backdrop panel genuinely shows through, with contrast kept scan-safe.
  const glassModuleAlpha = presetId === 'glass-panel' ? 0.88 : 1

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.isDark(row, col)) continue

      const x = offset + col * moduleSize
      const y = offset + row * moduleSize
      const isFinder = matrix.isFinderPattern(row, col)

      let fill: string | CanvasGradient = foreground
      if (presetId === 'two-tone') {
        fill = isFinder ? p.finderColor ?? foreground : p.dataColor ?? foreground
      } else if (presetId === 'duotone-gradient' && gradient) {
        fill = gradient
      }

      if (presetId === 'embossed') {
        drawEmbossedModule(ctx, x, y, moduleSize, fill as string, p)
      } else if (presetId === 'dot-matrix') {
        drawDotModule(ctx, x, y, moduleSize, fill as string, p.dotSpacingRatio ?? 0.15)
      } else {
        ctx.save()
        ctx.globalAlpha = glassModuleAlpha
        ctx.fillStyle = fill
        ctx.fillRect(x, y, moduleSize, moduleSize)
        ctx.restore()
      }
    }
  }

  ctx.shadowBlur = 0
}

function drawDotModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number,
  fill: string,
  spacingRatio: number,
) {
  const radius = (moduleSize / 2) * (1 - spacingRatio)
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x + moduleSize / 2, y + moduleSize / 2, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawEmbossedModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number,
  fill: string,
  p: PresetParams,
) {
  const depth = p.bevelDepth ?? 3
  const angle = ((p.lightAngle ?? 135) * Math.PI) / 180
  const dx = Math.cos(angle) * depth
  const dy = Math.sin(angle) * depth

  // Shadow (dark side, away from light)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(x + dx, y + dy, moduleSize, moduleSize)
  // Highlight (light side)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x - dx, y - dy, moduleSize, moduleSize)
  // Base fill
  ctx.fillStyle = fill
  ctx.fillRect(x, y, moduleSize, moduleSize)
}

function drawGlassBackdrop(ctx: CanvasRenderingContext2D, config: RenderConfig) {
  const p = config.presetParams
  const tint = p.panelTint ?? '#7A3B5A'
  const inset = config.size * 0.06
  const panelSize = config.size - inset * 2

  // A soft diagonal light wash behind the blurred panel, so the glass has
  // something visible to refract rather than sitting on a flat color.
  ctx.save()
  const wash = ctx.createLinearGradient(0, 0, config.size, config.size)
  wash.addColorStop(0, hexToRgba(tint, 0.25))
  wash.addColorStop(0.5, hexToRgba(config.background, 0))
  wash.addColorStop(1, hexToRgba(tint, 0.18))
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, config.size, config.size)
  ctx.restore()

  // The frosted panel itself, more saturated than before so it reads as
  // glass rather than a faint smudge.
  ctx.save()
  ctx.filter = `blur(${p.blurAmount ?? 12}px)`
  ctx.fillStyle = hexToRgba(tint, Math.max(p.panelOpacity ?? 0.35, 0.3))
  roundRect(ctx, inset, inset, panelSize, panelSize, panelSize * 0.08)
  ctx.fill()
  ctx.restore()
  ctx.filter = 'none'

  // Frosted-glass rim light: a thin bright stroke along the top-left edge —
  // the single strongest visual cue that something is "glass" vs. flat fill.
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = Math.max(1, config.size * 0.003)
  roundRect(ctx, inset, inset, panelSize, panelSize, panelSize * 0.08)
  ctx.stroke()
  ctx.restore()
}

function drawGrainOverlay(ctx: CanvasRenderingContext2D, config: RenderConfig) {
  const intensity = config.presetParams.grainIntensity ?? 0.3
  const dotCount = Math.floor((config.size * config.size) / 40)
  for (let i = 0; i < dotCount; i++) {
    const x = Math.random() * config.size
    const y = Math.random() * config.size
    const shade = Math.random() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * intensity * 0.4})`
    ctx.fillRect(x, y, 1.5, 1.5)
  }
}

function drawFullFadeLogo(ctx: CanvasRenderingContext2D, config: RenderConfig) {
  const img = getCachedImage(config.logo.imageDataUrl!)
  if (!img) return
  ctx.save()
  ctx.globalAlpha = config.logo.fadeOpacity
  const scale = Math.max(config.size / img.width, config.size / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (config.size - w) / 2, (config.size - h) / 2, w, h)
  ctx.restore()
  ctx.globalAlpha = 1
}

function drawCenterLogoSync(ctx: CanvasRenderingContext2D, config: RenderConfig) {
  const img = getCachedImage(config.logo.imageDataUrl!)
  if (!img) return
  const logoSize = config.size * config.logo.sizeRatio
  const x = (config.size - logoSize) / 2
  const y = (config.size - logoSize) / 2
  const pad = config.logo.padding

  ctx.save()
  ctx.fillStyle = config.background
  if (config.logo.rounded) {
    roundRect(ctx, x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, (logoSize + pad * 2) / 6)
  } else {
    ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2)
  }
  ctx.fill()

  if (config.logo.rounded) {
    roundRect(ctx, x, y, logoSize, logoSize, logoSize / 6)
    ctx.clip()
  }
  ctx.drawImage(img, x, y, logoSize, logoSize)
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export { preloadImage }
