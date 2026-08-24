/**
 * RAAH — Central Simulation Store
 * Single source of truth for all simulation state.
 * Architecture is backend-ready: when a WebSocket connection from
 * FastAPI/CARLA is available, replace the mock engine by dispatching
 * the same actions from the WebSocket message handler.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ── Constants ────────────────────────────────────────────────────────────────
export const RISK_LEVELS = {
  SAFE:     { label: 'SAFE',     min: 0,  max: 30,  color: '#3D7A5C' },
  MODERATE: { label: 'MODERATE', min: 30, max: 55,  color: '#B8843A' },
  HIGH:     { label: 'HIGH',     min: 55, max: 75,  color: '#A0402D' },
  CRITICAL: { label: 'CRITICAL', min: 75, max: 100, color: '#7A1F10' },
}

export const SIMULATION_STATUS = {
  IDLE:     'IDLE',
  RUNNING:  'RUNNING',
  PAUSED:   'PAUSED',
  REPLANNING: 'REPLANNING',
  COMPLETED: 'COMPLETED',
}

export const OBJECT_TYPES = {
  VEHICLE:    'VEHICLE',
  MOTORCYCLE: 'MOTORCYCLE',
  PEDESTRIAN: 'PEDESTRIAN',
  ANIMAL:     'ANIMAL',
  OBSTACLE:   'OBSTACLE',
}

export function getRiskLevel(score) {
  if (score < 30) return RISK_LEVELS.SAFE
  if (score < 55) return RISK_LEVELS.MODERATE
  if (score < 75) return RISK_LEVELS.HIGH
  return RISK_LEVELS.CRITICAL
}

// ── Initial State ─────────────────────────────────────────────────────────────
const initialVehicleState = {
  id: 'ego',
  x: 400,
  y: 500,
  heading: 0,        // degrees, 0 = up
  speed: 0,          // km/h
  throttle: 0,       // 0–100 %
  brake: 0,          // 0–100 %
  steering: 0,       // degrees
  destinationDist: 240, // metres
}

const initialRiskState = {
  score: 12,
  level: 'SAFE',
  ttc: null,            // time-to-collision seconds
  primaryThreat: null,  // object id
  contributors: {
    obstacleProximity:    0.1,
    relativeVelocity:     0.1,
    trajectoryIntersect:  0.1,
    trafficDensity:       0.1,
    roadHazard:           0.05,
  },
}

const initialPlannerState = {
  currentPath: [],          // [{x,y}]
  alternativePath: [],
  predictedPaths: {},       // objectId -> [{x,y}]
  riskZones: [],            // [{x,y,r,intensity}]
  isReplanning: false,
  lastReplanReason: null,
  replanCount: 0,
  planningLatencyMs: 0,
}

const initialSimulationState = {
  status: SIMULATION_STATUS.IDLE,
  scenario: null,
  tick: 0,
  timeElapsed: 0,       // seconds
  distanceTravelled: 0, // metres
  replans: 0,
  nearMisses: 0,
  collisions: 0,
  avgTTC: null,
  perceptionFPS: 0,
  demoStep: 0,
  isDemoMode: false,
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useSimStore = create(
  subscribeWithSelector((set, get) => ({
    // ── State slices
    vehicleState: { ...initialVehicleState },
    objectState:  [],          // array of detected objects
    riskState:    { ...initialRiskState },
    plannerState: { ...initialPlannerState },
    simulationState: { ...initialSimulationState },
    eventLog:     [],          // [{ id, time, type, message, severity }]
    detectedObjects: [],       // formatted for UI
    decisionLog:  [],          // Explainable AI decisions

    // ── Actions ──────────────────────────────────────────────────────────────

    updateVehicleState: (patch) =>
      set((s) => ({ vehicleState: { ...s.vehicleState, ...patch } })),

    setObjects: (objects) =>
      set({ objectState: objects }),

    addObject: (obj) =>
      set((s) => ({ objectState: [...s.objectState, obj] })),

    removeObject: (id) =>
      set((s) => ({ objectState: s.objectState.filter((o) => o.id !== id) })),

    updateObject: (id, patch) =>
      set((s) => ({
        objectState: s.objectState.map((o) => o.id === id ? { ...o, ...patch } : o),
      })),

    updateRiskState: (patch) =>
      set((s) => ({ riskState: { ...s.riskState, ...patch } })),

    updatePlannerState: (patch) =>
      set((s) => ({ plannerState: { ...s.plannerState, ...patch } })),

    updateSimulationState: (patch) =>
      set((s) => ({ simulationState: { ...s.simulationState, ...patch } })),

    addEvent: (event) =>
      set((s) => ({
        eventLog: [
          { id: Date.now() + Math.random(), time: s.simulationState.timeElapsed, ...event },
          ...s.eventLog.slice(0, 99),
        ],
      })),

    addDecision: (decision) =>
      set((s) => ({
        decisionLog: [
          { id: Date.now(), time: s.simulationState.timeElapsed, ...decision },
          ...s.decisionLog.slice(0, 19),
        ],
      })),

    // ── Simulation control ────────────────────────────────────────────────────

    startSimulation: (scenario = null, demoMode = false) => {
      set({
        vehicleState:    { ...initialVehicleState },
        objectState:     [],
        riskState:       { ...initialRiskState },
        plannerState:    { ...initialPlannerState },
        simulationState: {
          ...initialSimulationState,
          status:   SIMULATION_STATUS.RUNNING,
          scenario,
          isDemoMode: demoMode,
          demoStep: 0,
        },
        eventLog:    [],
        decisionLog: [],
        detectedObjects: [],
      })
    },

    pauseSimulation: () =>
      set((s) => ({
        simulationState: { ...s.simulationState, status: SIMULATION_STATUS.PAUSED },
      })),

    resumeSimulation: () =>
      set((s) => ({
        simulationState: { ...s.simulationState, status: SIMULATION_STATUS.RUNNING },
      })),

    stopSimulation: () =>
      set((s) => ({
        simulationState: { ...s.simulationState, status: SIMULATION_STATUS.IDLE },
      })),

    completeSimulation: () =>
      set((s) => ({
        simulationState: { ...s.simulationState, status: SIMULATION_STATUS.COMPLETED },
      })),

    resetAll: () =>
      set({
        vehicleState:    { ...initialVehicleState },
        objectState:     [],
        riskState:       { ...initialRiskState },
        plannerState:    { ...initialPlannerState },
        simulationState: { ...initialSimulationState },
        eventLog:        [],
        decisionLog:     [],
        detectedObjects: [],
      }),

    // ── Scenario injection ───────────────────────────────────────────────────
    injectEvent: (eventType) => {
      const s = get()
      const { addObject, addEvent, addDecision, updateRiskState, updatePlannerState, simulationState } = s
      if (simulationState.status !== SIMULATION_STATUS.RUNNING) return

      const id = `${eventType}-${Date.now()}`
      const cx = 400, cy = 300

      switch (eventType) {
        case 'motorcycle_cutin': {
          addObject({
            id, type: OBJECT_TYPES.MOTORCYCLE,
            x: cx + 80, y: cy + 100,
            vx: -12, vy: -18,
            heading: 200,
            confidence: 0.93,
            label: 'BIKE',
            distance: 28,
          })
          addEvent({ type: 'injection', message: 'Motorcycle cut-in injected', severity: 'warn' })
          break
        }
        case 'pedestrian': {
          addObject({
            id, type: OBJECT_TYPES.PEDESTRIAN,
            x: cx - 30, y: cy + 60,
            vx: 8, vy: 0,
            heading: 90,
            confidence: 0.88,
            label: 'PERSON',
            distance: 22,
          })
          addEvent({ type: 'injection', message: 'Pedestrian crossing injected', severity: 'warn' })
          break
        }
        case 'animal': {
          addObject({
            id, type: OBJECT_TYPES.ANIMAL,
            x: cx + 40, y: cy + 80,
            vx: 0, vy: -5,
            heading: 0,
            confidence: 0.79,
            label: 'ANIMAL',
            distance: 35,
          })
          addEvent({ type: 'injection', message: 'Animal on road injected', severity: 'warn' })
          break
        }
        case 'roadblock': {
          addObject({
            id, type: OBJECT_TYPES.OBSTACLE,
            x: cx, y: cy + 50,
            vx: 0, vy: 0,
            heading: 0,
            confidence: 0.99,
            label: 'BLOCK',
            distance: 18,
          })
          addEvent({ type: 'injection', message: 'Static roadblock injected', severity: 'danger' })
          break
        }
        case 'vehicle_merge': {
          addObject({
            id, type: OBJECT_TYPES.VEHICLE,
            x: cx - 120, y: cy + 80,
            vx: 20, vy: -8,
            heading: 340,
            confidence: 0.96,
            label: 'CAR',
            distance: 42,
          })
          addEvent({ type: 'injection', message: 'Vehicle merge injected', severity: 'warn' })
          break
        }
        default:
          addEvent({ type: 'injection', message: `${eventType} injected`, severity: 'info' })
      }

      // Trigger risk increase and replan
      updateRiskState({ score: 72, level: 'HIGH', ttc: 1.8 })
      updatePlannerState({ isReplanning: true })
      addDecision({
        reason: 'New obstacle entered predicted trajectory',
        ttcBefore: 3.2, ttcAfter: 1.8,
        probBefore: 0.35, probAfter: 0.84,
        decision: 'Current trajectory rejected',
        response: 'Speed reduced · Alternative trajectory generated',
        objectId: id,
      })

      setTimeout(() => {
        updatePlannerState({ isReplanning: false, replanCount: (get().plannerState.replanCount + 1) })
        updateRiskState({ score: 28, level: 'SAFE', ttc: null })
        addEvent({ type: 'replan', message: 'Trajectory replanned — obstacle avoided', severity: 'info' })
      }, 3000)
    },
  }))
)
