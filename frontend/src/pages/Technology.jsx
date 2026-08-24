import { useState } from 'react'
import { useIntersection } from '../components/ui/useIntersection'
import { ChevronRight } from 'lucide-react'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

const ARCH_NODES = [
  {
    id: 'carla',
    label: 'CARLA',
    sublabel: 'Simulation Environment',
    purpose: 'Open-source autonomous driving simulator providing photorealistic environments and sensor data.',
    technology: 'Unreal Engine 4, Python API',
    current: 'Mock simulation engine (frontend)',
    future: 'Direct CARLA integration via Python API over WebSocket',
  },
  {
    id: 'sensors',
    label: 'Sensors',
    sublabel: 'Perception inputs',
    purpose: 'Multi-modal sensor suite capturing the complete driving environment in real time.',
    technology: 'Camera (RGB), LiDAR (3D), GPS/IMU, Radar',
    current: 'Simulated sensor outputs from mock engine',
    future: 'Real CARLA sensor actors or physical hardware sensors',
  },
  {
    id: 'perception',
    label: 'AI Perception',
    sublabel: 'Object detection',
    purpose: 'Real-time detection and classification of all dynamic and static objects in the scene.',
    technology: 'YOLOv8/v9, OpenCV, PyTorch',
    current: 'Simulated object list with confidence scores',
    future: 'Full YOLOv9 inference on CARLA camera frames',
  },
  {
    id: 'tracking',
    label: 'Object Tracking',
    sublabel: 'Multi-object tracking',
    purpose: 'Persistent identity assignment and state tracking for all detected objects across frames.',
    technology: 'ByteTrack, Kalman Filter, Hungarian algorithm',
    current: 'Object IDs with simulated state evolution',
    future: 'ByteTrack running on real detection outputs',
  },
  {
    id: 'risk',
    label: 'Risk Engine',
    sublabel: 'Safety assessment',
    purpose: 'Quantifies collision risk from multiple factors and determines when replanning is necessary.',
    technology: 'TTC computation, collision probability model, custom risk scorer',
    current: 'Full risk engine implemented in frontend simulation',
    future: 'Python backend with more sophisticated physics models',
  },
  {
    id: 'costmap',
    label: 'Dynamic Costmap',
    sublabel: 'Navigation grid',
    purpose: 'Occupancy grid that encodes traversability, risk zones, and obstacle inflation around detected objects.',
    technology: 'ROS-style costmap layers, inflation radius, clearance cost',
    current: 'Simplified risk zones in simulation visualisation',
    future: 'Full 2D costmap at 0.1m resolution, updated at 10Hz',
  },
  {
    id: 'planner',
    label: 'Path Planner',
    sublabel: 'Trajectory generation',
    purpose: 'Generates kinematically feasible, safe trajectories from the current position to the destination.',
    technology: 'Hybrid A*, local trajectory optimisation, B-spline smoothing',
    current: 'Route waypoints with animated replanning in simulation',
    future: 'Full Hybrid A* implementation with Reeds-Shepp curves',
  },
  {
    id: 'controller',
    label: 'Controller',
    sublabel: 'Vehicle actuation',
    purpose: 'Executes the planned trajectory by computing throttle, brake, and steering commands.',
    technology: 'Stanley controller, Pure Pursuit, Model Predictive Control',
    current: 'Animated vehicle following simulated path',
    future: 'Stanley lateral + PID longitudinal on CARLA vehicle',
  },
]

function ArchNode({ node, isSelected, onClick }) {
  return (
    <button
      onClick={() => onClick(node.id)}
      className={`w-full text-left px-4 py-3 rounded-sm border transition-all duration-200 group
        ${isSelected
          ? 'border-raah-accent bg-raah-accent/5 text-raah-heading'
          : 'border-raah-border text-raah-body hover:border-raah-body hover:bg-raah-surface'
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{node.label}</p>
          <p className="text-[10px] text-raah-muted mt-0.5 tracking-[.04em]">{node.sublabel}</p>
        </div>
        <ChevronRight size={14} className={`text-raah-muted transition-transform ${isSelected ? 'rotate-90 text-raah-accent' : ''}`} />
      </div>
    </button>
  )
}

function NodeDetail({ node }) {
  if (!node) return null
  return (
    <div className="space-y-5 p-8 border border-raah-border rounded-sm bg-raah-bg">
      <div>
        <p className="raah-label mb-1">Component</p>
        <h3 className="text-2xl font-semibold text-raah-heading">{node.label}</h3>
        <p className="text-sm text-raah-muted mt-0.5">{node.sublabel}</p>
      </div>
      <div className="pt-4 border-t border-raah-border space-y-4">
        <div>
          <p className="raah-label mb-1">Purpose</p>
          <p className="text-sm text-raah-body leading-relaxed">{node.purpose}</p>
        </div>
        <div>
          <p className="raah-label mb-1">Technology</p>
          <p className="text-sm text-raah-body">{node.technology}</p>
        </div>
        <div>
          <p className="raah-label mb-1">Current implementation</p>
          <p className="text-sm text-raah-muted">{node.current}</p>
        </div>
        <div>
          <p className="raah-label mb-1">Future implementation</p>
          <p className="text-sm text-raah-accent">{node.future}</p>
        </div>
      </div>
    </div>
  )
}

export default function Technology() {
  const [selected, setSelected] = useState('carla')

  const toggle = (id) => setSelected(id === selected ? null : id)
  const activeNode = ARCH_NODES.find((n) => n.id === selected)

  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Technology</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Architecture.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            Click any component to explore its purpose, technology choices, current state, and future implementation plan.
          </p>
        </div>
      </div>

      <div className="raah-container py-16">
        <div className="grid grid-cols-12 gap-10">

          {/* Architecture stack */}
          <div className="col-span-12 md:col-span-4">
            <Reveal>
              <p className="raah-label mb-4">Stack</p>
              <div className="relative space-y-0">
                {ARCH_NODES.map((node, i) => (
                  <div key={node.id} className="relative">
                    <ArchNode
                      node={node}
                      isSelected={selected === node.id}
                      onClick={toggle}
                    />
                    {i < ARCH_NODES.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <div className="w-px h-3 bg-raah-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Detail panel */}
          <div className="col-span-12 md:col-span-8">
            <Reveal delay={150}>
              {activeNode ? (
                <NodeDetail node={activeNode} />
              ) : (
                <div className="border border-raah-border rounded-sm p-10 text-center">
                  <p className="text-sm text-raah-muted">Select a component to view details</p>
                </div>
              )}
            </Reveal>

            {/* Integration diagram */}
            <Reveal delay={250}>
              <div className="mt-10 p-8 bg-raah-surface border border-raah-border rounded-sm">
                <p className="raah-label mb-4">Integration Overview</p>
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  {[
                    { tier: 'Simulation', items: ['CARLA', 'Mock Engine'], color: 'border-raah-muted/30' },
                    { tier: 'Backend',    items: ['FastAPI', 'WebSocket', 'AI Modules'], color: 'border-raah-info/30' },
                    { tier: 'Frontend',  items: ['React', 'Zustand', 'Canvas'], color: 'border-raah-accent/30' },
                  ].map(({ tier, items, color }) => (
                    <div key={tier} className={`border ${color} rounded-sm p-4`}>
                      <p className="font-medium text-raah-heading mb-3">{tier}</p>
                      {items.map((item) => (
                        <p key={item} className="text-raah-muted py-0.5">{item}</p>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-raah-muted">
                  <span>CARLA</span>
                  <div className="w-8 h-px bg-raah-border" />
                  <span>→</span>
                  <div className="w-8 h-px bg-raah-border" />
                  <span>FastAPI/WebSocket</span>
                  <div className="w-8 h-px bg-raah-border" />
                  <span>→</span>
                  <div className="w-8 h-px bg-raah-border" />
                  <span>RAAH Frontend</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
