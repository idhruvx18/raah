/**
 * RAAH Mock Simulation Engine
 *
 * Drives all simulation state through the Zustand store.
 * This module is intentionally decoupled from the UI — all rendering
 * reads from the store, and the engine only writes to the store.
 *
 * Future: replace tick() with WebSocket message dispatch from FastAPI.
 */

import { useSimStore, OBJECT_TYPES, SIMULATION_STATUS, getRiskLevel } from '../store/simulationStore'

const TWO_PI = Math.PI * 2
const DEG = Math.PI / 180

// ── Canvas-space road geometry ────────────────────────────────────────────────
// The viewport is 800×600. The road runs roughly top→bottom.
export const ROAD = {
  lanes: [
    { x: 340, width: 80 },
    { x: 420, width: 80 },
  ],
  leftEdge:  240,
  rightEdge: 560,
}

// Waypoints for the ego vehicle route (canvas coords, y decreasing = forward)
const BASE_ROUTE = [
  { x: 400, y: 540 },
  { x: 400, y: 460 },
  { x: 395, y: 380 },
  { x: 390, y: 300 },
  { x: 395, y: 220 },
  { x: 400, y: 140 },
  { x: 400, y:  60 },
]

const ALT_ROUTE = [
  { x: 400, y: 540 },
  { x: 400, y: 460 },
  { x: 395, y: 380 },
  { x: 360, y: 320 },  // diverge left around obstacle
  { x: 340, y: 260 },
  { x: 360, y: 200 },
  { x: 390, y: 140 },
  { x: 400, y:  60 },
]

// ── Utilities ─────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) }
function randomBetween(a, b) { return a + Math.random() * (b - a) }
function randomInt(a, b) { return Math.floor(randomBetween(a, b + 1)) }

// ── SimEngine class ───────────────────────────────────────────────────────────
class SimEngine {
  constructor() {
    this._raf    = null
    this._lastTs = null
    this._tick   = 0
    this._nextObjId = 1
    this._pathProgress = 0    // 0–1 along current route
    this._currentRoute = BASE_ROUTE
    this._usingAltRoute = false
    this._ttcHistory = []
    this._fpsCounter = { frames: 0, last: 0, fps: 30 }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  start(scenario = null, demoMode = false) {
    const store = useSimStore.getState()
    store.startSimulation(scenario, demoMode)
    this._pathProgress = 0
    this._currentRoute = BASE_ROUTE
    this._usingAltRoute = false
    this._ttcHistory = []
    this._tick = 0
    this._nextObjId = 1

    // Seed some ambient traffic
    this._seedAmbientTraffic(scenario)

    // Set initial path
    store.updatePlannerState({
      currentPath: [...BASE_ROUTE],
      alternativePath: [...ALT_ROUTE],
      riskZones: [],
    })

    this._lastTs = null
    this._raf = requestAnimationFrame((ts) => this._loop(ts))
    return this
  }

  pause() {
    useSimStore.getState().pauseSimulation()
  }

  resume() {
    useSimStore.getState().resumeSimulation()
    this._lastTs = null
    this._raf = requestAnimationFrame((ts) => this._loop(ts))
  }

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null }
    useSimStore.getState().stopSimulation()
  }

  // ── Main loop ───────────────────────────────────────────────────────────────
  _loop(ts) {
    const store = useSimStore.getState()
    if (store.simulationState.status !== SIMULATION_STATUS.RUNNING) {
      this._raf = null
      return
    }

    if (this._lastTs === null) this._lastTs = ts
    const dt = Math.min((ts - this._lastTs) / 1000, 0.05) // cap at 50ms
    this._lastTs = ts
    this._tick++

    // FPS counter
    this._fpsCounter.frames++
    if (ts - this._fpsCounter.last > 1000) {
      this._fpsCounter.fps = this._fpsCounter.frames
      this._fpsCounter.frames = 0
      this._fpsCounter.last = ts
    }

    this._update(dt, store)

    this._raf = requestAnimationFrame((ts) => this._loop(ts))
  }

  _update(dt, store) {
    const { simulationState, vehicleState, objectState, plannerState, riskState } = store

    // ── 1. Move ego vehicle along route
    const targetSpeed = 38 // km/h target
    const newSpeed = lerp(vehicleState.speed, plannerState.isReplanning ? 22 : targetSpeed, dt * 1.2)
    const speedMs = newSpeed / 3.6

    this._pathProgress = Math.min(1, this._pathProgress + speedMs * dt / this._routeLength())
    const pos = this._posAlongRoute(this._pathProgress)
    const nextPos = this._posAlongRoute(Math.min(1, this._pathProgress + 0.01))
    const heading = Math.atan2(pos.x - nextPos.x, nextPos.y - pos.y) / DEG

    const distTravelled = simulationState.distanceTravelled + speedMs * dt
    const destDist = Math.max(0, vehicleState.destinationDist - speedMs * dt)
    const throttle = plannerState.isReplanning ? 20 : clamp((targetSpeed - vehicleState.speed) * 2, 0, 100)
    const brake = plannerState.isReplanning ? 40 : 0
    const steering = clamp(heading * 0.4, -35, 35)

    store.updateVehicleState({
      x: pos.x, y: pos.y, heading,
      speed: newSpeed, throttle, brake, steering,
      destinationDist: destDist,
    })

    // ── 2. Move detected objects
    const updatedObjects = objectState.map((obj) => {
      let nx = obj.x + obj.vx * dt
      let ny = obj.y + obj.vy * dt

      // Bounce objects that leave the viewport
      let nvx = obj.vx
      let nvy = obj.vy
      if (nx < 200 || nx > 600) { nvx = -nvx; nx = clamp(nx, 200, 600) }
      if (ny < 50  || ny > 580) { nvy = -nvy; ny = clamp(ny, 50, 580) }

      // Age objects — remove after 15s
      const age = (obj.age || 0) + dt
      return age > 15
        ? null
        : { ...obj, x: nx, y: ny, vx: nvx, vy: nvy, age,
            distance: parseFloat(dist({ x: nx, y: ny }, { x: vehicleState.x, y: vehicleState.y }) * 0.15).toFixed(1) }
    }).filter(Boolean)

    store.setObjects(updatedObjects)

    // ── 3. Periodically spawn ambient objects
    if (this._tick % 300 === 0) {
      this._spawnAmbientObject()
    }

    // ── 4. Compute risk
    const riskScore = this._computeRisk(vehicleState, updatedObjects)
    const lvl = getRiskLevel(riskScore)
    const ttc = this._computeTTC(vehicleState, updatedObjects)

    if (ttc !== null) this._ttcHistory.push(ttc)
    if (this._ttcHistory.length > 200) this._ttcHistory.shift()

    const primaryThreat = this._findPrimaryThreat(vehicleState, updatedObjects)

    store.updateRiskState({
      score: parseFloat(riskScore.toFixed(1)),
      level: lvl.label,
      ttc: ttc !== null ? parseFloat(ttc.toFixed(1)) : null,
      primaryThreat,
      contributors: this._computeContributors(vehicleState, updatedObjects),
    })

    // ── 5. Auto replan if risk becomes HIGH and not already replanning
    if (riskScore > 65 && !plannerState.isReplanning && !this._usingAltRoute) {
      this._triggerReplan(store)
    }

    // ── 6. Restore main route once safe
    if (riskScore < 30 && this._usingAltRoute) {
      this._usingAltRoute = false
      this._currentRoute = BASE_ROUTE
      store.updatePlannerState({ currentPath: [...BASE_ROUTE] })
    }

    // ── 7. Check completion
    if (this._pathProgress >= 0.98) {
      store.completeSimulation()
      store.addEvent({ type: 'complete', message: 'Destination reached', severity: 'info' })
    }

    // ── 8. Update simulation metrics
    const avgTTC = this._ttcHistory.length > 0
      ? this._ttcHistory.reduce((a, b) => a + b, 0) / this._ttcHistory.length
      : null

    store.updateSimulationState({
      tick: this._tick,
      timeElapsed: parseFloat((simulationState.timeElapsed + dt).toFixed(1)),
      distanceTravelled: parseFloat(distTravelled.toFixed(1)),
      avgTTC: avgTTC !== null ? parseFloat(avgTTC.toFixed(1)) : null,
      perceptionFPS: this._fpsCounter.fps,
    })
  }

  // ── Risk computation ─────────────────────────────────────────────────────────
  _computeRisk(vehicle, objects) {
    if (objects.length === 0) return randomBetween(8, 16)

    let maxRisk = 10
    for (const obj of objects) {
      const d = dist({ x: obj.x, y: obj.y }, { x: vehicle.x, y: vehicle.y })
      const proximity = Math.max(0, 1 - d / 200)
      const relVel = Math.sqrt((obj.vx - 0) ** 2 + (obj.vy - (-vehicle.speed / 3.6)) ** 2)
      const velFactor = Math.min(1, relVel / 30)
      const risk = (proximity * 55 + velFactor * 35) * obj.confidence
      if (risk > maxRisk) maxRisk = risk
    }
    return clamp(maxRisk + randomBetween(-2, 2), 5, 95)
  }

  _computeTTC(vehicle, objects) {
    let minTTC = null
    for (const obj of objects) {
      const d = dist({ x: obj.x, y: obj.y }, { x: vehicle.x, y: vehicle.y })
      const relSpd = Math.abs(obj.vy - (-vehicle.speed / 3.6)) + 0.01
      const ttc = (d * 0.15) / relSpd
      if (ttc < 5 && (minTTC === null || ttc < minTTC)) minTTC = ttc
    }
    return minTTC
  }

  _findPrimaryThreat(vehicle, objects) {
    let closest = null, minD = Infinity
    for (const obj of objects) {
      const d = dist({ x: obj.x, y: obj.y }, { x: vehicle.x, y: vehicle.y })
      if (d < minD) { minD = d; closest = obj }
    }
    return closest ? closest.id : null
  }

  _computeContributors(vehicle, objects) {
    if (objects.length === 0) return {
      obstacleProximity: 0.08, relativeVelocity: 0.06,
      trajectoryIntersect: 0.05, trafficDensity: 0.04, roadHazard: 0.03,
    }
    const nearest = objects.reduce((acc, o) =>
      dist({ x: o.x, y: o.y }, { x: vehicle.x, y: vehicle.y }) <
      dist({ x: acc.x, y: acc.y }, { x: vehicle.x, y: vehicle.y }) ? o : acc, objects[0])
    const d = dist({ x: nearest.x, y: nearest.y }, { x: vehicle.x, y: vehicle.y })
    const proximity = clamp(1 - d / 200, 0, 1)
    return {
      obstacleProximity:   parseFloat((proximity * 0.9).toFixed(2)),
      relativeVelocity:    parseFloat((proximity * 0.75).toFixed(2)),
      trajectoryIntersect: parseFloat((proximity * 0.95).toFixed(2)),
      trafficDensity:      parseFloat((objects.length / 10).toFixed(2)),
      roadHazard:          parseFloat((proximity * 0.4).toFixed(2)),
    }
  }

  // ── Replanning ──────────────────────────────────────────────────────────────
  _triggerReplan(store) {
    this._usingAltRoute = true
    store.updatePlannerState({ isReplanning: true, lastReplanReason: 'Risk threshold exceeded' })
    store.addEvent({ type: 'replan', message: 'Replanning — risk threshold exceeded', severity: 'warn' })

    const rz = [{ x: 400, y: 310, r: 60, intensity: 0.6 }]
    store.updatePlannerState({ riskZones: rz })

    setTimeout(() => {
      store.updatePlannerState({
        isReplanning: false,
        currentPath: [...ALT_ROUTE],
        riskZones: [],
        replanCount: store.plannerState.replanCount + 1,
        planningLatencyMs: randomInt(40, 120),
      })
      store.updateSimulationState({ replans: store.simulationState.replans + 1 })
      this._currentRoute = ALT_ROUTE
      this._pathProgress = Math.max(0, this._pathProgress - 0.05)
      store.addEvent({ type: 'replan_done', message: 'Trajectory replanned', severity: 'success' })
    }, 1200)
  }

  // ── Object seeding ───────────────────────────────────────────────────────────
  _seedAmbientTraffic(scenario) {
    const spawns = scenario === 'dense_market' ? 4 : 2
    for (let i = 0; i < spawns; i++) {
      this._spawnAmbientObject()
    }
  }

  _spawnAmbientObject() {
    const store = useSimStore.getState()
    if (store.objectState.length >= 8) return // cap objects

    const types = [OBJECT_TYPES.VEHICLE, OBJECT_TYPES.MOTORCYCLE, OBJECT_TYPES.PEDESTRIAN]
    const labels = { VEHICLE: 'CAR', MOTORCYCLE: 'BIKE', PEDESTRIAN: 'PERSON' }
    const type = types[randomInt(0, 2)]

    const side = Math.random() > 0.5 ? 1 : -1
    const obj = {
      id: `obj-${this._nextObjId++}`,
      type,
      label: labels[type],
      x: randomBetween(280, 520),
      y: randomBetween(100, 480),
      vx: randomBetween(-8, 8) * side,
      vy: randomBetween(-15, -5),
      heading: randomBetween(330, 390) % 360,
      confidence: parseFloat(randomBetween(0.78, 0.98).toFixed(2)),
      distance: parseFloat(randomBetween(15, 60).toFixed(1)),
      age: 0,
    }
    store.addObject(obj)
  }

  // ── Route helpers ────────────────────────────────────────────────────────────
  _routeLength() {
    let total = 0
    for (let i = 1; i < this._currentRoute.length; i++) {
      total += dist(this._currentRoute[i - 1], this._currentRoute[i])
    }
    return total || 1
  }

  _posAlongRoute(t) {
    const route = this._currentRoute
    const total = this._routeLength()
    let target = t * total
    for (let i = 1; i < route.length; i++) {
      const segLen = dist(route[i - 1], route[i])
      if (target <= segLen) {
        const s = target / segLen
        return { x: lerp(route[i - 1].x, route[i].x, s), y: lerp(route[i - 1].y, route[i].y, s) }
      }
      target -= segLen
    }
    return route[route.length - 1]
  }
}

// Singleton instance
export const simEngine = new SimEngine()
