/**
 * Minimal status indicator — no neon, no pulse animations.
 * Uses a small dot + text. Critical states communicate through color + weight.
 */
export default function StatusBadge({ status = 'IDLE', online = false }) {
  const map = {
    IDLE:       { dot: 'bg-raah-muted',  text: 'text-raah-muted',    label: 'STANDBY' },
    RUNNING:    { dot: 'bg-raah-safe',   text: 'text-raah-safe',     label: 'RUNNING' },
    PAUSED:     { dot: 'bg-raah-warn',   text: 'text-raah-warn',     label: 'PAUSED'  },
    REPLANNING: { dot: 'bg-raah-warn',   text: 'text-raah-warn',     label: 'REPLANNING' },
    COMPLETED:  { dot: 'bg-raah-info',   text: 'text-raah-info',     label: 'COMPLETE' },
    ONLINE:     { dot: 'bg-raah-safe',   text: 'text-raah-safe',     label: 'ONLINE'  },
    OFFLINE:    { dot: 'bg-raah-danger', text: 'text-raah-danger',   label: 'OFFLINE' },
  }

  const key = online ? (status === 'RUNNING' ? 'ONLINE' : 'OFFLINE') : status
  const cfg = map[key] || map.IDLE

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-medium tracking-[.08em] ${cfg.text}`}>{cfg.label}</span>
    </div>
  )
}
