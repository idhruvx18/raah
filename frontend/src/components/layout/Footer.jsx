import { Link } from 'react-router-dom'

export default function Footer({ dark = false }) {
  const bg  = dark ? 'bg-raah-dark border-raah-dark-alt'   : 'bg-raah-surface border-raah-border'
  const txt = dark ? 'text-white/40'  : 'text-raah-muted'
  const hdg = dark ? 'text-white/70'  : 'text-raah-body'
  const lnk = dark ? 'text-white/40 hover:text-white/70' : 'text-raah-muted hover:text-raah-body'

  return (
    <footer className={`border-t ${bg}`}>
      <div className="raah-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${dark ? 'bg-white/10' : 'bg-raah-heading'}`}>
                <span className={`text-xs font-semibold ${dark ? 'text-white/70' : 'text-raah-bg'}`}>R</span>
              </div>
              <span className={`text-sm font-semibold tracking-[.06em] ${hdg}`}>RAAH</span>
            </div>
            <p className={`text-xs leading-relaxed max-w-[200px] ${txt}`}>
              Risk-Aware Adaptive Autonomous Navigation.<br/>
              The safer way forward.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className={`text-xs font-medium tracking-[.08em] uppercase mb-4 ${hdg}`}>Platform</p>
            <ul className="space-y-2.5">
              {[
                ['/dashboard', 'Command Center'],
                ['/scenarios',  'Scenarios'],
                ['/risk',       'Risk Analysis'],
                ['/planning',   'Path Planning'],
              ].map(([to, label]) => (
                <li key={to}><Link to={to} className={`text-xs transition-colors ${lnk}`}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Research */}
          <div>
            <p className={`text-xs font-medium tracking-[.08em] uppercase mb-4 ${hdg}`}>Research</p>
            <ul className="space-y-2.5">
              {[
                ['/analytics',  'Analytics'],
                ['/results',    'Results'],
                ['/technology', 'Technology'],
                ['/research',   'References'],
              ].map(([to, label]) => (
                <li key={to}><Link to={to} className={`text-xs transition-colors ${lnk}`}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <p className={`text-xs font-medium tracking-[.08em] uppercase mb-4 ${hdg}`}>About</p>
            <ul className="space-y-2.5">
              {[
                ['/team',      'Team'],
                ['/research',  'Research'],
              ].map(([to, label]) => (
                <li key={to}><Link to={to} className={`text-xs transition-colors ${lnk}`}>{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className={`border-t ${dark ? 'border-white/10' : 'border-raah-border'} pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
          <p className={`text-xs ${txt}`}>
            SIH 2026 — Problem Statement SIH26037 · Robotics &amp; Drones · Software Category
          </p>
          <p className={`text-xs ${txt}`}>
            Simulated values — not real experimental results
          </p>
        </div>
      </div>
    </footer>
  )
}
