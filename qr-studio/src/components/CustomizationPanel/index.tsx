import type { ECLevel, QRState } from '@/types/qr';
import { PRESET_BY_ID } from '@/presets';
import { ColorField, Range, Section, Segmented } from '@/components/ui';

interface Props {
  state: QRState;
  onUpdate: (patch: Partial<QRState>) => void;
  onParam: (key: string, value: number | string) => void;
}

const EC_NOTE: Record<ECLevel, string> = {
  L: 'Recovers about 7% of damage. Smallest code.',
  M: 'Recovers about 15%. A good everyday default.',
  Q: 'Recovers about 25%. Suits small logos.',
  H: 'Recovers about 30%. Best for logos and rough surfaces.',
};

export default function CustomizationPanel({ state, onUpdate, onParam }: Props) {
  const preset = PRESET_BY_ID[state.presetId];
  const logoOn = state.logo.mode !== 'none';

  return (
    <div className="space-y-8">
      <Section title="Size and colour">
        <Range label="Size" value={state.size} min={128} max={1024} step={16} unit=" px" onChange={(size) => onUpdate({ size })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Primary" value={state.fg} hint="The main module colour." onChange={(fg) => onUpdate({ fg })} />
          <ColorField
            label="Secondary"
            value={state.secondary}
            disabled={!preset.usesSecondary}
            hint={preset.usesSecondary ? preset.secondaryHint : `${preset.name} uses one colour.`}
            onChange={(secondary) => onUpdate({ secondary })}
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
          spec.kind === 'choice' ? (
            <div key={spec.key}>
              <span className="mb-1.5 block text-sm font-medium">{spec.label}</span>
              <Segmented<string>
                label={spec.label}
                value={String(state.params[spec.key])}
                options={spec.options ?? []}
                onChange={(v) => onParam(spec.key, v)}
              />
            </div>
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
    </div>
  );
}
