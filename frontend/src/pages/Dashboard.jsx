import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, Square, Zap, RotateCcw } from 'lucide-react'
import { useSimStore, SIMULATION_STATUS } from '../store/simulationStore'
import { simEngine } from '../simulation/SimEngine'
import { demoSequence } from '../simulation/DemoSequence'
import SimCanvas from '../components/simulation/SimCanvas'
import RiskScale from '../components/ui/RiskScale'
import StatusBadge from '../components/ui/StatusBadge'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import Notification from '../components/ui/Notification'

const INJECT_ACTIONS = [
  { id: 'motorcycle_cutin', label: 'Motorcycle Cut-In' },
  { id: 'pedestrian',       label: 'Pedestrian Crossing' },
  { id: 'animal',           label: 'Animal' },
  { id: 'roadblock',        label: 'Roadblock' },
  { id: 'pothole',          label: 'Pothole' },
  { id: 'vehicle_merge',    label: 'Vehicle Merge' },
]

// ── Object type pill ──────────────────────────────────────────────────────────
function ObjectPill({ obj }) {
  const typeColor = {
    VEHICLE:    'text-raah-info',
    MOTORCYCLE: 'text-raah-warn',
    PEDESTRIAN: 'text-raah-muted',
    ANIMAL:     'text-raah-accent',
    OBSTACLE:   'text-raah-danger',
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-raah-border last:border-0">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold tracking-[.08em] w-14 ${typeColor[obj.type] || 'text-raah-muted'}`}>
          {obj.label} #{obj.id.split('-').pop()?.slice(-2) || '00'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs tabular-nums text-raah-heading font-medium">{obj.distance}m</span>
        <span className="text-[10px] text-raah-muted tabular-nums">
          {Math.round(obj.confidence * 100)}%
        </span>
      </div>
    </div>
  )
}

// ── Telemetry row ─────────────────────────────────────────────────────────────
function TelemetryItem({ value, unit, label, decimals = 0 }) {
  return (
    <div className="py-3 border-b border-raah-border last:border-0">
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="text-3xl font-semibold tabular-nums text-raah-heading tracking-[-0.02em]">
          <AnimatedNumber value={value} decimals={decimals} />
        </span>
        <span className="text-xs font-medium text-raah-muted uppercase tracking-[.06em]">{unit}</span>
      </div>
      <p className="raah-label">{label}</p>
    </div>
  )
}

// ── Decision panel ────────────────────────────────────────────────────────────
function DecisionPanel({ decision }) {
  if (!decision) return (
    <div className="py-6 text-center">
      <p className="text-xs text-raah-muted">No replanning events yet</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium tracking-[.06em] text-raah-muted uppercase">Why did RAAH replan?</p>
      <p className="text-sm text-raah-body leading-relaxed">{decision.reason}</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'TTC', before: `${decision.ttcBefore}s`, after: `${decision.ttcAfter}s`, danger: true },
          { label: 'Collision prob.', before: `${Math.round(decision.probBefore * 100)}%`, after: `${Math.round(decision.probAfter * 100)}%`, danger: true },
        ].map((item) => (
          <div key={item.label} className="bg-raah-surface rounded-sm p-3">
            <p className="raah-label mb-2">{item.label}</p>
            <div className="flex items-center gap-1.5 text-xs tabular-nums">
              <span className="text-raah-muted">{item.before}</span>
              <span className="text-raah-muted">→</span>
              <span className="font-semibold text-raah-danger">{item.after}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex gap-3">
          <span className="raah-label w-16">Decision</span>
          <span className="text-xs text-raah-body">{decision.decision}</span>
        </div>
        <div className="flex gap-3">
          <span className="raah-label w-16">Response</span>
          <span className="text-xs text-raah-body">{decision.response}</span>
        </div>
      </div>
    </div>
  )
}

// ── Event log ─────────────────────────────────────────────────────────────────
const EVENT_COLORS = {
  info:       'text-raah-muted',
  warn:       'text-raah-warn',
  danger:     'text-raah-danger',
  success:    'text-raah-safe',
  replan:     'text-raah-accent',
  replan_done:'text-raah-safe',
  demo:       'text-raah-info',
  injection:  'text-raah-accent',
}

function EventLog({ events }) {
  const listRef = useRef(null)
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [events.length])

  return (
    <div ref={listRef} className="overflow-y-auto max-h-32">
      {events.length === 0 ? (
        <p className="text-xs text-raah-muted py-2">No events yet</p>
      ) : (
        <div className="space-y-0.5">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-start gap-2 py-1">
              <span className="text-[10px] text-raah-muted tabular-nums w-12 shrink-0 pt-px">
                {parseFloat(ev.time || 0).toFixed(1)}s
              </span>
              <span className={`text-[11px] leading-tight ${EVENT_COLORS[ev.severity] || EVENT_COLORS.info}`}>
                {ev.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    vehicleState, objectState, riskState, plannerState,
    simulationState, eventLog, decisionLog,
    injectEvent
  } = useSimStore()

  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('telemetry') // telemetry | objects | decision

  const isRunning = simulationState.status === SIMULATION_STATUS.RUNNING
  const isIdle    = simulationState.status === SIMULATION_STATUS.IDLE
  const isDone    = simulationState.status === SIMULATION_STATUS.COMPLETED

  const showNotification = (message, severity = 'info') => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, severity }])
  }

  const handleStart = () => {
    simEngine.start()
    showNotification('Simulation started', 'success')
  }

  const handleDemo = () => {
    demoSequence.start(() => showNotification('Demo complete — view results', 'success'))
    showNotification('Demo mode started', 'info')
  }

  const handlePause = () => {
    if (isRunning) { simEngine.pause(); showNotification('Paused') }
    else { simEngine.resume(); showNotification('Resumed') }
  }

  const handleStop = () => {
    simEngine.stop()
    demoSequence.stop()
    showNotification('Simulation stopped')
  }

  const handleInject = (actionId) => {
    injectEvent(actionId)
    showNotification('Trajectory replanned', 'warn')
  }

  // Auto-switch to decision tab when a replan happens
  useEffect(() => {
    if (decisionLog.length > 0 && plannerState.isReplanning) {
      setActiveTab('decision')
    }
  }, [decisionLog.length, plannerState.isReplanning])

  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-raah-border bg-raah-bg sticky top-14 z-30">
        <div className="raah-container h-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium tracking-[.06em] text-raah-heading">LIVE SIMULATION</span>
            <div className="w-px h-3 bg-raah-border" />
            <StatusBadge status={simulationState.status} online={isRunning} />
            {simulationState.scenario && (
              <>
                <div className="w-px h-3 bg-raah-border" />
                <span className="text-xs text-raah-muted uppercase tracking-[.06em]">
                  {simulationState.scenario.replace(/_/g, ' ')}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-raah-muted">
            <span className="tabular-nums">{simulationState.perceptionFPS} FPS</span>
            <div className="w-px h-3 bg-raah-border" />
            <span className="tabular-nums">{simulationState.replans} replans</span>
          </div>
        </div>
      </div>

      <div className="raah-container py-6">
        <div className="grid grid-cols-12 gap-4">

          {/* ── Left panel: Telemetry / Objects / Decision ───────────────────── */}
          <div className="col-span-12 lg:col-span-3">
            {/* Tabs */}
            <div className="flex border-b border-raah-border mb-4">
              {[
                { id: 'telemetry', label: 'Vehicle' },
                { id: 'objects',   label: `Objects (${objectState.length})` },
                { id: 'decision',  label: 'Decision' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium tracking-[.04em] border-b-2 -mb-px transition-colors
                    ${activeTab === tab.id
                      ? 'border-raah-accent text-raah-heading'
                      : 'border-transparent text-raah-muted hover:text-raah-body'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'telemetry' && (
              <div>
                <TelemetryItem value={vehicleState.speed}   unit="km/h"    label="Speed"    decimals={1} />
                <TelemetryItem value={vehicleState.steering} unit="°"      label="Steering" decimals={1} />
                <TelemetryItem value={vehicleState.throttle} unit="%"      label="Throttle" decimals={0} />
                <TelemetryItem value={vehicleState.brake}    unit="%"      label="Brake"    decimals={0} />
                <TelemetryItem value={vehicleState.destinationDist} unit="m" label="Destination" decimals={0} />
              </div>
            )}

            {activeTab === 'objects' && (
              <div>
                {objectState.length === 0
                  ? <p className="text-xs text-raah-muted py-4">No objects detected</p>
                  : objectState.map((obj) => <ObjectPill key={obj.id} obj={obj} />)
                }
              </div>
            )}

            {activeTab === 'decision' && (
              <DecisionPanel decision={decisionLog[0]} />
            )}

            {/* Planning latency */}
            {plannerState.planningLatencyMs > 0 && (
              <div className="mt-4 pt-4 border-t border-raah-border">
                <div className="flex items-center justify-between">
                  <span className="raah-label">Planning latency</span>
                  <span className="text-xs font-medium tabular-nums text-raah-heading">
                    {plannerState.planningLatencyMs}ms
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Centre: Simulation viewport ──────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-6">
            <div className="sim-viewport" style={{ aspectRatio: '4/3' }}>
              <SimCanvas className="absolute inset-0" />

              {/* Replanning banner */}
              {plannerState.isReplanning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-raah-bg/90 border border-raah-accent/30 rounded-sm px-4 py-2">
                  <span className="text-xs font-medium text-raah-accent tracking-[.06em]">REPLANNING</span>
                </div>
              )}

              {/* Completion overlay */}
              {isDone && (
                <div className="absolute inset-0 bg-raah-dark/80 flex flex-col items-center justify-center gap-4">
                  <p className="text-sm font-medium text-white tracking-[.06em]">SIMULATION COMPLETE</p>
                  <Link to="/results" className="btn-accent text-sm">View Results</Link>
                </div>
              )}

              {/* Idle overlay */}
              {isIdle && (
                <div className="absolute inset-0 bg-raah-dark/60 flex flex-col items-center justify-center gap-4">
                  <p className="text-sm text-white/50 mb-2">Press start to begin</p>
                  <div className="flex gap-3">
                    <button onClick={handleStart} className="btn-primary text-sm gap-2">
                      <Play size={14} /> Start
                    </button>
                    <button onClick={handleDemo} className="btn-accent text-sm gap-2">
                      <Zap size={14} /> Demo Mode
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isIdle ? (
                  <>
                    <button onClick={handleStart} className="btn-primary text-xs gap-1.5 py-2 px-4">
                      <Play size={12} /> Start
                    </button>
                    <button onClick={handleDemo} className="btn-accent text-xs gap-1.5 py-2 px-4">
                      <Zap size={12} /> Demo
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handlePause} className="btn-ghost text-xs gap-1.5 py-2 px-4">
                      {isRunning ? <Pause size={12} /> : <Play size={12} />}
                      {isRunning ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={handleStop} className="btn-ghost text-xs gap-1.5 py-2 px-4">
                      <Square size={12} /> Stop
                    </button>
                  </>
                )}
              </div>

              {/* Scenario injector */}
              {isRunning && (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {INJECT_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleInject(a.id)}
                      className="text-[10px] font-medium tracking-[.04em] px-2.5 py-1.5 border border-raah-border text-raah-muted rounded-sm hover:border-raah-accent hover:text-raah-accent transition-all duration-150"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Session metrics */}
            {!isIdle && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  { value: simulationState.distanceTravelled, unit: 'm',  label: 'Distance' },
                  { value: vehicleState.speed,                unit: 'km/h', label: 'Speed' },
                  { value: simulationState.replans,           unit: '',    label: 'Replans' },
                  { value: simulationState.avgTTC || 0,       unit: 's',   label: 'Avg TTC', dec: 1 },
                ].map((m) => (
                  <div key={m.label} className="text-center border border-raah-border rounded-sm py-3 px-2">
                    <div className="text-xl font-semibold tabular-nums text-raah-heading tracking-[-0.02em]">
                      <AnimatedNumber value={m.value} decimals={m.dec || 0} />
                      {m.unit && <span className="text-xs font-normal text-raah-muted ml-0.5">{m.unit}</span>}
                    </div>
                    <p className="raah-label mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right panel: Risk + Event log ────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-3">
            <div className="border-b border-raah-border pb-5 mb-5">
              <RiskScale
                score={riskState.score}
                ttc={riskState.ttc}
                primaryThreat={riskState.primaryThreat}
              />
            </div>

            {/* Risk contributors */}
            <div className="mb-5">
              <p className="raah-label mb-3">Risk Factors</p>
              {[
                { label: 'Proximity',      v: riskState.contributors.obstacleProximity },
                { label: 'Relative vel.',  v: riskState.contributors.relativeVelocity },
                { label: 'Trajectory',     v: riskState.contributors.trajectoryIntersect },
                { label: 'Traffic',        v: riskState.contributors.trafficDensity },
                { label: 'Road hazard',    v: riskState.contributors.roadHazard },
              ].map(({ label, v }) => (
                <div key={label} className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] text-raah-muted w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-0.5 bg-raah-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-raah-accent rounded-full transition-all duration-700 ease-smooth"
                      style={{ width: `${Math.min(100, v * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-raah-muted w-8 text-right">
                    {Math.round(v * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Event log */}
            <div>
              <p className="raah-label mb-3">Event Log</p>
              <EventLog events={eventLog} />
            </div>
          </div>

        </div>
      </div>

      {/* Notification stack */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {notifications.slice(-3).map((n) => (
          <Notification
            key={n.id}
            message={n.message}
            severity={n.severity}
            onDone={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
          />
        ))}
      </div>
    </div>
  )
}
