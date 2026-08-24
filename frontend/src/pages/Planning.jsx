import { useEffect, useRef, useState } from 'react'
import { useSimStore } from '../store/simulationStore'
import { useIntersection } from '../components/ui/useIntersection'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

// ── Interactive planning canvas ───────────────────────────────────────────────
const LAYERS = {
  CURRENT_PATH:      { id: 'CURRENT_PATH',      label: 'Current Path',         color: '#B0ADA8' },
  PREDICTED_PATH:    { id: 'PREDICTED_PATH',     label: 'Predicted Obstacle',   color: '#B8843A' },
  RISK_MAP:          { id: 'RISK_MAP',           label: 'Risk Map',             color: '#A0402D' },
  OBJECT_TRAJECTORIES:{ id: 'OBJECT_TRAJECTORIES', label: 'Object Trajectories', color: '#3A6090' },
}

function PlanningCanvas({ activeLayers }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const tickRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    const render = () => {
      tickRef.current++
      const t = tickRef.current
      ctx.clearRect(0, 0, W, H)

      // Background / road
      ctx.fillStyle = '#1E1D1B'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#232220'; ctx.fillRect(W * 0.2, 0, W * 0.6, H)
      ctx.strokeStyle = '#303030'; ctx.lineWidth = 1
      ctx.strokeRect(W * 0.2, 0, W * 0.6, H)

      const cx = W / 2

      // Risk map
      if (activeLayers.RISK_MAP) {
        const rg = ctx.createRadialGradient(cx + 10, H * 0.42, 0, cx + 10, H * 0.42, 70)
        rg.addColorStop(0, 'rgba(160,64,45,0.35)')
        rg.addColorStop(0.5,'rgba(160,64,45,0.12)')
        rg.addColorStop(1,  'rgba(160,64,45,0)')
        ctx.fillStyle = rg
        ctx.beginPath(); ctx.arc(cx + 10, H * 0.42, 70, 0, Math.PI * 2); ctx.fill()
      }

      // Current path
      if (activeLayers.CURRENT_PATH) {
        ctx.strokeStyle = 'rgba(176,173,168,0.6)'; ctx.lineWidth = 1.5
        ctx.setLineDash([8, 10])
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx, H * 0.85)
        ctx.lineTo(cx, H * 0.5)
        ctx.quadraticCurveTo(cx, H * 0.3, cx, H * 0.1)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Alternative path (accent)
      {
        ctx.strokeStyle = '#C17A3A'; ctx.lineWidth = 2
        ctx.setLineDash([])
        ctx.lineCap = 'round'
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.moveTo(cx, H * 0.85)
        ctx.bezierCurveTo(cx, H * 0.65, cx - 50, H * 0.5, cx - 60, H * 0.35)
        ctx.bezierCurveTo(cx - 50, H * 0.25, cx - 20, H * 0.15, cx, H * 0.08)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Object trajectories
      if (activeLayers.OBJECT_TRAJECTORIES) {
        const ox = cx + 50 + Math.sin(t * 0.02) * 10
        const oy = H * 0.3 + Math.cos(t * 0.015) * 8
        ctx.strokeStyle = 'rgba(58, 96, 144, 0.7)'; ctx.lineWidth = 1
        ctx.setLineDash([5, 7])
        ctx.beginPath()
        ctx.moveTo(ox + 40, oy - 20)
        ctx.lineTo(ox, oy)
        ctx.lineTo(ox - 30, oy + 20)
        ctx.stroke()
        ctx.setLineDash([])

        // Object
        ctx.fillStyle = '#4A5060'; ctx.strokeStyle = 'rgba(58,96,144,0.7)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.roundRect(ox - 8, oy - 12, 16, 24, 2); ctx.fill(); ctx.stroke()
      }

      // Predicted obstacle trajectory
      if (activeLayers.PREDICTED_PATH) {
        const bx = cx + 60 + Math.sin(t * 0.025) * 8
        const by = H * 0.5 + Math.cos(t * 0.018) * 6
        ctx.strokeStyle = 'rgba(184,132,58,0.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([4,6])
        ctx.beginPath()
        ctx.moveTo(bx, by)
        ctx.lineTo(bx - 40, by + 30); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#4A4040'; ctx.strokeStyle = 'rgba(184,132,58,0.7)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.roundRect(bx - 5, by - 11, 10, 22, 2); ctx.fill(); ctx.stroke()
      }

      // Ego vehicle
      ctx.fillStyle = '#F0EDE8'; ctx.strokeStyle = '#C17A3A'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.roundRect(cx - 10, H * 0.78, 20, 38, 4); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#C17A3A'; ctx.fillRect(cx - 8, H * 0.78 + 2, 16, 5)

      // Destination marker
      ctx.fillStyle = '#3D7A5C'; ctx.strokeStyle = '#3D7A5C'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, H * 0.07, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(61,122,92,0.2)'
      ctx.beginPath(); ctx.arc(cx, H * 0.07, 14, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#6A9A80'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('DEST', cx, H * 0.07 + 3)

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [activeLayers])

  return (
    <canvas ref={canvasRef} width={600} height={480} className="w-full h-full object-contain" />
  )
}

// ── A* pseudo-visualization ───────────────────────────────────────────────────
function AStarViz() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const COLS = 16, ROWS = 10
    const cw = W / COLS, ch = H / ROWS

    const CLOSED = new Set([
      '4,8','5,8','6,8','7,8','8,8','4,7','5,7','6,7','7,7','5,6','6,6',
    ])
    const PATH = [[4,8],[5,7],[6,6],[7,5],[8,4],[9,3],[10,2],[11,1]]
    const OBSTACLE = [[8,7],[8,6],[8,5],[9,7],[9,6]]

    ctx.fillStyle = '#1E1D1B'; ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#2A2826'; ctx.lineWidth = 0.5
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke()
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(W, r * ch); ctx.stroke()
    }

    // Obstacle cells
    OBSTACLE.forEach(([c, r]) => {
      ctx.fillStyle = 'rgba(160,64,45,0.25)'; ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2)
    })

    // Closed set
    CLOSED.forEach((key) => {
      const [c, r] = key.split(',').map(Number)
      ctx.fillStyle = 'rgba(58,96,144,0.15)'; ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2)
    })

    // Path
    PATH.forEach(([c, r], i) => {
      const alpha = 0.3 + (i / PATH.length) * 0.5
      ctx.fillStyle = `rgba(193,122,58,${alpha})`; ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2)
    })

    // Start / End
    ctx.fillStyle = '#F0EDE8'; ctx.fillRect(4 * cw + 2, 9 * ch + 2, cw - 4, ch - 4)
    ctx.fillStyle = '#3D7A5C'; ctx.fillRect(11 * cw + 2, 1 * ch + 2, cw - 4, ch - 4)

    // Labels
    ctx.fillStyle = '#8A8880'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('START', 4 * cw + cw / 2, 9 * ch + ch - 3)
    ctx.fillText('DEST', 11 * cw + cw / 2, 1 * ch + ch - 3)
  }, [])

  return (
    <canvas ref={canvasRef} width={480} height={300} className="w-full rounded-sm" />
  )
}

export default function Planning() {
  const [activeLayers, setActiveLayers] = useState({
    CURRENT_PATH: true,
    PREDICTED_PATH: false,
    RISK_MAP: true,
    OBJECT_TRAJECTORIES: false,
  })

  const toggle = (id) => setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Path Planning</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Finding the safer line.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            RAAH uses Hybrid A* planning with local trajectory optimisation. When risk exceeds the threshold, a new path is computed in under 100ms and executed smoothly.
          </p>
        </div>
      </div>

      <div className="raah-container py-16">
        <div className="grid grid-cols-12 gap-10">

          {/* Canvas + layer controls */}
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.values(LAYERS).map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => toggle(layer.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-sm transition-all duration-200
                      ${activeLayers[layer.id]
                        ? 'border-raah-accent text-raah-accent bg-raah-accent/5'
                        : 'border-raah-border text-raah-muted hover:border-raah-body hover:text-raah-body'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full transition-colors`}
                      style={{ backgroundColor: activeLayers[layer.id] ? layer.color : '#C4C2BE' }} />
                    {layer.label}
                  </button>
                ))}
              </div>
              <div className="sim-viewport" style={{ aspectRatio: '5/4' }}>
                <PlanningCanvas activeLayers={activeLayers} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-raah-muted">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-raah-muted/50 inline-block rounded-full" /> Current path</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-raah-accent inline-block rounded-full" /> New trajectory</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-raah-danger/40 inline-block" /> Risk zone</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-raah-safe inline-block" /> Destination</span>
              </div>
            </Reveal>
          </div>

          {/* Info */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal delay={100}>
              <h2 className="text-xl font-medium text-raah-heading mb-4">Hybrid A* Algorithm</h2>
              <p className="text-sm text-raah-muted leading-relaxed mb-8">
                Hybrid A* extends the classical A* search to continuous space, producing kinematically feasible paths that respect vehicle turn constraints. It operates on the dynamic costmap updated at each perception cycle.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { label: 'Planning frequency', value: '10 Hz' },
                  { label: 'Target latency',      value: '< 100 ms' },
                  { label: 'Costmap resolution',  value: '0.1 m/cell' },
                  { label: 'Look-ahead distance', value: '30 m' },
                  { label: 'Min turning radius',  value: '5.8 m' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center border-b border-raah-border pb-3">
                    <span className="text-sm text-raah-muted">{label}</span>
                    <span className="text-sm font-medium text-raah-heading tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <h2 className="text-xl font-medium text-raah-heading mb-4">A* Search Grid (Demo)</h2>
              <AStarViz />
              <p className="text-[10px] text-raah-muted mt-2">
                Simplified visualisation. Blue = explored cells, amber = optimal path, red = obstacle inflation.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Algorithm comparison */}
        <Reveal delay={300}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-raah-border">
            {[
              { label: 'A*',         pro: 'Global optimal', con: 'Grid-locked, not kinematically feasible', use: 'Initial route planning' },
              { label: 'Hybrid A*',  pro: 'Kinematically feasible in continuous space', con: 'Computationally heavier', use: 'Primary planner' },
              { label: 'Local Opt.', pro: 'Very fast, smooth trajectory', con: 'Local minima susceptible', use: 'Post-processing refinement' },
            ].map(({ label, pro, con, use }) => (
              <div key={label} className="bg-raah-bg p-8">
                <p className="text-base font-semibold text-raah-heading mb-4">{label}</p>
                <div className="space-y-3 text-sm">
                  <div><span className="raah-label">Advantage</span><p className="text-raah-body mt-1">{pro}</p></div>
                  <div><span className="raah-label">Limitation</span><p className="text-raah-muted mt-1">{con}</p></div>
                  <div><span className="raah-label">Used for</span><p className="text-raah-accent mt-1">{use}</p></div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
