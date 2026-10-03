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
    <div className="space-y-5">
      {groups.map((group, groupIndex) => (
        <div key={group}>
          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-[10px] font-mono text-accent-bright">{String(groupIndex + 1).padStart(2, '0')}</span>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              {GROUP_LABELS[group]}
            </h4>
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.filter((p) => p.group === group).map((preset) => {
              const isActive = preset.id === activeId
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelect(preset.id)}
                  title={preset.description}
                  className={`relative rounded-xl p-3 text-left border transition-all min-h-[72px] ${
                    isActive
                      ? 'border-accent-bright ring-2 ring-accent-bright/30 bg-accent-bright/5 shadow-elevate-sm'
                      : 'border-black/10 dark:border-white/10 shadow-elevate-sm hover:border-accent-bright/40 hover:-translate-y-px'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent-bright" aria-hidden />
                  )}
                  <div
                    className="w-7 h-7 rounded-lg mb-2.5 shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${preset.foreground} 0%, ${preset.foreground} 55%, ${preset.background} 56%, ${preset.background} 100%)`,
                      border: '1px solid rgba(120,120,130,0.2)',
                    }}
                    aria-hidden
                  />
                  <span className="text-[13px] font-medium tracking-tight leading-tight block">{preset.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
