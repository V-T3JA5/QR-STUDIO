import { useRef } from 'react'
import { Upload } from 'lucide-react'
import type { LogoConfig, LogoMode } from '@/types/qr'

function sliderStyle(value: number, min: number, max: number): React.CSSProperties {
  return { '--range-progress': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties
}

interface Props {
  logo: LogoConfig
  onChange: (logo: LogoConfig) => void
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function LogoUploader({ logo, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    onChange({ ...logo, imageDataUrl: dataUrl })
  }

  const modes: { id: LogoMode; label: string }[] = [
    { id: 'none', label: 'No logo' },
    { id: 'center', label: 'Center' },
    { id: 'full-fade', label: 'Full-fade' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange({ ...logo, mode: m.id })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-all duration-150 ${
              logo.mode === m.id
                ? 'bg-accent text-white shadow-elevate-sm'
                : 'btn-secondary text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {logo.mode !== 'none' && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="btn-secondary w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 min-h-[44px]"
          >
            <Upload size={15} strokeWidth={2} />
            {logo.imageDataUrl ? 'Change image' : 'Upload image'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {logo.mode === 'center' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label-base mb-0">Size</label>
                  <span className="text-xs font-mono text-accent-bright font-medium">
                    {Math.round(logo.sizeRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.4}
                  step={0.01}
                  value={logo.sizeRatio}
                  onChange={(e) => onChange({ ...logo, sizeRatio: Number(e.target.value) })}
                  className="slider w-full"
                  style={sliderStyle(logo.sizeRatio, 0.1, 0.4)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label-base mb-0">Padding</label>
                  <span className="text-xs font-mono text-accent-bright font-medium">{logo.padding}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={logo.padding}
                  onChange={(e) => onChange({ ...logo, padding: Number(e.target.value) })}
                  className="slider w-full"
                  style={sliderStyle(logo.padding, 0, 24)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={logo.rounded}
                  onChange={(e) => onChange({ ...logo, rounded: e.target.checked })}
                  className="accent-accent-bright"
                />
                Rounded corners
              </label>
            </>
          )}

          {logo.mode === 'full-fade' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-base mb-0">Fade opacity</label>
                <span className="text-xs font-mono text-accent-bright font-medium">
                  {Math.round(logo.fadeOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.4}
                step={0.01}
                value={logo.fadeOpacity}
                onChange={(e) => onChange({ ...logo, fadeOpacity: Number(e.target.value) })}
                className="slider w-full"
                style={sliderStyle(logo.fadeOpacity, 0.05, 0.4)}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
