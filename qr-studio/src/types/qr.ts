// ── QR content types ────────────────────────────────────────────────

export type QRContentType = 'url' | 'text' | 'email' | 'phone' | 'wifi'

export interface UrlContent {
  type: 'url'
  url: string
}

export interface TextContent {
  type: 'text'
  text: string
}

export interface EmailContent {
  type: 'email'
  address: string
  subject: string
  body: string
}

export interface PhoneContent {
  type: 'phone'
  number: string
}

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export interface WifiContent {
  type: 'wifi'
  ssid: string
  security: WifiSecurity
  password: string
  hidden: boolean
}

export type QRContent = UrlContent | TextContent | EmailContent | PhoneContent | WifiContent

// ── Error correction ────────────────────────────────────────────────

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

// ── Logo system (independent of style preset) ──────────────────────

export type LogoMode = 'none' | 'center' | 'full-fade'

export interface LogoConfig {
  mode: LogoMode
  imageDataUrl: string | null
  // center mode
  sizeRatio: number // 0..1, fraction of QR width
  padding: number // px
  rounded: boolean
  // full-fade mode
  fadeOpacity: number // 0..1
}

// ── Style preset system ─────────────────────────────────────────────

export type PresetId =
  | 'classic'
  | 'dot-matrix'
  | 'neon-glow'
  | 'duotone-gradient'
  | 'two-tone'
  | 'retro-grain'
  | 'glass-panel'
  | 'embossed'

export type PresetGroup = 'structural' | 'vivid' | 'textured'

// Each preset carries its own unique adjustable parameters, in addition
// to the universal controls (size, fg, bg, errorCorrection, margin).
export interface PresetParams {
  // dot-matrix
  dotSpacingRatio?: number
  // neon-glow
  glowIntensity?: number
  glowColor?: string
  // duotone-gradient
  gradientStart?: string
  gradientEnd?: string
  gradientAngle?: number
  // two-tone
  finderColor?: string
  dataColor?: string
  // retro-grain
  grainIntensity?: number
  // glass-panel
  blurAmount?: number
  panelOpacity?: number
  panelTint?: string
  // embossed
  bevelDepth?: number
  lightAngle?: number
}

export interface StylePreset {
  id: PresetId
  name: string
  group: PresetGroup
  description: string
  foreground: string
  background: string
  errorCorrection: ErrorCorrectionLevel
  params: PresetParams
  svgExportSupported: boolean
}

// ── Brand palette (independent feature) ─────────────────────────────

export interface BrandPalette {
  enabled: boolean
  primaryHex: string
  secondaryHex: string | null
}

// ── Full editor state (what gets saved to "Recent") ─────────────────

export interface QRDesign {
  id: string
  name: string
  content: QRContent
  presetId: PresetId
  size: number
  foreground: string
  background: string
  errorCorrection: ErrorCorrectionLevel
  margin: number
  presetParams: PresetParams
  logo: LogoConfig
  brandPalette: BrandPalette
  createdAt: number
}

// ── Reliability scoring ──────────────────────────────────────────────

export interface ReliabilityCheck {
  id: string
  label: string
  passed: boolean
  severity: 'ok' | 'warning' | 'error'
  message: string
}

export interface ReliabilityReport {
  score: number // 0-100
  checks: ReliabilityCheck[]
}
