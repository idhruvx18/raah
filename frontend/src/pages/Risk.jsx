import { useSimStore } from '../store/simulationStore'
import RiskScale from '../components/ui/RiskScale'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { useIntersection } from '../components/ui/useIntersection'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useEffect, useRef, useState } from 'react'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function ContributorBar({ label, value, max = 1 }) {
  const [ref, visible] = useIntersection()
  const pct = Math.round(value * 100)
  return (
    <div ref={ref} className="flex items-center gap-4 py-3 border-b border-raah-border last:border-0">
      <span className="text-sm text-raah-body w-40 shrink-0">{label}</span>
      <div className="flex-1 h-0.5 bg-raah-border rounded-full overflow-hidden">
        <div
          className="h-full bg-raah-accent rounded-full transition-all duration-1000 ease-smooth"
          style={{ width: visible ? `${pct}%` : '0%' }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums text-raah-heading w-10 text-right">{pct}%</span>
    </div>
  )
}

// Mock risk history for chart
const RISK_HISTORY = Array.from({ length: 40 }, (_, i) => ({
  t: i,
  risk: Math.min(95, Math.max(5,
    20 + Math.sin(i * 0.3) * 15
    + (i > 15 && i < 22 ? 50 : 0)
    + (i > 28 && i < 33 ? 40 : 0)
  )),
  ttc: Math.max(0.5, 5 - Math.sin(i * 0.3) * 2 - (i > 15 && i < 22 ? 3 : 0)),
}))

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-raah-border rounded-sm px-3 py-2 shadow-sm">
      <p className="text-[10px] text-raah-muted mb-1">t = {label}s</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)}
        </p>
      ))}
    </div>
  )
}

export default function Risk() {
  const { riskState } = useSimStore()

  const contributors = [
    { label: 'Obstacle Proximity',     v: riskState.contributors.obstacleProximity },
    { label: 'Relative Velocity',      v: riskState.contributors.relativeVelocity },
    { label: 'Trajectory Intersection',v: riskState.contributors.trajectoryIntersect },
    { label: 'Traffic Density',        v: riskState.contributors.trafficDensity },
    { label: 'Road Hazard',            v: riskState.contributors.roadHazard },
  ]

  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      {/* Header */}
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Risk Analysis</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Quantifying the unsafe.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            RAAH's risk engine computes a continuous safety score from multiple contributing factors, enabling proactive replanning before a collision becomes inevitable.
          </p>
        </div>
      </div>

      <div className="raah-container py-16">
        <div className="grid grid-cols-12 gap-12">

          {/* Current risk */}
          <div className="col-span-12 md:col-span-4">
            <Reveal>
              <div className="sticky top-24">
                <p className="raah-label mb-8">Live Risk State</p>
                <RiskScale
                  score={riskState.score}
                  ttc={riskState.ttc}
                  primaryThreat={riskState.primaryThreat}
                />
                <div className="mt-8 pt-8 border-t border-raah-border">
                  <p className="raah-label mb-4">Risk Thresholds</p>
                  {[
                    { label: 'SAFE',     range: '0 – 30',  color: 'bg-raah-safe' },
                    { label: 'MODERATE', range: '30 – 55', color: 'bg-raah-warn' },
                    { label: 'HIGH',     range: '55 – 75', color: 'bg-raah-danger' },
                    { label: 'CRITICAL', range: '75 – 100', color: 'bg-[#7A1F10]' },
                  ].map(({ label, range, color }) => (
                    <div key={label} className="flex items-center gap-3 mb-3">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs font-medium tracking-[.06em] text-raah-body w-20">{label}</span>
                      <span className="text-xs tabular-nums text-raah-muted">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right content */}
          <div className="col-span-12 md:col-span-8">
            {/* Contributors */}
            <Reveal>
              <h2 className="text-xl font-medium text-raah-heading mb-6">Risk Contributors</h2>
            </Reveal>
            {contributors.map((c, i) => (
              <ContributorBar key={c.label} label={c.label} value={c.v} />
            ))}

            {/* Risk over time chart */}
            <Reveal delay={200}>
              <div className="mt-12">
                <h2 className="text-xl font-medium text-raah-heading mb-2">Risk Over Time</h2>
                <p className="text-sm text-raah-muted mb-6">Demo session — two obstacle encounter events visible</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={RISK_HISTORY} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                      <CartesianGrid stroke="#E2E1DE" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="t"
                        tick={{ fontSize: 10, fill: '#8A8880' }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#8A8880' }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone" dataKey="risk" name="Risk"
                        stroke="#C17A3A" strokeWidth={1.5} dot={false}
                        activeDot={{ r: 3, fill: '#C17A3A' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-raah-muted mt-2 text-right">Simulated values — not real experimental results</p>
              </div>
            </Reveal>

            {/* TTC chart */}
            <Reveal delay={300}>
              <div className="mt-10">
                <h2 className="text-xl font-medium text-raah-heading mb-2">Time-to-Collision (TTC)</h2>
                <p className="text-sm text-raah-muted mb-6">Lower values indicate higher urgency for replanning</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={RISK_HISTORY} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                      <CartesianGrid stroke="#E2E1DE" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8A8880' }} tickLine={false} axisLine={false} domain={[0, 6]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone" dataKey="ttc" name="TTC (s)"
                        stroke="#3A6090" strokeWidth={1.5} dot={false}
                        activeDot={{ r: 3, fill: '#3A6090' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>

            {/* Risk formula */}
            <Reveal delay={400}>
              <div className="mt-12 p-8 bg-raah-surface border border-raah-border rounded-sm">
                <p className="raah-label mb-4">Risk Computation</p>
                <p className="text-sm text-raah-body leading-relaxed mb-4">
                  The risk score is a weighted combination of five factors, normalised to [0, 100]:
                </p>
                <div className="font-mono text-sm text-raah-body bg-raah-bg p-4 rounded-sm border border-raah-border">
                  R = w₁·proximity + w₂·rel_velocity + w₃·traj_intersect + w₄·traffic + w₅·road_hazard
                </div>
                <p className="text-xs text-raah-muted mt-3">
                  Weights are scenario-dependent. High w₃ weight ensures trajectory intersection is always the dominant factor.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
