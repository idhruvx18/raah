import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Command Center' },
  { to: '/scenarios',  label: 'Scenarios' },
  { to: '/risk',       label: 'Risk Analysis' },
  { to: '/planning',   label: 'Path Planning' },
  { to: '/analytics',  label: 'Analytics' },
  { to: '/technology', label: 'Technology' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isDark = location.pathname === '/' && !scrolled

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [location])

  const baseCls = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-smooth`
  const bgCls = scrolled || location.pathname !== '/'
    ? 'bg-raah-bg/95 backdrop-blur-sm border-b border-raah-border'
    : 'bg-transparent'

  const textCls = scrolled || location.pathname !== '/' ? 'text-raah-body' : 'text-white/90'
  const logoTextCls = scrolled || location.pathname !== '/' ? 'text-raah-heading' : 'text-white'

  return (
    <nav className={`${baseCls} ${bgCls}`}>
      <div className="raah-container h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className={`w-7 h-7 rounded-sm flex items-center justify-center transition-colors
            ${scrolled || location.pathname !== '/' ? 'bg-raah-heading' : 'bg-white/15 border border-white/30'}`}>
            <span className={`text-xs font-semibold tracking-tight leading-none
              ${scrolled || location.pathname !== '/' ? 'text-raah-bg' : 'text-white'}`}>R</span>
          </div>
          <span className={`text-sm font-semibold tracking-[.06em] transition-colors ${logoTextCls}`}>
            RAAH
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-medium tracking-[.04em] rounded-sm transition-all duration-150
                ${isActive
                  ? (scrolled || location.pathname !== '/' ? 'text-raah-heading bg-raah-surface' : 'text-white bg-white/15')
                  : (scrolled || location.pathname !== '/' ? 'text-raah-muted hover:text-raah-heading hover:bg-raah-surface' : 'text-white/70 hover:text-white hover:bg-white/10')
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <NavLink to="/results" className={`text-xs font-medium tracking-[.04em] transition-colors ${textCls} hover:opacity-70`}>
            Results
          </NavLink>
          <NavLink to="/research" className={`text-xs font-medium tracking-[.04em] transition-colors ${textCls} hover:opacity-70`}>
            Research
          </NavLink>
          <Link
            to="/dashboard"
            className={`px-4 py-1.5 text-xs font-medium tracking-[.04em] rounded-sm transition-all duration-200
              ${scrolled || location.pathname !== '/'
                ? 'bg-raah-heading text-raah-bg hover:bg-raah-body'
                : 'bg-white text-raah-heading hover:bg-white/90'
              }`}
          >
            Launch
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className={`md:hidden p-2 rounded-sm transition-colors ${textCls}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-raah-bg border-b border-raah-border">
          <div className="raah-container py-4 flex flex-col gap-1">
            {[...NAV_LINKS, { to: '/results', label: 'Results' }, { to: '/research', label: 'Research' }, { to: '/team', label: 'Team' }].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2.5 text-sm font-medium rounded-sm transition-colors
                  ${isActive ? 'text-raah-heading bg-raah-surface' : 'text-raah-body hover:bg-raah-surface'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-raah-border mt-2">
              <Link to="/dashboard" className="btn-primary w-full justify-center">
                Launch Simulation
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
