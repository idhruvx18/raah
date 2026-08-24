import { useSimStore } from '../store/simulationStore'
import { useIntersection } from '../components/ui/useIntersection'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-raah-border rounded-sm px-3 py-2 shadow-sm">
      <p className="text-[10px] text-raah-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  )
}

// Mock analytics data
const SPEED_DATA = Array.from({ length: 30 }, (_, i) => ({
  t: `${i * 2}s`,
  speed: Math.max(15, Math.min(55, 38 + Math.sin(i * 0.4) * 12 - (i > 12 && i < 16 ? 15 : 0))),
}))

const REPLAN_DATA = [
  { scenario: 'Village', replans: 2, nearMisses: 1 },
  { scenario: 'Intersection', replans: 5, nearMisses: 3 },
  { scenario: 'Highway', replans: 3, nearMisses: 2 },
  { scenario: 'Market', replans: 7, nearMisses: 4 },
  { scenario: 'Cattle', replans: 2, nearMisses: 1 },
]

const LATENCY_DATA = Array.from({ length: 20 }, (_, i) => ({
  frame: i + 1,
  planning: 40 + Math.random() * 60,
  perception: 18 + Math.random() * 12,
}))

function MetricCard({ value, unit, label, subLabel, decimals = 0, accent = false }) {
  return (
    <div className={`p-6 border rounded-sm ${accent ? 'border-raah-accent/20 bg-raah-accent/5' : 'border-raah-border bg-raah-bg'}`}>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className={`text-4xl font-semibold tabular-nums tracking-[-0.02em] ${accent ? 'text-raah-accent' : 'text-raah-heading'}`}>
          <AnimatedNumber value={value} decimals={decimals} />
        </span>
        {unit && <span className="text-xs font-medium text-raah-muted uppercase tracking-[.05em]">{unit}</span>}
      </div>
      <p className="text-sm font-medium text-raah-body">{label}</p>
      {subLabel && <p className="text-xs text-raah-muted mt-0.5">{subLabel}</p>}
    </div>
  )
}

export default function Analytics() {
  const { simulationState, vehicleState, riskState, plannerState } = useSimStore()

  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Analytics</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Performance at a glance.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            Session metrics, system performance and behaviour analytics across all simulated scenarios.
          </p>
        </div>
      </div>

      <div className="raah-container py-16 space-y-12">

        {/* Session metrics */}
        <Reveal>
          <h2 className="text-xl font-medium text-raah-heading mb-6">Current Session</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <MetricCard value={simulationState.distanceTravelled} unit="m"   label="Distance"    decimals={0} />
            <MetricCard value={vehicleState.speed}                unit="km/h" label="Speed"       decimals={1} />
            <MetricCard value={simulationState.replans}           unit=""     label="Replans"     accent />
            <MetricCard value={simulationState.nearMisses}        unit=""     label="Near Misses" />
            <MetricCard value={simulationState.collisions}        unit=""     label="Collisions"  />
            <MetricCard value={simulationState.avgTTC || 0}       unit="s"    label="Avg TTC"     decimals={1} />
            <MetricCard value={plannerState.planningLatencyMs}    unit="ms"   label="Plan Latency" decimals={0} />
            <MetricCard value={simulationState.perceptionFPS}     unit="fps"  label="Perception"  />
          </div>
          <p className="text-[10px] text-raah-muted mt-2">Start a simulation on the dashboard to see live values</p>
        </Reveal>

        {/* Speed over time */}
        <Reveal delay={100}>
          <h2 className="text-xl font-medium text-raah-heading mb-2">Vehicle Speed — Demo Session</h2>
          <p className="text-sm text-raah-muted mb-4">Speed reductions at t=24–32s indicate replanning events</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SPEED_DATA} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid stroke="#E2E1DE" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} domain={[0, 60]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#3A6090" strokeWidth={1.5} dot={false}
                  activeDot={{ r: 3, fill: '#3A6090' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        {/* Replans per scenario */}
        <Reveal delay={200}>
          <h2 className="text-xl font-medium text-raah-heading mb-2">Replans & Near Misses by Scenario</h2>
          <p className="text-sm text-raah-muted mb-4">Dense Market scenario shows highest replanning frequency as expected</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REPLAN_DATA} margin={{ top: 4, right: 4, bottom: 4, left: -20 }} barGap={4}>
                <CartesianGrid stroke="#E2E1DE" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="square" wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                <Bar dataKey="replans" name="Replans" fill="#C17A3A" radius={[2, 2, 0, 0]} maxBarSize={32} />
                <Bar dataKey="nearMisses" name="Near Misses" fill="#3A6090" radius={[2, 2, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        {/* Latency chart */}
        <Reveal delay={300}>
          <h2 className="text-xl font-medium text-raah-heading mb-2">System Latency</h2>
          <p className="text-sm text-raah-muted mb-4">Planning latency consistently under 100ms. Perception at 18–30ms per frame.</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LATENCY_DATA} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid stroke="#E2E1DE" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="frame" tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} label={{ value: 'Frame', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#8A8880' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="square" wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="planning" name="Planning (ms)" stroke="#C17A3A" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="perception" name="Perception (ms)" stroke="#3D7A5C" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-raah-muted mt-2 text-right">Simulated values — not real experimental results</p>
        </Reveal>

        {/* Key insights */}
        <Reveal delay={400}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-raah-border">
            {[
              { label: 'Zero collisions', desc: 'In all five demo scenarios across 100+ replanning events', icon: '—' },
              { label: '67ms avg planning', desc: 'Hybrid A* planning latency well within 100ms real-time budget', icon: '—' },
              { label: '94% detection', desc: 'Average object detection confidence across all object types', icon: '—' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-raah-surface p-8">
                <div className="w-6 h-px bg-raah-accent mb-4" />
                <p className="text-base font-semibold text-raah-heading mb-2">{label}</p>
                <p className="text-sm text-raah-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-raah-muted mt-3">All values are simulated/demo. Not real experimental results.</p>
        </Reveal>

      </div>
    </div>
  )
}
