import { useIntersection } from '../components/ui/useIntersection'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
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

const COMPARISON = [
  {
    metric: 'Collision Rate',
    baseline: '4.2 per scenario',
    raah: '0.0 per scenario',
    improvement: '100%',
    better: true,
    unit: 'events',
  },
  {
    metric: 'Near Misses',
    baseline: '8.6 per scenario',
    raah: '2.1 per scenario',
    improvement: '76%',
    better: true,
    unit: 'events',
  },
  {
    metric: 'Average TTC at closest approach',
    baseline: '0.8 s',
    raah: '1.9 s',
    improvement: '+137%',
    better: true,
    unit: 's',
  },
  {
    metric: 'Path efficiency (vs. straight-line)',
    baseline: '94%',
    raah: '91%',
    improvement: '-3%',
    better: false,
    unit: '%',
    note: 'Minor trade-off for safety',
  },
  {
    metric: 'Replanning success rate',
    baseline: 'N/A',
    raah: '97.4%',
    improvement: '—',
    better: true,
  },
  {
    metric: 'Safety score (composite)',
    baseline: '34 / 100',
    raah: '88 / 100',
    improvement: '+159%',
    better: true,
    unit: '/ 100',
  },
]

const BAR_DATA = [
  { name: 'Village', baseline: 3.1, raah: 0 },
  { name: 'Intersection', baseline: 5.8, raah: 0 },
  { name: 'Highway', baseline: 3.4, raah: 0 },
  { name: 'Market', baseline: 6.2, raah: 0 },
  { name: 'Cattle', baseline: 2.5, raah: 0 },
]

const RADAR_DATA = [
  { subject: 'Safety',    baseline: 34, raah: 88 },
  { subject: 'TTC',       baseline: 42, raah: 79 },
  { subject: 'Efficiency',baseline: 94, raah: 91 },
  { subject: 'Replanning',baseline: 0,  raah: 97 },
  { subject: 'Detection', baseline: 0,  raah: 94 },
  { subject: 'Latency',   baseline: 50, raah: 85 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-raah-border rounded-sm px-3 py-2 shadow-sm">
      <p className="text-[10px] text-raah-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Results() {
  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Results</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Baseline vs RAAH.
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-raah-muted px-3 py-1 border border-raah-border rounded-sm">
              ⚠ All values are simulated / demo. Not real experimental results.
            </span>
          </div>
        </div>
      </div>

      <div className="raah-container py-16 space-y-16">

        {/* Headline comparison */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-raah-border">
            <div className="bg-raah-surface p-10 lg:p-14">
              <p className="raah-label mb-6 text-raah-muted">Baseline (Static planner)</p>
              <p className="text-6xl font-light tabular-nums text-raah-heading mb-2">4.2</p>
              <p className="text-sm text-raah-muted">collisions per scenario (avg)</p>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-raah-muted">No real-time obstacle avoidance</p>
                <p className="text-sm text-raah-muted">Pre-planned path execution only</p>
                <p className="text-sm text-raah-muted">No risk quantification</p>
              </div>
            </div>
            <div className="bg-raah-bg p-10 lg:p-14">
              <p className="raah-label mb-6 text-raah-accent">RAAH</p>
              <p className="text-6xl font-semibold tabular-nums text-raah-heading mb-2">0.0</p>
              <p className="text-sm text-raah-muted">collisions per scenario (avg)</p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                  <p className="text-sm text-raah-body">Continuous risk-aware replanning</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                  <p className="text-sm text-raah-body">97.4% replanning success rate</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                  <p className="text-sm text-raah-body">67ms average planning latency</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Comparison table */}
        <Reveal delay={100}>
          <h2 className="text-xl font-medium text-raah-heading mb-6">Detailed Comparison</h2>
          <div className="border border-raah-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-raah-surface border-b border-raah-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-raah-muted tracking-[.04em]">Metric</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-raah-muted tracking-[.04em]">Baseline</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-raah-accent tracking-[.04em]">RAAH</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-raah-muted tracking-[.04em]">Change</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(({ metric, baseline, raah, improvement, better, note }) => (
                  <tr key={metric} className="border-b border-raah-border last:border-0 hover:bg-raah-surface transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-raah-body font-medium">{metric}</p>
                      {note && <p className="text-xs text-raah-muted mt-0.5">{note}</p>}
                    </td>
                    <td className="px-5 py-4 text-center text-raah-muted tabular-nums">{baseline}</td>
                    <td className="px-5 py-4 text-center font-semibold text-raah-heading tabular-nums">{raah}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
                        better ? 'text-raah-safe bg-raah-safe/10' : 'text-raah-warn bg-raah-warn/10'
                      }`}>{improvement}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-raah-muted mt-2">All values are illustrative simulation results — not real experimental data.</p>
        </Reveal>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Reveal delay={200}>
            <h2 className="text-xl font-medium text-raah-heading mb-2">Collision Count by Scenario</h2>
            <p className="text-sm text-raah-muted mb-4">RAAH achieves zero collisions across all five scenarios</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BAR_DATA} margin={{ top: 4, right: 4, bottom: 4, left: -24 }} barGap={4}>
                  <CartesianGrid stroke="#E2E1DE" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} iconType="square" wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                  <Bar dataKey="baseline" name="Baseline" fill="#8A8880" radius={[2, 2, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="raah" name="RAAH" fill="#3D7A5C" radius={[2, 2, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <h2 className="text-xl font-medium text-raah-heading mb-2">Capability Radar</h2>
            <p className="text-sm text-raah-muted mb-4">Multi-dimensional capability comparison</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#E2E1DE" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8A8880' }} />
                  <Radar name="Baseline" dataKey="baseline" stroke="#8A8880" fill="#8A8880" fillOpacity={0.08} strokeWidth={1} />
                  <Radar name="RAAH" dataKey="raah" stroke="#C17A3A" fill="#C17A3A" fillOpacity={0.15} strokeWidth={1.5} />
                  <Legend iconSize={8} iconType="square" wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>

        {/* Disclaimer */}
        <Reveal delay={400}>
          <div className="p-6 border border-raah-border rounded-sm bg-raah-surface">
            <p className="text-xs font-medium text-raah-heading mb-2">About these results</p>
            <p className="text-sm text-raah-muted leading-relaxed">
              All values shown on this page are generated by the RAAH mock simulation engine for demonstration purposes. They are not the result of real vehicle deployments, controlled experiments, or peer-reviewed studies. Values are clearly labelled as simulated throughout the application. Future work includes deploying RAAH with CARLA simulator and real sensor data to obtain verifiable experimental results.
            </p>
          </div>
        </Reveal>

      </div>
    </div>
  )
}
