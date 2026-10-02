import type { ErrorCorrectionLevel, PresetId, PresetParams } from '@/types/qr'

interface Props {
  presetId: PresetId
  size: number
  onSizeChange: (v: number) => void
  foreground: string
  onForegroundChange: (v: string) => void
  background: string
  onBackgroundChange: (v: string) => void
  errorCorrection: ErrorCorrectionLevel
  onErrorCorrectionChange: (v: ErrorCorrectionLevel) => void
  errorCorrectionLocked: boolean
  margin: number
  onMarginChange: (v: number) => void
  presetParams: PresetParams
  onPresetParamsChange: (v: PresetParams) => void
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-base flex-1"
        />
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="label-base">
        {label}: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  )
}

export function CustomizationPanel({
  presetId,
  size,
  onSizeChange,
  foreground,
  onForegroundChange,
  background,
  onBackgroundChange,
  errorCorrection,
  onErrorCorrectionChange,
  errorCorrectionLocked,
  margin,
  onMarginChange,
  presetParams,
  onPresetParamsChange,
}: Props) {
  const p = (key: keyof PresetParams, value: number | string) =>
    onPresetParamsChange({ ...presetParams, [key]: value })

  return (
    <div className="space-y-4">
      <Slider label="Size (px)" value={size} min={128} max={1024} step={16} onChange={onSizeChange} />
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Foreground" value={foreground} onChange={onForegroundChange} />
        <ColorField label="Background" value={background} onChange={onBackgroundChange} />
      </div>

      <div>
        <label className="label-base">
          Error correction {errorCorrectionLocked && <span className="text-accent">(locked — logo active)</span>}
        </label>
        <select
          className="input-base"
          value={errorCorrection}
          disabled={errorCorrectionLocked}
          onChange={(e) => onErrorCorrectionChange(e.target.value as ErrorCorrectionLevel)}
        >
          <option value="L">L — 7%</option>
          <option value="M">M — 15%</option>
          <option value="Q">Q — 25%</option>
          <option value="H">H — 30%</option>
        </select>
      </div>

      <Slider label="Margin (modules)" value={margin} min={4} max={12} onChange={onMarginChange} />

      {/* Per-preset unique controls */}
      {presetId === 'circuit' && (
        <ColorField
          label="Substrate color"
          value={presetParams.substrateColor ?? '#0c1f16'}
          onChange={(v) => p('substrateColor', v)}
        />
      )}
      {presetId === 'dot-matrix' && (
        <Slider
          label="Dot spacing"
          value={presetParams.dotSpacingRatio ?? 0.15}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(v) => p('dotSpacingRatio', v)}
        />
      )}
      {presetId === 'neon-glow' && (
        <>
          <Slider
            label="Glow intensity"
            value={presetParams.glowIntensity ?? 0.5}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => p('glowIntensity', v)}
          />
          <ColorField
            label="Glow color"
            value={presetParams.glowColor ?? '#ff2ec4'}
            onChange={(v) => p('glowColor', v)}
          />
        </>
      )}
      {presetId === 'duotone-gradient' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Gradient start"
              value={presetParams.gradientStart ?? '#7c5cff'}
              onChange={(v) => p('gradientStart', v)}
            />
            <ColorField
              label="Gradient end"
              value={presetParams.gradientEnd ?? '#00d9c0'}
              onChange={(v) => p('gradientEnd', v)}
            />
          </div>
          <Slider
            label="Angle"
            value={presetParams.gradientAngle ?? 45}
            min={0}
            max={360}
            onChange={(v) => p('gradientAngle', v)}
          />
        </>
      )}
      {presetId === 'two-tone' && (
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Finder color"
            value={presetParams.finderColor ?? '#ff5a3c'}
            onChange={(v) => p('finderColor', v)}
          />
          <ColorField
            label="Data color"
            value={presetParams.dataColor ?? '#111111'}
            onChange={(v) => p('dataColor', v)}
          />
        </div>
      )}
      {presetId === 'retro-grain' && (
        <Slider
          label="Grain intensity"
          value={presetParams.grainIntensity ?? 0.35}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => p('grainIntensity', v)}
        />
      )}
      {presetId === 'glass-panel' && (
        <>
          <Slider
            label="Blur amount"
            value={presetParams.blurAmount ?? 12}
            min={0}
            max={30}
            onChange={(v) => p('blurAmount', v)}
          />
          <Slider
            label="Panel opacity"
            value={presetParams.panelOpacity ?? 0.35}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => p('panelOpacity', v)}
          />
          <ColorField
            label="Panel tint"
            value={presetParams.panelTint ?? '#7c5cff'}
            onChange={(v) => p('panelTint', v)}
          />
        </>
      )}
      {presetId === 'embossed' && (
        <>
          <Slider
            label="Bevel depth"
            value={presetParams.bevelDepth ?? 3}
            min={1}
            max={8}
            onChange={(v) => p('bevelDepth', v)}
          />
          <Slider
            label="Light angle"
            value={presetParams.lightAngle ?? 135}
            min={0}
            max={360}
            onChange={(v) => p('lightAngle', v)}
          />
        </>
      )}
    </div>
  )
}
