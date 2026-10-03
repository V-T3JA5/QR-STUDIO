import type { PresetId } from '@/types/qr';
import { GROUPS, PRESETS, PRESET_BY_ID, defaultParams } from '@/presets';
import { encodeMatrix } from '@/qr/encoder';
import { buildSvg } from '@/qr/renderer';

const cache = new Map<PresetId, string>();
function thumb(id: PresetId): string {
  let svg = cache.get(id);
  if (!svg) {
    const p = PRESET_BY_ID[id];
    svg = buildSvg({
      matrix: encodeMatrix('QR Studio', 'M'),
      fg: p.defaults.fg, bg: p.defaults.bg, margin: 2, presetId: id, params: defaultParams(id),
      logo: { mode: 'none', dataUrl: null, scale: 0.2, opacity: 0.2 },
    });
    cache.set(id, svg);
  }
  return svg;
}

export default function StyleSelector({ value, onSelect }: { value: PresetId; onSelect: (id: PresetId) => void }) {
  return (
    <div className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g}>
          <h3 className="mb-2.5 font-display text-base">{g}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PRESETS.filter((p) => p.group === g).map((p) => {
              const on = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(p.id)}
                  title={p.blurb}
                  className={`rounded-md bg-surface p-2.5 text-left transition-shadow ${on ? 'ring-2 ring-ink-primary' : 'ring-1 ring-border hover:ring-ink-secondary'}`}
                >
                  <div className="overflow-hidden rounded-sm" dangerouslySetInnerHTML={{ __html: thumb(p.id) }} />
                  <span className={`mt-2 inline-block rounded-sm px-1.5 py-0.5 text-sm font-medium ${on ? 'bg-active-fill text-active-text' : ''}`}>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
