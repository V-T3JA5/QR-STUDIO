import type { ECLevel, QRState } from '@/types/qr';
import { PRESET_BY_ID } from '@/presets';
import { deriveSecond } from '@/qr/color';
import { ColorField, Range, Section, Segmented } from '@/components/ui';

interface Props {
  state: QRState;
  onUpdate: (patch: Partial<QRState>) => void;
  onParam: (key: string, value: number | string) => void;
  onBrand: (patch: Partial<QRState['brand']>) => void;
  onApplyBrand: () => void;
}

const EC_NOTE: Record<ECLevel, string> = {
  L: 'Recovers about 7% of damage. Smallest code.',
  M: 'Recovers about 15%. A good everyday default.',
  Q: 'Recovers about 25%. Suits small logos.',
  H: 'Recovers about 30%. Best for logos and rough surfaces.',
};

export default function CustomizationPanel({ state, onUpdate, onParam, onBrand, onApplyBrand }: Props) {
  const preset = PRESET_BY_ID[state.presetId];
  const logoOn = state.logo.mode !== 'none';
  const hasSecond = state.brand.c2 !== '';

  return (
    <div className="space-y-8">
      <Section title="Size and colour">
        <Range label="Size" value={state.size} min={128} max={1024} step={16} unit=" px" onChange={(size) => onUpdate({ size })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Foreground"
            value={state.fg}
            disabled={!preset.usesFg}
            hint={preset.usesFg ? undefined : `${preset.name} sets its own module colours.`}
            onChange={(fg) => onUpdate({ fg })}
          />
          <ColorField label="Background" value={state.bg} onChange={(bg) => onUpdate({ bg })} />
        </div>
      </Section>

      <Section title="Reliability settings">
        <div>
          <span className="mb-1.5 block text-sm font-medium">Error correction</span>
          <Segmented<ECLevel>
            label="Error correction level"
            value={state.ec}
            onChange={(ec) => onUpdate({ ec })}
            options={(['L', 'M', 'Q', 'H'] as ECLevel[]).map((v) => ({
              value: v,
              label: v,
              disabled: logoOn && (v === 'L' || v === 'M'),
              title: logoOn && (v === 'L' || v === 'M') ? 'Locked to Q or H while a logo is in use' : undefined,
            }))}
          />
          <p className="mt-1.5 text-sm text-ink-secondary">
            {EC_NOTE[state.ec]}
            {logoOn && ' L and M are locked while a logo is in use.'}
          </p>
        </div>
        <Range label="Margin" value={state.margin} min={4} max={16} unit=" modules" onChange={(margin) => onUpdate({ margin })} />
        <p className="-mt-3 text-sm text-ink-secondary">Never below 4 modules. Scanners need that blank border to find the code.</p>
      </Section>

      <Section title={`${preset.name} options`} hint={preset.blurb}>
        {preset.params.map((spec) =>
          spec.kind === 'color' ? (
            <ColorField key={spec.key} label={spec.label} value={String(state.params[spec.key])} onChange={(v) => onParam(spec.key, v)} />
          ) : (
            <Range
              key={spec.key}
              label={spec.label}
              value={Number(state.params[spec.key])}
              min={spec.min ?? 0}
              max={spec.max ?? 100}
              step={spec.step}
              unit={spec.unit}
              onChange={(v) => onParam(spec.key, v)}
            />
          ),
        )}
      </Section>

      <Section title="Brand palette" hint="Enter one or two brand colours and apply them to the current style. You can keep editing afterwards.">
        <ColorField label="Primary colour" value={state.brand.c1} onChange={(c1) => onBrand({ c1 })} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={hasSecond}
            onChange={(e) => onBrand({ c2: e.target.checked ? deriveSecond(state.brand.c1) : '' })}
            className="h-5 w-5 cursor-pointer"
            style={{ accentColor: 'rgb(var(--ink-primary))' }}
          />
          Add a second colour
        </label>
        {hasSecond ? (
          <ColorField label="Secondary colour" value={state.brand.c2} onChange={(c2) => onBrand({ c2 })} />
        ) : (
          <p className="-mt-3 text-sm text-ink-secondary">A matching second colour is worked out from the first.</p>
        )}
        <button type="button" className="btn btn-solid w-full" onClick={onApplyBrand}>
          Apply to {preset.name}
        </button>
      </Section>
    </div>
  );
}
