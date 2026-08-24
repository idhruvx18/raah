import { getRiskLevel } from '../../store/simulationStore'
import AnimatedNumber from './AnimatedNumber'

/**
 * Premium risk indicator — no neon, no circular gauge.
 * Uses typography + a thin horizontal bar.
 */
export default function RiskScale({ score = 12, ttc = null, primaryThreat = null, compact = false }) {
  const lvl = getRiskLevel(score)

  const trackColors = [
    { min: 0,  max: 30,  color: '#3D7A5C' },
    { min: 30, max: 55,  color: '#B8843A' },
    { min: 55, max: 75,  color: '#A0402D' },
    { min: 75, max: 100, color: '#7A1F10' },
  ]

  const barColor = trackColors.find((c) => score <= c.max)?.color || '#7A1F10'

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-raah-heading">
          <AnimatedNumber value={score} decimals={0} />
        </div>
        <div>
          <div className="text-[10px] font-medium tracking-[.08em] uppercase" style={{ color: barColor }}>
            {lvl.label}
          </div>
          <div className="w-16 h-0.5 bg-raah-border rounded-full mt-1 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-smooth"
              style={{ width: `${score}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Label */}
      <p className="raah-label mb-3">Risk Score</p>

      {/* Score + level */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-5xl font-semibold tabular-nums tracking-[-0.03em] text-raah-heading">
          <AnimatedNumber value={score} decimals={0} />
        </span>
        <span
          className="text-sm font-medium tracking-[.08em] uppercase transition-colors duration-500"
          style={{ color: barColor }}
        >
          {lvl.label}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-1 bg-raah-border rounded-full overflow-hidden mb-5">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-smooth"
          style={{ width: `${score}%`, backgroundColor: barColor }}
        />
        {/* Level markers */}
        {[30, 55, 75].map((m) => (
          <div
            key={m}
            className="absolute top-0 w-px h-full bg-raah-bg opacity-60"
            style={{ left: `${m}%` }}
          />
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="space-y-2.5">
        {ttc !== null && (
          <div className="flex items-center justify-between">
            <span className="raah-label">TTC</span>
            <span className="text-sm font-medium tabular-nums text-raah-heading">
              <AnimatedNumber value={ttc} decimals={1} /> s
            </span>
          </div>
        )}
        {primaryThreat && (
          <div className="flex items-center justify-between">
            <span className="raah-label">Primary threat</span>
            <span className="text-xs font-medium text-raah-body font-mono uppercase">
              {primaryThreat.split('-').slice(0, 2).join(' #')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
