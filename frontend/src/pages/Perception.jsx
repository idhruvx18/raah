import { useSimStore } from '../store/simulationStore'
import { useIntersection } from '../components/ui/useIntersection'
import { useRef, useEffect } from 'react'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

function PerceptionCanvas() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const tickRef   = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    const objects = [
      { type: 'VEHICLE', x: 280, y: 160, w: 24, h: 36, label: 'CAR #07', conf: 0.96, vx: 0.3, vy: -0.2 },
      { type: 'MOTORCYCLE', x: 360, y: 220, w: 12, h: 26, label: 'BIKE #14', conf: 0.94, vx: -0.5, vy: -0.6 },
      { type: 'PEDESTRIAN', x: 200, y: 280, w: 14, h: 28, label: 'PERSON', conf: 0.88, vx: 0.4, vy: 0 },
    ]

    const render = () => {
      tickRef.current++
      const t = tickRef.current
      ctx.clearRect(0, 0, W, H)

      // Camera feed background
      ctx.fillStyle = '#1A1918'; ctx.fillRect(0, 0, W, H)
      // Road texture
      ctx.fillStyle = '#222120'; ctx.fillRect(120, 0, W - 120, H)
      ctx.fillStyle = '#1E1D1B'; ctx.fillRect(0, 0, 120, H)
      ctx.fillStyle = '#1E1D1B'; ctx.fillRect(W - 80, 0, 80, H)
      // Lane dashes
      ctx.strokeStyle = '#2E2C2A'; ctx.lineWidth = 1; ctx.setLineDash([14, 18])
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
      ctx.setLineDash([])

      // Moving objects
      objects.forEach((obj, i) => {
        const ox = obj.x + Math.sin(t * 0.02 + i) * (obj.vx * 15)
        const oy = obj.y + Math.cos(t * 0.015 + i) * (obj.vy * 15)
        const confidence = obj.conf

        // Body
        ctx.fillStyle = '#3A3836'; ctx.strokeStyle = 'rgba(193,122,58,0.7)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.roundRect(ox - obj.w/2, oy - obj.h/2, obj.w, obj.h, 2); ctx.fill(); ctx.stroke()

        // Bounding box (detection overlay)
        const pad = 7
        ctx.strokeStyle = `rgba(193,122,58,${0.4 + confidence * 0.4})`; ctx.lineWidth = 0.8
        ctx.strokeRect(ox - obj.w/2 - pad, oy - obj.h/2 - pad, obj.w + pad*2, obj.h + pad*2)

        // Corner ticks
        const bx = ox - obj.w/2 - pad, by = oy - obj.h/2 - pad
        const bw2 = obj.w + pad*2, bh2 = obj.h + pad*2
        const tick = 6
        ctx.strokeStyle = `rgba(193,122,58,${0.7 + confidence * 0.3})`; ctx.lineWidth = 1.2
        ;[[bx, by, 1, 0, 0, 1], [bx+bw2, by, -1, 0, 0, 1], [bx, by+bh2, 1, 0, 0, -1], [bx+bw2, by+bh2, -1, 0, 0, -1]].forEach(([x, y, dx, dy, dy2, dx2]) => {
          ctx.beginPath()
          ctx.moveTo(x, y); ctx.lineTo(x + dx * tick, y + dy * tick)
          ctx.moveTo(x, y); ctx.lineTo(x + dy2 * tick, y + dx2 * tick * Math.sign(dy2 || dx2))
          ctx.stroke()
        })

        // Label chip
        ctx.fillStyle = 'rgba(193,122,58,0.85)'
        ctx.fillRect(ox - obj.w/2 - pad, oy - obj.h/2 - pad - 16, 80, 14)
        ctx.fillStyle = '#1A1918'; ctx.font = '8px Inter,sans-serif'; ctx.textAlign = 'left'
        ctx.fillText(`${obj.label}  ${Math.round(confidence * 100)}%`, ox - obj.w/2 - pad + 4, oy - obj.h/2 - pad - 5)

        // Velocity arrow
        if (Math.abs(obj.vx) + Math.abs(obj.vy) > 0.1) {
          const avx = obj.vx * 20, avy = obj.vy * 20
          ctx.strokeStyle = 'rgba(58,96,144,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4])
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + avx, oy + avy); ctx.stroke()
          ctx.setLineDash([])
        }
      })

      // FPS / frame counter HUD
      ctx.fillStyle = 'rgba(240,237,232,0.4)'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`PERCEPTION · ${Math.round(30 + Math.sin(t * 0.05) * 2)} FPS`, W - 10, H - 8)

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return <canvas ref={canvasRef} width={540} height={360} className="w-full rounded-sm" />
}

export default function Perception() {
  const { objectState, simulationState } = useSimStore()

  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">AI Perception</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Seeing the road as it is.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            RAAH's perception stack uses YOLO-based object detection, ByteTrack multi-object tracking, and Kalman filter state estimation to build a comprehensive real-time model of the environment.
          </p>
        </div>
      </div>

      <div className="raah-container py-16">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <div className="sim-viewport">
                <PerceptionCanvas />
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-1.5 bg-raah-dark/70 px-2.5 py-1.5 rounded-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-raah-safe" />
                    <span className="text-[10px] text-white/60 tracking-[.06em]">CAMERA FEED</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-raah-muted mt-2">
                Simulated camera feed with bounding boxes, confidence scores and velocity vectors
              </p>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <Reveal delay={100}>
              <h2 className="text-xl font-medium text-raah-heading mb-6">Perception Pipeline</h2>
              <div className="space-y-0">
                {[
                  { step: '01', label: 'Object Detection', tech: 'YOLOv8 / YOLOv9', desc: 'Real-time bounding box detection at 30+ FPS. Detects vehicles, motorcycles, pedestrians, animals.' },
                  { step: '02', label: 'Depth Estimation', tech: 'LiDAR · Stereo camera', desc: 'Accurate 3D position from sensor fusion. Each detection enriched with distance and height.' },
                  { step: '03', label: 'Multi-Object Tracking', tech: 'ByteTrack', desc: 'Persistent object IDs across frames. Handles occlusion and re-entry robustly.' },
                  { step: '04', label: 'State Estimation', tech: 'Kalman Filter', desc: 'Smooth velocity and position estimates. Filters sensor noise and provides consistent state.' },
                  { step: '05', label: 'Classification', tech: 'ResNet backbone', desc: 'Fine-grained object classification. Distinguishes car, bus, truck, motorcycle, bicycle, animal.' },
                ].map(({ step, label, tech, desc }) => (
                  <div key={step} className="flex gap-4 py-5 border-b border-raah-border last:border-0">
                    <span className="text-xl font-light tabular-nums text-raah-muted shrink-0 w-6">{step}</span>
                    <div>
                      <p className="text-sm font-medium text-raah-heading mb-0.5">{label}</p>
                      <p className="text-[10px] font-medium tracking-[.06em] text-raah-accent mb-1.5">{tech}</p>
                      <p className="text-xs text-raah-muted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Live object list */}
        {objectState.length > 0 && (
          <Reveal delay={200}>
            <div className="mt-12">
              <h2 className="text-xl font-medium text-raah-heading mb-4">Live Detections</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {objectState.map((obj) => (
                  <div key={obj.id} className="border border-raah-border rounded-sm p-4">
                    <p className="text-xs font-semibold tracking-[.06em] text-raah-accent mb-1">{obj.label}</p>
                    <p className="text-2xl font-semibold tabular-nums text-raah-heading">{obj.distance}<span className="text-sm font-normal text-raah-muted ml-0.5">m</span></p>
                    <p className="text-xs text-raah-muted mt-1">{Math.round(obj.confidence * 100)}% confidence</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* Sensor table */}
        <Reveal delay={300}>
          <div className="mt-12">
            <h2 className="text-xl font-medium text-raah-heading mb-6">Sensor Configuration</h2>
            <div className="border border-raah-border rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-raah-surface border-b border-raah-border">
                    {['Sensor', 'Type', 'Range', 'Update Rate', 'Primary Use'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-raah-muted tracking-[.04em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Camera',  'RGB',    '50 m',   '30 Hz', 'Detection & classification'],
                    ['LiDAR',   '3D',     '100 m',  '10 Hz', 'Depth & occupancy grid'],
                    ['GPS/IMU', 'GNSS + 9-DOF', '—', '100 Hz', 'Localisation & ego-motion'],
                    ['Radar',   'mmWave', '200 m',  '20 Hz', 'Velocity estimation'],
                  ].map(([sensor, type, range, rate, use]) => (
                    <tr key={sensor} className="border-b border-raah-border last:border-0 hover:bg-raah-surface transition-colors">
                      <td className="px-4 py-3 font-medium text-raah-heading">{sensor}</td>
                      <td className="px-4 py-3 text-raah-muted">{type}</td>
                      <td className="px-4 py-3 text-raah-muted tabular-nums">{range}</td>
                      <td className="px-4 py-3 text-raah-muted tabular-nums">{rate}</td>
                      <td className="px-4 py-3 text-raah-muted">{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
