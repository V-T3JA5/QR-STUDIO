import type { QRContent, QRContentType, WifiSecurity } from '@/types/qr'
import type { ValidationResult } from '@/qr/payload'

interface Props {
  content: QRContent
  validation: ValidationResult
  onChange: (content: QRContent) => void
}

export function defaultContentFor(type: QRContentType): QRContent {
  switch (type) {
    case 'url':
      return { type: 'url', url: '' }
    case 'text':
      return { type: 'text', text: '' }
    case 'email':
      return { type: 'email', address: '', subject: '', body: '' }
    case 'phone':
      return { type: 'phone', number: '' }
    case 'wifi':
      return { type: 'wifi', ssid: '', security: 'WPA', password: '', hidden: false }
  }
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function ContentForm({ content, validation, onChange }: Props) {
  const errors = validation.errors

  if (content.type === 'url') {
    return (
      <Field label="URL" error={errors.url}>
        <input
          className="input-base"
          type="text"
          placeholder="https://example.com"
          value={content.url}
          onChange={(e) => onChange({ ...content, url: e.target.value })}
        />
      </Field>
    )
  }

  if (content.type === 'text') {
    return (
      <Field label="Text" error={errors.text}>
        <textarea
          className="input-base min-h-[100px] resize-y"
          placeholder="Hello from QR Studio!"
          value={content.text}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
        />
      </Field>
    )
  }

  if (content.type === 'email') {
    return (
      <div className="space-y-3">
        <Field label="Email address" error={errors.address}>
          <input
            className="input-base"
            type="email"
            placeholder="user@example.com"
            value={content.address}
            onChange={(e) => onChange({ ...content, address: e.target.value })}
          />
        </Field>
        <Field label="Subject (optional)">
          <input
            className="input-base"
            type="text"
            value={content.subject}
            onChange={(e) => onChange({ ...content, subject: e.target.value })}
          />
        </Field>
        <Field label="Message (optional)">
          <textarea
            className="input-base min-h-[80px] resize-y"
            value={content.body}
            onChange={(e) => onChange({ ...content, body: e.target.value })}
          />
        </Field>
      </div>
    )
  }

  if (content.type === 'phone') {
    return (
      <Field label="Phone number" error={errors.number}>
        <input
          className="input-base"
          type="tel"
          placeholder="+1 555 123 4567"
          value={content.number}
          onChange={(e) => onChange({ ...content, number: e.target.value })}
        />
      </Field>
    )
  }

  // wifi
  return (
    <div className="space-y-3">
      <Field label="Network name (SSID)" error={errors.ssid}>
        <input
          className="input-base"
          type="text"
          value={content.ssid}
          onChange={(e) => onChange({ ...content, ssid: e.target.value })}
        />
      </Field>
      <Field label="Security type">
        <select
          className="input-base"
          value={content.security}
          onChange={(e) => onChange({ ...content, security: e.target.value as WifiSecurity })}
        >
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">No password</option>
        </select>
      </Field>
      {content.security !== 'nopass' && (
        <Field label="Password" error={errors.password}>
          <input
            className="input-base"
            type="password"
            value={content.password}
            onChange={(e) => onChange({ ...content, password: e.target.value })}
          />
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={content.hidden}
          onChange={(e) => onChange({ ...content, hidden: e.target.checked })}
        />
        Hidden network
      </label>
    </div>
  )
}
