import { PRESETS } from '@/presets'
import type { PresetGroup, PresetId } from '@/types/qr'

const GROUP_LABELS: Record<PresetGroup, string> = {
  structural: 'Structural',
  vivid: 'Vivid',
  textured: 'Textured',
}

interface Props {
  activeId: PresetId
  onSelect: (id: PresetId) => void
}

export function StyleSelector({ activeId, onSelect }: Props) {
  const groups: PresetGroup[] = ['structural', 'vivid', 'textured']

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group}>
          <h4 className="label-base uppercase tracking-wide">{GROUP_LABELS[group]}</h4>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.filter((p) => p.group === group).map((preset) => {
              const isActive = preset.id === activeId
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelect(preset.id)}
                  title={preset.description}
                  className={`rounded-xl p-3 text-left border transition-all min-h-[64px] ${
                    isActive
                      ? 'border-accent-bright ring-2 ring-accent-bright/30 bg-accent-bright/5 shadow-elevate-sm'
                      : 'border-black/10 dark:border-white/10 shadow-elevate-sm hover:border-accent-bright/40 hover:-translate-y-px'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-md mb-2"
                    style={{ background: preset.foreground }}
                    aria-hidden
                  />
                  <span className="text-xs font-medium">{preset.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
