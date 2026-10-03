import type { ErrorCorrectionLevel, LogoConfig, ReliabilityCheck, ReliabilityReport } from '@/types/qr'

// Minimum quiet zone per the QR spec is 4 modules. We enforce this as a floor
// elsewhere (in the size/margin control), but still surface it here.
export const MIN_QUIET_ZONE_MODULES = 4
export const SAFE_CONTRAST_RATIO = 4.5 // WCAG AA-ish threshold, reused as a scan-safety proxy
export const MAX_SAFE_LOGO_COVERAGE = 0.22 // 22% of QR area

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  )
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(hexToRgb(fgHex))
  const l2 = relativeLuminance(hexToRgb(bgHex))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export interface ReliabilityInput {
  foreground: string
  background: string
  errorCorrection: ErrorCorrectionLevel
  marginModules: number
  logo: LogoConfig
}

export function computeReliability(input: ReliabilityInput): ReliabilityReport {
  const checks: ReliabilityCheck[] = []

  // 1. Contrast
  const ratio = contrastRatio(input.foreground, input.background)
  checks.push({
    id: 'contrast',
    label: 'Contrast',
    passed: ratio >= SAFE_CONTRAST_RATIO,
    severity: ratio >= SAFE_CONTRAST_RATIO ? 'ok' : ratio >= 3 ? 'warning' : 'error',
    message:
      ratio >= SAFE_CONTRAST_RATIO
        ? 'Good contrast between foreground and background.'
        : 'Foreground and background have insufficient contrast for reliable scanning.',
  })

  // 2. Error correction vs logo
  const logoActive = input.logo.mode !== 'none'
  const ecOk = !logoActive || input.errorCorrection === 'Q' || input.errorCorrection === 'H'
  checks.push({
    id: 'error-correction',
    label: `Error correction: ${input.errorCorrection}`,
    passed: ecOk,
    severity: ecOk ? 'ok' : 'error',
    message: ecOk
      ? 'Error correction level is appropriate for the current configuration.'
      : 'A logo is active — raise error correction to Q or H to keep the code scannable.',
  })

  // 3. Quiet zone
  const marginOk = input.marginModules >= MIN_QUIET_ZONE_MODULES
  checks.push({
    id: 'quiet-zone',
    label: 'Quiet zone',
    passed: marginOk,
    severity: marginOk ? 'ok' : 'warning',
    message: marginOk
      ? 'Quiet zone is sufficient.'
      : `Increase margin to at least ${MIN_QUIET_ZONE_MODULES} modules for reliable scanning.`,
  })

  // 4. Logo coverage
  let coverageOk = true
  let coverageMessage = 'No logo — full data area available.'
  if (input.logo.mode === 'center') {
    const coverage = input.logo.sizeRatio * input.logo.sizeRatio
    coverageOk = coverage <= MAX_SAFE_LOGO_COVERAGE
    coverageMessage = coverageOk
      ? 'Logo coverage is within a safe range.'
      : 'Logo covers a significant portion of the QR code — consider reducing its size.'
  } else if (input.logo.mode === 'full-fade') {
    coverageOk = input.logo.fadeOpacity <= 0.35
    coverageMessage = coverageOk
      ? 'Fade opacity is low enough to preserve module contrast.'
      : 'Fade opacity is high enough that it may reduce contrast across the whole code — consider lowering it.'
  }
  checks.push({
    id: 'logo-coverage',
    label: 'Logo coverage',
    passed: coverageOk,
    severity: coverageOk ? 'ok' : 'warning',
    message: coverageMessage,
  })

  const passedCount = checks.filter((c) => c.passed).length
  const score = Math.round((passedCount / checks.length) * 100)

  return { score, checks }
}
