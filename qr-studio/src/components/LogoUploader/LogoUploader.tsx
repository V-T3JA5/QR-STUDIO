import { useRef } from 'react'
import type { LogoConfig, LogoMode } from '@/types/qr'

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
            className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] ${
              logo.mode === m.id
                ? 'bg-accent text-white'
                : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300'
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
            className="w-full py-2 rounded-lg border border-dashed border-black/20 dark:border-white/20 text-sm text-neutral-500 min-h-[44px]"
          >
            {logo.imageDataUrl ? 'Change image' : 'Upload image'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {logo.mode === 'center' && (
            <>
              <div>
                <label className="label-base">Size: {Math.round(logo.sizeRatio * 100)}%</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.4}
                  step={0.01}
                  value={logo.sizeRatio}
                  onChange={(e) => onChange({ ...logo, sizeRatio: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>
              <div>
                <label className="label-base">Padding: {logo.padding}px</label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={logo.padding}
                  onChange={(e) => onChange({ ...logo, padding: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={logo.rounded}
                  onChange={(e) => onChange({ ...logo, rounded: e.target.checked })}
                />
                Rounded corners
              </label>
            </>
          )}

          {logo.mode === 'full-fade' && (
            <div>
              <label className="label-base">Fade opacity: {Math.round(logo.fadeOpacity * 100)}%</label>
              <input
                type="range"
                min={0.05}
                max={0.4}
                step={0.01}
                value={logo.fadeOpacity}
                onChange={(e) => onChange({ ...logo, fadeOpacity: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
