import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  BrandPalette,
  ErrorCorrectionLevel,
  LogoConfig,
  PresetId,
  PresetParams,
  QRContent,
  QRDesign,
} from '@/types/qr'
import { buildPayload, validateContent } from '@/qr/payload'
import { renderQRAsync, type RenderConfig } from '@/qr/renderer'
import { computeReliability } from '@/qr/reliability'
import { getPreset, DEFAULT_PRESET_ID } from '@/presets'

const DEFAULT_LOGO: LogoConfig = {
  mode: 'none',
  imageDataUrl: null,
  sizeRatio: 0.2,
  padding: 8,
  rounded: true,
  fadeOpacity: 0.15,
}

const DEFAULT_BRAND: BrandPalette = {
  enabled: false,
  primaryHex: '#7c5cff',
  secondaryHex: null,
}

function defaultContent(): QRContent {
  return { type: 'url', url: '' }
}

// Error correction must be Q or H whenever a logo is active — this is
// enforced here, not just suggested, so a broken combination can never render.
function resolveErrorCorrection(requested: ErrorCorrectionLevel, logo: LogoConfig): ErrorCorrectionLevel {
  if (logo.mode === 'none') return requested
  if (requested === 'Q' || requested === 'H') return requested
  return 'Q'
}

// Quiet zone floor — never allow a margin that would break scanning.
const MIN_MARGIN = 4

export function useQR() {
  const [content, setContent] = useState<QRContent>(defaultContent())
  const [presetId, setPresetId] = useState<PresetId>(DEFAULT_PRESET_ID)
  const preset = getPreset(presetId)

  const [size, setSize] = useState(512)
  const [foreground, setForeground] = useState(preset.foreground)
  const [background, setBackground] = useState(preset.background)
  const [errorCorrection, setErrorCorrectionRaw] = useState<ErrorCorrectionLevel>(preset.errorCorrection)
  const [margin, setMarginRaw] = useState(MIN_MARGIN)
  const [presetParams, setPresetParams] = useState<PresetParams>(preset.params)
  const [logo, setLogo] = useState<LogoConfig>(DEFAULT_LOGO)
  const [brandPalette, setBrandPalette] = useState<BrandPalette>(DEFAULT_BRAND)

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const renderToken = useRef(0)

  const setErrorCorrection = (level: ErrorCorrectionLevel) => setErrorCorrectionRaw(level)
  const setMargin = (m: number) => setMarginRaw(Math.max(MIN_MARGIN, m))

  function applyPreset(id: PresetId) {
    const p = getPreset(id)
    setPresetId(id)
    setForeground(p.foreground)
    setBackground(p.background)
    setErrorCorrectionRaw(p.errorCorrection)
    setPresetParams(p.params)
  }

  // Brand palette derives accent colors into the active preset's params
  // without touching structural params (shape/spacing/etc).
  useEffect(() => {
    if (!brandPalette.enabled) return
    setForeground(brandPalette.primaryHex)
    if (brandPalette.secondaryHex) {
      setPresetParams((prev) => ({
        ...prev,
        gradientStart: brandPalette.primaryHex,
        gradientEnd: brandPalette.secondaryHex!,
        glowColor: brandPalette.primaryHex,
        finderColor: brandPalette.primaryHex,
      }))
    }
  }, [brandPalette])

  const validation = useMemo(() => validateContent(content), [content])
  const payload = useMemo(() => buildPayload(content), [content])
  const resolvedEC = resolveErrorCorrection(errorCorrection, logo)

  const reliability = useMemo(
    () =>
      computeReliability({
        foreground,
        background,
        errorCorrection: resolvedEC,
        marginModules: margin,
        logo,
      }),
    [foreground, background, resolvedEC, margin, logo],
  )

  const renderConfig: RenderConfig = useMemo(
    () => ({
      payload: payload || ' ', // qrcode lib rejects empty strings; render a placeholder space
      size,
      marginModules: margin,
      foreground,
      background,
      errorCorrection: resolvedEC,
      presetId,
      presetParams,
      logo,
    }),
    [payload, size, margin, foreground, background, resolvedEC, presetId, presetParams, logo],
  )

  useEffect(() => {
    if (!validation.valid) {
      setCanvas(null)
      return
    }
    const token = ++renderToken.current
    renderQRAsync(renderConfig).then((c) => {
      if (renderToken.current === token) setCanvas(c)
    })
  }, [renderConfig, validation.valid])

  function toDesign(name = 'Untitled QR'): QRDesign {
    return {
      id: crypto.randomUUID(),
      name,
      content,
      presetId,
      size,
      foreground,
      background,
      errorCorrection: resolvedEC,
      margin,
      presetParams,
      logo,
      brandPalette,
      createdAt: Date.now(),
    }
  }

  function loadDesign(design: QRDesign) {
    setContent(design.content)
    setPresetId(design.presetId)
    setSize(design.size)
    setForeground(design.foreground)
    setBackground(design.background)
    setErrorCorrectionRaw(design.errorCorrection)
    setMarginRaw(design.margin)
    setPresetParams(design.presetParams)
    setLogo(design.logo)
    setBrandPalette(design.brandPalette)
  }

  return {
    content,
    setContent,
    validation,
    payload,
    presetId,
    preset,
    applyPreset,
    size,
    setSize,
    foreground,
    setForeground,
    background,
    setBackground,
    errorCorrection: resolvedEC,
    setErrorCorrection,
    margin,
    setMargin,
    presetParams,
    setPresetParams,
    logo,
    setLogo,
    brandPalette,
    setBrandPalette,
    canvas,
    reliability,
    renderConfig,
    toDesign,
    loadDesign,
  }
}

export type UseQRReturn = ReturnType<typeof useQR>
