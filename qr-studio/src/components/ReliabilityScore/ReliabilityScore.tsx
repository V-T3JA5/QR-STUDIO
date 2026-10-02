import type { ReliabilityReport } from '@/types/qr'

interface Props {
  report: ReliabilityReport
}

const SEVERITY_ICON: Record<string, string> = { ok: '✓', warning: '⚠', error: '✗' }
const SEVERITY_COLOR: Record<string, string> = {
  ok: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
}

export function ReliabilityScore({ report }: Props) {
  const barColor = report.score >= 85 ? 'bg-emerald-500' : report.score >= 60 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Scan reliability</span>
        <span className="text-lg font-display font-semibold">{report.score}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${report.score}%` }} />
      </div>
      <ul className="space-y-1.5">
        {report.checks.map((check) => (
          <li key={check.id} className="flex gap-2 text-xs">
            <span className={SEVERITY_COLOR[check.severity]}>{SEVERITY_ICON[check.severity]}</span>
            <span className="text-neutral-600 dark:text-neutral-300">{check.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
