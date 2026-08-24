import { useEffect, useRef } from 'react'
import { useSimStore } from '../../store/simulationStore'

const W = 800
const H = 600

// ── Color palette (no neon) ───────────────────────────────────────────────────
const C = {
  roadBg:       '#1E1D1B',
  road:         '#2A2826',
  roadLine:     '#3A3835',
  laneMark:     '#4A4845',
  laneMarkDash: '#3E3C3A',
  sidewalk:     '#252421',
  building:     '#242220',
  tree:         '#243020',

  egoFill:      '#F0EDE8',
  egoStroke:    '#C17A3A',
  egoDot:       '#C17A3A',

  vehicleFill:   '#3A4048',
  vehicleStroke: '#4A5060',
  bikeFill:     '#4A4040',
  bikeStroke:   '#6A5050',
  pedFill:      '#404848',
  pedStroke:    '#506060',
  animalFill:   '#504030',

  routeCurrent: '#B0ADA8',
  routeAlt:     '#C17A3A',
  routeRisk:    'rgba(160, 64, 45, 0.18)',
  routeObstacle:'rgba(184, 132, 58, 0.35)',

  bbox:         'rgba(193, 122, 58, 0.7)',
  bboxFill:     'rgba(193, 122, 58, 0.04)',
  text:         '#9A9793',
}

function drawRoad(ctx) {
  // Background
  ctx.fillStyle = C.roadBg
  ctx.fillRect(0, 0, W, H)

  // Sidewalk strips
  ctx.fillStyle = C.sidewalk
  ctx.fillRect(0, 0, 200, H)
  ctx.fillRect(600, 0, 200, H)

  // Road surface
  ctx.fillStyle = C.road
  ctx.fillRect(200, 0, 400, H)

  // Road edges
  ctx.strokeStyle = C.roadLine
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(200, 0); ctx.lineTo(200, H)
  ctx.moveTo(600, 0); ctx.lineTo(600, H)
  ctx.stroke()

  // Centre dashed line
  ctx.strokeStyle = C.laneMarkDash
  ctx.lineWidth = 1
  ctx.setLineDash([20, 18])
  ctx.beginPath()
  ctx.moveTo(400, 0); ctx.lineTo(400, H)
  ctx.stroke()
  ctx.setLineDash([])

  // Subtle lane divisions
  ctx.strokeStyle = '#2E2C2A'
  ctx.lineWidth = 0.5
  ctx.setLineDash([12, 22])
  ;[320, 480].forEach((x) => {
    ctx.beginPath()
    ctx.moveTo(x, 0); ctx.lineTo(x, H)
    ctx.stroke()
  })
  ctx.setLineDash([])

  // Buildings / environmental details
  const buildings = [
    [20, 60, 100, 180], [20, 280, 80, 160], [20, 460, 120, 160],
    [110, 80, 70, 200], [650, 40, 90, 200], [660, 280, 110, 180],
  ]
  ctx.fillStyle = C.building
  buildings.forEach(([x, y, w, h]) => {
    ctx.fillRect(x, y, w, h)
    // Window grid
    ctx.fillStyle = '#2A2826'
    for (let wy = y + 12; wy < y + h - 8; wy += 16) {
      for (let wx = x + 8; wx < x + w - 8; wx += 14) {
        ctx.fillRect(wx, wy, 6, 8)
      }
    }
    ctx.fillStyle = C.building
  })
}

function drawRoutePaths(ctx, plannerState) {
  const { currentPath, alternativePath, riskZones, isReplanning } = plannerState

  // Risk zones
  riskZones.forEach(({ x, y, r, intensity }) => {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0,   `rgba(160, 64, 45, ${intensity * 0.5})`)
    grad.addColorStop(0.6, `rgba(160, 64, 45, ${intensity * 0.2})`)
    grad.addColorStop(1,   'rgba(160, 64, 45, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // Current path (fades when replanning)
  if (currentPath.length > 1) {
    ctx.save()
    ctx.globalAlpha = isReplanning ? 0.25 : 0.5
    ctx.strokeStyle = C.routeCurrent
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 8])
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(currentPath[0].x, currentPath[0].y)
    currentPath.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // Alternative path (drawn when replanning)
  if (isReplanning && alternativePath.length > 1) {
    ctx.save()
    ctx.strokeStyle = C.routeAlt
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.lineCap = 'round'
    ctx.shadowColor = 'transparent'
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.moveTo(alternativePath[0].x, alternativePath[0].y)
    alternativePath.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.stroke()
    ctx.restore()
  }
}

function drawEgoVehicle(ctx, vehicle) {
  const { x, y, heading } = vehicle
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((heading * Math.PI) / 180)

  // Car body
  const W2 = 18, H2 = 32
  ctx.fillStyle = C.egoFill
  ctx.strokeStyle = C.egoStroke
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(-W2 / 2, -H2 / 2, W2, H2, 4)
  ctx.fill()
  ctx.stroke()

  // Front accent bar
  ctx.fillStyle = C.egoStroke
  ctx.fillRect(-W2 / 2 + 2, -H2 / 2 + 2, W2 - 4, 4)

  // Wheels
  ctx.fillStyle = '#2A2826'
  ;[[-W2/2 - 2, -H2/2 + 4], [W2/2 - 2, -H2/2 + 4],
    [-W2/2 - 2,  H2/2 - 8], [W2/2 - 2,  H2/2 - 8]].forEach(([wx, wy]) => {
    ctx.fillRect(wx, wy, 5, 8)
  })

  // Direction dot
  ctx.fillStyle = C.egoDot
  ctx.beginPath()
  ctx.arc(0, -H2 / 2 - 5, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawObject(ctx, obj, tick) {
  const { x, y, type, label, distance, confidence, id } = obj
  const isClose = distance < 25

  ctx.save()
  ctx.translate(x, y)

  // Body
  let bw = 16, bh = 28
  if (type === 'MOTORCYCLE') { bw = 8; bh = 22 }
  else if (type === 'PEDESTRIAN') { bw = 10; bh = 20 }
  else if (type === 'ANIMAL') { bw = 20; bh = 14 }

  const fillColor = type === 'VEHICLE' ? C.vehicleFill
    : type === 'MOTORCYCLE' ? C.bikeFill
    : type === 'PEDESTRIAN' ? C.pedFill
    : C.animalFill

  const strokeColor = type === 'VEHICLE' ? C.vehicleStroke
    : type === 'MOTORCYCLE' ? C.bikeStroke
    : type === 'PEDESTRIAN' ? C.pedStroke
    : '#706050'

  ctx.fillStyle = fillColor
  ctx.strokeStyle = isClose ? C.bbox : strokeColor
  ctx.lineWidth = isClose ? 1 : 0.8
  ctx.beginPath()
  ctx.roundRect(-bw/2, -bh/2, bw, bh, 2)
  ctx.fill()
  ctx.stroke()

  // Detection bounding box (only for close objects)
  if (confidence > 0.7) {
    const pad = 6
    ctx.strokeStyle = C.bbox
    ctx.lineWidth = 0.8
    ctx.globalAlpha = isClose ? 0.7 : 0.35
    ctx.strokeRect(-bw/2 - pad, -bh/2 - pad, bw + pad*2, bh + pad*2)
    ctx.globalAlpha = 1
  }

  // Label
  if (isClose || true) {
    ctx.fillStyle = C.text
    ctx.font = '8px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${label}`, 0, -bh/2 - 10)
    ctx.fillStyle = C.bbox
    ctx.fillText(`${distance}m`, 0, -bh/2 - 2)
  }

  ctx.restore()
}

function drawTelemetryOverlay(ctx, vehicle, riskState) {
  // Subtle HUD in bottom-left corner
  ctx.save()
  ctx.font = '10px Inter, sans-serif'
  ctx.fillStyle = 'rgba(240, 237, 232, 0.5)'
  ctx.fillText(`${Math.round(vehicle.speed)} km/h`, 12, H - 16)
  ctx.fillStyle = 'rgba(193, 122, 58, 0.6)'
  ctx.fillText(`RISK ${Math.round(riskState.score)}`, 80, H - 16)
  ctx.restore()
}

export default function SimCanvas({ width = W, height = H, className = '' }) {
  const canvasRef = useRef(null)
  const tickRef   = useRef(0)
  const rafRef    = useRef(null)

  // Draw loop reads directly from store
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const render = () => {
      tickRef.current++
      const { vehicleState, objectState, plannerState, riskState, simulationState } = useSimStore.getState()

      ctx.clearRect(0, 0, W, H)
      drawRoad(ctx)
      drawRoutePaths(ctx, plannerState)
      objectState.forEach((obj) => drawObject(ctx, obj, tickRef.current))
      if (simulationState.status !== 'IDLE') {
        drawEgoVehicle(ctx, vehicleState)
      }
      drawTelemetryOverlay(ctx, vehicleState, riskState)

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={`w-full h-full object-contain ${className}`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}
