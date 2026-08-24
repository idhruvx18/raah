import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SCENARIOS } from '../simulation/scenarios'
import { simEngine } from '../simulation/SimEngine'
import { useIntersection } from '../components/ui/useIntersection'

// ── Stylized scenario preview canvas ─────────────────────────────────────────
function ScenarioCanvas({ scenario, isHovered }) {
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

      // Background
      const [c1, c2] = scenario.bgGrad
      const grad = ctx.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, c1); grad.addColorStop(1, c2)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      const spd = isHovered ? 1.5 : 0.4

      if (scenario.id === 'village_road') {
        // Narrow winding road
        ctx.strokeStyle = '#C8C0A8'; ctx.lineWidth = 40; ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(W * 0.45, H)
        ctx.bezierCurveTo(W * 0.5, H * 0.7, W * 0.4, H * 0.4, W * 0.5, 0)
        ctx.stroke()
        // Trees
        for (let i = 0; i < 6; i++) {
          const tx = i % 2 === 0 ? W * 0.2 + Math.sin(t * 0.01 + i) * 3 : W * 0.75
          const ty = (i / 6) * H
          ctx.fillStyle = '#5A7048'
          ctx.beginPath(); ctx.arc(tx, ty + 20, 12, 0, Math.PI * 2); ctx.fill()
        }
        // Moving cow
        const cowX = (W * 0.5 + Math.sin(t * 0.015 * spd) * 20)
        const cowY = H * 0.5 + Math.sin(t * 0.02 * spd) * 10
        ctx.fillStyle = '#8B7355'; ctx.fillRect(cowX - 12, cowY - 8, 24, 14)
        ctx.fillStyle = '#7A6348'; ctx.fillRect(cowX - 4, cowY - 16, 8, 10)
      }

      else if (scenario.id === 'intersection') {
        // Cross roads
        ctx.fillStyle = '#9E9A94'
        ctx.fillRect(0, H * 0.4, W, H * 0.2)
        ctx.fillRect(W * 0.4, 0, W * 0.2, H)
        // Cars from each direction
        const cars = [
          { x: (t * 0.5 * spd) % (W + 40) - 20, y: H * 0.5, c: '#505870' },
          { x: W * 0.5, y: H - (t * 0.4 * spd) % (H + 40), c: '#605870' },
          { x: W - (t * 0.35 * spd) % (W + 40), y: H * 0.48, c: '#506060' },
        ]
        cars.forEach(({ x, y, c }) => {
          ctx.fillStyle = c
          ctx.beginPath(); ctx.roundRect(x - 10, y - 7, 20, 14, 2); ctx.fill()
        })
      }

      else if (scenario.id === 'highway_merge') {
        // Highway lanes
        ctx.fillStyle = '#7A7570'
        ctx.fillRect(0, H * 0.25, W, H * 0.55)
        ctx.strokeStyle = '#FFF8E0'; ctx.lineWidth = 2; ctx.setLineDash([20, 15])
        ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke()
        ctx.setLineDash([])
        // Fast moving cars
        const hx = (t * 1.8 * spd) % (W + 60) - 30
        ctx.fillStyle = '#4A5870'; ctx.beginPath(); ctx.roundRect(hx, H * 0.35, 28, 14, 3); ctx.fill()
        ctx.fillStyle = '#705070'; ctx.beginPath(); ctx.roundRect(hx - 50, H * 0.55, 24, 12, 3); ctx.fill()
      }

      else if (scenario.id === 'dense_market') {
        // Dense urban
        ctx.fillStyle = '#A89A88'
        ctx.fillRect(W * 0.2, 0, W * 0.6, H)
        // Many objects
        for (let i = 0; i < 8; i++) {
          const ox = W * 0.25 + (i % 4) * (W * 0.15) + Math.sin(t * 0.02 * spd + i) * 6
          const oy = (i * H / 8) + ((t * 0.3 * spd + i * 20) % H) - H * 0.1
          ctx.fillStyle = i % 3 === 0 ? '#5A5050' : i % 3 === 1 ? '#504848' : '#484840'
          ctx.fillRect(ox - 6, oy - 8, 12, 18)
        }
      }

      else if (scenario.id === 'cattle_crossing') {
        // Rural road
        ctx.fillStyle = '#B0A888'
        ctx.fillRect(W * 0.15, 0, W * 0.7, H)
        // Herd of cattle
        for (let i = 0; i < 6; i++) {
          const cx2 = W * 0.25 + (i * W * 0.1) + Math.sin(t * 0.015 * spd + i * 1.2) * 8
          const cy2 = H * 0.35 + (i % 2) * H * 0.15 + Math.cos(t * 0.01 * spd + i) * 5
          ctx.fillStyle = '#7A6A50'
          ctx.fillRect(cx2 - 10, cy2 - 7, 20, 12)
          ctx.fillRect(cx2 - 3, cy2 - 15, 7, 9)
        }
      }

      // Ego vehicle
      const evX = W * 0.5 + Math.sin(t * 0.008 * spd) * 4
      const evY = H * 0.8
      ctx.fillStyle = '#F0EDE8'; ctx.strokeStyle = '#C17A3A'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.roundRect(evX - 9, evY - 18, 18, 36, 4); ctx.fill(); ctx.stroke()
      // Route line
      ctx.strokeStyle = '#C17A3A'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.5
      ctx.setLineDash([5, 7])
      ctx.beginPath(); ctx.moveTo(evX, evY - 18); ctx.lineTo(evX, H * 0.15); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isHovered, scenario])

  return (
    <canvas ref={canvasRef} width={400} height={260} className="w-full h-full object-cover" />
  )
}

// ── Difficulty dots ───────────────────────────────────────────────────────────
function DifficultyDots({ level, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${i < level ? 'bg-raah-accent' : 'bg-raah-border'}`}
        />
      ))}
    </div>
  )
}

// ── Scenario card ─────────────────────────────────────────────────────────────
function ScenarioCard({ scenario, index }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const [ref, visible] = useIntersection()

  const handleRun = () => {
    simEngine.start(scenario.id)
    navigate('/dashboard')
  }

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden bg-raah-bg border border-raah-border rounded-sm
        transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview */}
      <div className="relative h-48 overflow-hidden">
        <ScenarioCanvas scenario={scenario} isHovered={hovered} />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-raah-bg/40 to-transparent pointer-events-none" />
        {/* Number */}
        <div className="absolute top-3 left-4">
          <span className="text-4xl font-light tabular-nums text-white/20">{scenario.number}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-base font-semibold text-raah-heading mb-2 tracking-[-0.01em]">
          {scenario.title}
        </h3>
        <p className="text-sm text-raah-muted leading-relaxed mb-4">
          {scenario.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-5 mb-4">
          <div>
            <p className="raah-label mb-1.5">Difficulty</p>
            <DifficultyDots level={scenario.difficulty} />
          </div>
          <div>
            <p className="raah-label mb-1.5">Traffic</p>
            <DifficultyDots level={scenario.trafficDensity} />
          </div>
        </div>

        {/* Hazards */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {scenario.hazards.map((h) => (
            <span key={h} className="text-[10px] px-2 py-0.5 bg-raah-surface border border-raah-border rounded-sm text-raah-muted">
              {h}
            </span>
          ))}
        </div>

        <button
          onClick={handleRun}
          className="w-full py-2.5 text-xs font-medium tracking-[.06em] border border-raah-heading text-raah-heading rounded-sm
            hover:bg-raah-heading hover:text-raah-bg transition-all duration-200 group-hover:border-raah-accent group-hover:text-raah-accent
            flex items-center justify-center gap-2"
        >
          RUN SCENARIO
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Scenarios() {
  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      {/* Header */}
      <div className="border-b border-raah-border bg-raah-bg">
        <div className="raah-container py-12 lg:py-16">
          <p className="raah-label mb-4">Scenario Center</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Choose your environment.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            Five carefully designed scenarios that represent the real challenges of Indian road conditions. Each simulates distinct hazard profiles and traffic patterns.
          </p>
        </div>
      </div>

      {/* Scenarios grid */}
      <div className="raah-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-raah-border">
          {SCENARIOS.map((scenario, i) => (
            <ScenarioCard key={scenario.id} scenario={scenario} index={i} />
          ))}
          {/* Info card — last slot */}
          <div className="bg-raah-surface p-8 flex flex-col justify-between">
            <div>
              <p className="raah-label mb-4">Scenario Injector</p>
              <p className="text-sm text-raah-muted leading-relaxed mb-6">
                During any live simulation, use the scenario injector to introduce specific events: motorcycle cut-ins, pedestrians, animals, roadblocks, and vehicle merges.
              </p>
              <p className="text-sm text-raah-body leading-relaxed">
                Watch RAAH detect the new hazard, compute risk, and replan — in real time.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-raah-border">
              <p className="raah-label mb-3">Available events</p>
              <div className="flex flex-wrap gap-2">
                {['Motorcycle', 'Pedestrian', 'Animal', 'Roadblock', 'Vehicle merge'].map((e) => (
                  <span key={e} className="text-[10px] px-2.5 py-1 border border-raah-border text-raah-muted rounded-sm">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
