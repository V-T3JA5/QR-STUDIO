import type { QRContent } from '@/types/qr'

export interface ValidationResult {
  valid: boolean
  errors: Partial<Record<string, string>>
}

// Wi-Fi payload spec requires escaping these characters inside SSID/password
function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildPayload(content: QRContent): string {
  switch (content.type) {
    case 'url':
      return content.url
    case 'text':
      return content.text
    case 'email': {
      const params = new URLSearchParams()
      if (content.subject) params.set('subject', content.subject)
      if (content.body) params.set('body', content.body)
      const query = params.toString()
      return `mailto:${content.address}${query ? '?' + query : ''}`
    }
    case 'phone':
      return `tel:${content.number}`
    case 'wifi': {
      const ssid = escapeWifiField(content.ssid)
      const pass = content.security === 'nopass' ? '' : escapeWifiField(content.password)
      const hidden = content.hidden ? 'true' : 'false'
      return `WIFI:T:${content.security};S:${ssid};P:${pass};H:${hidden};;`
    }
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s\-().]{6,20}$/

export function validateContent(content: QRContent): ValidationResult {
  const errors: Partial<Record<string, string>> = {}

  switch (content.type) {
    case 'url': {
      if (!content.url.trim()) {
        errors.url = 'URL is required.'
        break
      }
      let candidate = content.url.trim()
      if (!/^https?:\/\//i.test(candidate)) candidate = 'https://' + candidate
      try {
        new URL(candidate)
      } catch {
        errors.url = 'Enter a valid URL.'
      }
      break
    }
    case 'text':
      if (!content.text.trim()) errors.text = 'Text cannot be empty.'
      else if (content.text.length > 2000)
        errors.text = 'Very long text will produce a dense QR code — consider shortening it.'
      break
    case 'email':
      if (!content.address.trim()) errors.address = 'Email address is required.'
      else if (!EMAIL_RE.test(content.address.trim())) errors.address = 'Enter a valid email address.'
      break
    case 'phone':
      if (!content.number.trim()) errors.number = 'Phone number is required.'
      else if (!PHONE_RE.test(content.number.trim())) errors.number = 'Enter a valid phone number.'
      break
    case 'wifi':
      if (!content.ssid.trim()) errors.ssid = 'Network name (SSID) is required.'
      if (content.security !== 'nopass' && !content.password.trim())
        errors.password = 'Password is required for WPA/WEP networks.'
      break
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// Normalizes a URL by prepending https:// if no scheme was given.
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return 'https://' + trimmed
  return trimmed
}
