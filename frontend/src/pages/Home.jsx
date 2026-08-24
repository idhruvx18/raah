import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useIntersection } from '../components/ui/useIntersection'

// ── Hero Canvas ───────────────────────────────────────────────────────────────
function HeroCanvas() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const tickRef   = useRef(0)
  const stateRef  = useRef({
    bikeX: 620, bikeY: 280, bikeActive: false,
    label: '', labelOpacity: 0, labelTimer: 0,
    pathOffset: 0,
    adjusted: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    // Bike appears at tick 180
    const render = () => {
      tickRef.current++
      const t = tickRef.current
      const s = stateRef.current
      ctx.clearRect(0, 0, W, H)

      // ── Road background
      ctx.fillStyle = '#1E1D1B'
      ctx.fillRect(0, 0, W, H)

      // Sidewalks
      ctx.fillStyle = '#1A1918'
      ctx.fillRect(0, 0, 160, H)
      ctx.fillRect(W - 160, 0, 160, H)

      // Road surface
      ctx.fillStyle = '#232220'
      ctx.fillRect(160, 0, W - 320, H)

      // Road edges
      ctx.strokeStyle = '#303030'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(160, 0); ctx.lineTo(160, H)
      ctx.moveTo(W - 160, 0); ctx.lineTo(W - 160, H)
      ctx.stroke()

      // Dashed centre line
      ctx.strokeStyle = '#363432'
      ctx.lineWidth = 1
      ctx.setLineDash([16, 14])
      ctx.beginPath()
      ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H)
      ctx.stroke()
      ctx.setLineDash([])

      // ── Current path (before adjustment)
      const cx = W / 2
      const pathPoints = s.adjusted
        ? [[cx, H], [cx - 30, H * 0.65], [cx - 55, H * 0.45], [cx - 40, H * 0.25], [cx, H * 0.05]]
        : [[cx, H], [cx, H * 0.65], [cx, H * 0.45], [cx, H * 0.25], [cx, H * 0.05]]

      ctx.save()
      ctx.strokeStyle = s.adjusted ? '#C17A3A' : 'rgba(200,195,185,0.45)'
      ctx.lineWidth = s.adjusted ? 2 : 1.5
      ctx.setLineDash(s.adjusted ? [] : [8, 10])
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      pathPoints.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Ego vehicle
      const egoX = cx + (s.adjusted ? -40 : 0)
      const egoY = H * 0.72 + Math.sin(t * 0.02) * 1.5
      ctx.save()
      ctx.translate(egoX, egoY)
      ctx.fillStyle = '#F0EDE8'
      ctx.strokeStyle = '#C17A3A'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(-10, -18, 20, 36, 4)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#C17A3A'
      ctx.fillRect(-8, -16, 16, 5)
      ctx.restore()

      // ── Motorcycle appears at t=180
      if (t > 180 && !s.bikeActive) {
        s.bikeActive = true
        s.bikeX = W * 0.75
        s.bikeY = H * 0.4
      }

      if (s.bikeActive) {
        s.bikeX -= 1.4
        s.bikeY += 0.8

        // Draw bike
        ctx.save()
        ctx.translate(s.bikeX, s.bikeY)
        ctx.fillStyle = '#4A4040'
        ctx.strokeStyle = '#8A6050'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(-5, -12, 10, 24, 2)
        ctx.fill(); ctx.stroke()
        ctx.restore()

        // Trajectory line of bike
        ctx.save()
        ctx.strokeStyle = 'rgba(184, 132, 58, 0.4)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 6])
        ctx.beginPath()
        ctx.moveTo(s.bikeX, s.bikeY)
        ctx.lineTo(s.bikeX - 60, s.bikeY + 35)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        // If bike near path midpoint → adjust
        if (s.bikeX < cx + 40 && !s.adjusted) {
          s.adjusted = true
          s.label = 'Trajectory adjusted'
          s.labelOpacity = 0
          s.labelTimer = 80
        }
      }

      // ── Label overlay
      if (s.labelTimer > 0) {
        s.labelTimer--
        if (s.labelOpacity < 1) s.labelOpacity = Math.min(1, s.labelOpacity + 0.05)
        if (s.labelTimer < 20) s.labelOpacity = Math.max(0, s.labelOpacity - 0.05)

        ctx.save()
        ctx.globalAlpha = s.labelOpacity
        ctx.fillStyle = 'rgba(28, 27, 25, 0.7)'
        const txtW = ctx.measureText(s.label).width + 24
        ctx.fillRect(cx - 60, H * 0.38, txtW, 28)
        ctx.fillStyle = '#C17A3A'
        ctx.font = '11px Inter, sans-serif'
        ctx.fillText(s.label, cx - 60 + 12, H * 0.38 + 18)
        ctx.restore()
      }

      // Reset after one full cycle (~600 frames)
      if (t > 620) {
        tickRef.current = 0
        s.bikeActive = false
        s.adjusted = false
        s.labelOpacity = 0
        s.labelTimer = 0
        s.bikeX = W * 0.75
        s.bikeY = H * 0.4
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={480}
      className="w-full h-full object-cover"
    />
  )
}

// ── Process step ──────────────────────────────────────────────────────────────
const PROCESS_STEPS = [
  { num: '01', label: 'PERCEIVE', desc: 'Multi-sensor fusion captures the full environment in real time' },
  { num: '02', label: 'PREDICT', desc: 'Motion models forecast where every object will be in the next 3 seconds' },
  { num: '03', label: 'ASSESS', desc: 'Risk engine quantifies collision probability and time-to-collision' },
  { num: '04', label: 'PLAN',    desc: 'Hybrid A* generates safe, optimised trajectories in milliseconds' },
  { num: '05', label: 'ADAPT',   desc: 'Vehicle executes the new path smoothly, replanning continuously' },
]

const TECH_STACK = [
  { label: 'SENSORS', sub: 'Camera · LiDAR · GPS/IMU' },
  { label: 'AI PERCEPTION', sub: 'YOLO · OpenCV · PyTorch' },
  { label: 'OBJECT TRACKING', sub: 'ByteTrack · Kalman filter' },
  { label: 'MOTION PREDICTION', sub: 'Constant velocity · Social force' },
  { label: 'RISK ENGINE', sub: 'TTC · collision probability' },
  { label: 'DYNAMIC COSTMAP', sub: 'Occupancy grid · inflation' },
  { label: 'PATH PLANNING', sub: 'Hybrid A* · local opt.' },
  { label: 'VEHICLE CONTROL', sub: 'Stanley · Pure Pursuit · MPC' },
]

const ROAD_CHALLENGES = [
  { label: 'Unmarked road',    desc: 'No lane markings or edge indicators' },
  { label: 'Mixed traffic',    desc: 'Cars, bikes, animals sharing the road' },
  { label: 'Sudden pedestrian', desc: 'Unexpected entry into the vehicle path' },
  { label: 'Cattle crossing',  desc: 'Unpredictable group movement patterns' },
  { label: 'Unexpected merge', desc: 'Vehicles entering without signalling' },
]

// ── Section animation wrapper ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useIntersection()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-spring ${className} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ── Comparison canvas ─────────────────────────────────────────────────────────
function ComparisonCanvas({ mode = 'traditional' }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const tickRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    let obstacleX = W + 40

    const render = () => {
      tickRef.current = (tickRef.current + 1) % 240
      const t = tickRef.current

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#1E1D1B'
      ctx.fillRect(0, 0, W, H)

      // Road
      ctx.fillStyle = '#242220'
      ctx.fillRect(20, 20, W - 40, H - 40)
      ctx.strokeStyle = '#303030'
      ctx.lineWidth = 1
      ctx.strokeRect(20, 20, W - 40, H - 40)

      // Obstacle moves left
      const ox = W * 0.9 - (t / 240) * (W * 0.7)
      const oy = H / 2

      // Obstacle
      ctx.fillStyle = mode === 'traditional' ? '#A0402D' : '#4A4848'
      ctx.beginPath()
      ctx.roundRect(ox - 10, oy - 14, 20, 28, 3)
      ctx.fill()

      // Vehicle
      const vx = W * 0.2
      const vy = mode === 'raah' && t > 80 ? H / 2 - 30 : H / 2

      ctx.fillStyle = '#F0EDE8'
      ctx.strokeStyle = mode === 'raah' ? '#C17A3A' : '#807B75'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(vx - 9, vy - 18, 18, 36, 4)
      ctx.fill(); ctx.stroke()

      // Path line
      ctx.strokeStyle = mode === 'raah' && t > 60 ? '#C17A3A' : 'rgba(200,195,185,0.4)'
      ctx.lineWidth = 1.5
      ctx.setLineDash(mode === 'traditional' ? [8, 8] : [])
      ctx.beginPath()
      if (mode === 'raah' && t > 60) {
        ctx.moveTo(vx, vy)
        ctx.bezierCurveTo(vx + 40, vy, vx + 60, vy - 40, W * 0.8, vy - 30)
      } else {
        ctx.moveTo(vx, H / 2)
        ctx.lineTo(W * 0.85, H / 2)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Collision indicator
      if (mode === 'traditional' && t > 140) {
        ctx.fillStyle = 'rgba(160, 64, 45, 0.2)'
        ctx.beginPath()
        ctx.arc(ox, oy, 24, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(160, 64, 45, 0.5)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      if (mode === 'raah' && t > 60) {
        ctx.fillStyle = 'rgba(61, 122, 92, 0.15)'
        ctx.beginPath()
        ctx.arc(vx + 60, vy - 25, 18, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [mode])

  return (
    <canvas ref={canvasRef} width={280} height={160} className="w-full h-full object-contain rounded-sm" />
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Home() {
  const [heroReady, setHeroReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-raah-dark min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Canvas fills the hero */}
        <div className="absolute inset-0 opacity-60">
          <HeroCanvas />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-raah-dark/60 via-transparent to-raah-dark" />

        <div className="relative raah-container pt-28 pb-24">
          {/* Eyebrow */}
          <div
            className={`flex items-center gap-3 mb-8 transition-all duration-700 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="w-4 h-px bg-raah-accent opacity-60" />
            <span className="raah-label text-white/40">Risk-Aware Adaptive Autonomous Navigation</span>
          </div>

          {/* Headline */}
          <h1
            className={`text-display font-light text-white mb-6 max-w-4xl transition-all duration-900 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '350ms' }}
          >
            Finding the safer<br />
            <span className="font-normal">way through</span><br />
            <span className="text-raah-accent font-medium">the unpredictable.</span>
          </h1>

          {/* Subline */}
          <p
            className={`text-lg font-light text-white/50 max-w-xl mb-12 leading-relaxed transition-all duration-700 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '500ms' }}
          >
            Adaptive autonomous navigation designed for the<br className="hidden sm:block" />
            complexity of Indian roads.
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '650ms' }}
          >
            <Link to="/dashboard" className="btn-accent group">
              Launch Simulation
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/technology" className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white/70 text-sm font-medium tracking-[.04em] rounded-sm hover:border-white/40 hover:text-white transition-all duration-200">
              Explore RAAH
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/25">
          <span className="text-[10px] tracking-[.12em] uppercase">Scroll</span>
          <ChevronDown size={14} />
        </div>
      </section>

      {/* ── CORE IDEA ────────────────────────────────────────────────────────── */}
      <section className="bg-raah-bg py-24 lg:py-36">
        <div className="raah-container">
          <Reveal>
            <p className="raah-label mb-6">The Problem</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-hero-sm font-light text-raah-heading mb-6 max-w-3xl">
              Roads don't always<br />follow the rules.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl font-light text-raah-muted max-w-2xl leading-relaxed mb-16">
              Indian roads are dynamic environments where lanes, traffic and human behaviour can change in seconds. Standard autonomous navigation fails here.
            </p>
          </Reveal>

          {/* Road challenge grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-raah-border">
            {ROAD_CHALLENGES.map((item, i) => (
              <Reveal key={item.label} delay={i * 80}>
                <div className="bg-raah-bg p-6 lg:p-8">
                  <div className="w-6 h-px bg-raah-accent mb-4" />
                  <p className="text-sm font-medium text-raah-heading mb-2">{item.label}</p>
                  <p className="text-xs text-raah-muted leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW RAAH THINKS ──────────────────────────────────────────────────── */}
      <section className="bg-raah-bg-alt py-24 lg:py-36">
        <div className="raah-container">
          <Reveal>
            <p className="raah-label mb-6">How RAAH Thinks</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-hero-sm font-light text-raah-heading mb-16 max-w-2xl">
              Five stages. Continuously.
            </h2>
          </Reveal>

          {/* Horizontal steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-raah-border" />

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {PROCESS_STEPS.map((step, i) => (
                <Reveal key={step.num} delay={i * 100}>
                  <div className="relative">
                    {/* Number */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-light tabular-nums text-raah-muted tracking-tight">{step.num}</span>
                      <div className="hidden lg:block w-3 h-3 rounded-full bg-raah-bg border-2 border-raah-border relative z-10" />
                    </div>
                    {/* Label */}
                    <p className="text-xs font-semibold tracking-[.1em] text-raah-accent mb-2">{step.label}</p>
                    {/* Description */}
                    <p className="text-sm text-raah-muted leading-relaxed">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE DIFFERENCE ───────────────────────────────────────────────────── */}
      <section className="bg-raah-bg py-24 lg:py-36">
        <div className="raah-container">
          <Reveal>
            <p className="raah-label mb-6">The Difference</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-hero-sm font-light text-raah-heading mb-16 max-w-2xl">
              Don't just follow the path.<br />
              <span className="font-medium">Evaluate it.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-raah-border">
            {/* Traditional */}
            <Reveal>
              <div className="bg-raah-surface p-10 lg:p-14">
                <p className="raah-label mb-4 text-raah-muted">Traditional AV</p>
                <p className="text-2xl font-light text-raah-body mb-8 leading-relaxed">
                  "Follow the<br />planned path."
                </p>
                <div className="h-40 rounded-sm overflow-hidden bg-raah-dark-alt">
                  <ComparisonCanvas mode="traditional" />
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-danger opacity-60" />
                    <span className="text-xs text-raah-muted">Static path execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-danger opacity-60" />
                    <span className="text-xs text-raah-muted">Fails on unstructured roads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-danger opacity-60" />
                    <span className="text-xs text-raah-muted">No real-time risk evaluation</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* RAAH */}
            <Reveal delay={150}>
              <div className="bg-raah-bg p-10 lg:p-14">
                <p className="raah-label mb-4 text-raah-accent">RAAH</p>
                <p className="text-2xl font-light text-raah-heading mb-8 leading-relaxed">
                  "Continuously evaluate<br />whether the path is safe."
                </p>
                <div className="h-40 rounded-sm overflow-hidden bg-raah-dark-alt">
                  <ComparisonCanvas mode="raah" />
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                    <span className="text-xs text-raah-body">Continuous risk assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                    <span className="text-xs text-raah-body">Dynamic path replanning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                    <span className="text-xs text-raah-body">Designed for Indian road conditions</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY STACK ──────────────────────────────────────────────────── */}
      <section className="bg-raah-dark py-24 lg:py-36">
        <div className="raah-container">
          <Reveal>
            <p className="raah-label text-white/30 mb-6">Architecture</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-hero-sm font-light text-white mb-16 max-w-2xl">
              Eight layers.<br />One outcome: safety.
            </h2>
          </Reveal>

          <div className="flex flex-col items-start max-w-sm gap-0">
            {TECH_STACK.map((item, i) => (
              <Reveal key={item.label} delay={i * 60}>
                <div className="flex items-start gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full border border-raah-accent mt-1 group-hover:bg-raah-accent transition-colors duration-200" />
                    {i < TECH_STACK.length - 1 && (
                      <div className="w-px h-10 bg-white/10" />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className="text-sm font-medium text-white/80 tracking-[.04em]">{item.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="bg-raah-dark-alt py-24 border-t border-white/5">
        <div className="raah-container text-center">
          <Reveal>
            <h2 className="text-hero-sm font-light text-white mb-4">
              See RAAH in action.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-base text-white/40 mb-10 max-w-md mx-auto leading-relaxed">
              Run the live simulation, inject obstacles, and watch RAAH replan in real time.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/dashboard" className="btn-accent group">
                Launch Command Center
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/scenarios" className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white/60 text-sm font-medium tracking-[.04em] rounded-sm hover:border-white/40 hover:text-white transition-all duration-200">
                Browse Scenarios
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
