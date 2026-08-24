/**
 * RAAH Demo Sequence
 * Orchestrates the cinematic 16-step demo walkthrough.
 */

import { simEngine } from './SimEngine'
import { useSimStore, OBJECT_TYPES } from '../store/simulationStore'

const STEPS = [
  { t: 0,    label: 'Vehicle starting',                action: null },
  { t: 1500, label: 'Dense market scenario loaded',    action: 'load_scenario' },
  { t: 3000, label: 'Vehicle in motion',               action: null },
  { t: 5000, label: 'Motorcycle detected',             action: 'spawn_motorcycle' },
  { t: 6500, label: 'Motorcycle entering trajectory',  action: 'motorcycle_approaching' },
  { t: 7500, label: 'RAAH detecting threat',           action: 'detect_threat' },
  { t: 8500, label: 'TTC decreasing',                  action: 'ttc_decrease' },
  { t: 9000, label: 'Risk score rising',               action: 'risk_rise' },
  { t: 9500, label: 'Current path unsafe',             action: 'path_unsafe' },
  { t: 10000, label: 'New path generated',             action: 'new_path' },
  { t: 11500, label: 'Vehicle changing trajectory',    action: 'vehicle_replan' },
  { t: 13000, label: 'Motorcycle avoided',             action: 'motorcycle_clear' },
  { t: 14500, label: 'Pedestrian detected',            action: 'spawn_pedestrian' },
  { t: 16000, label: 'RAAH reacting again',            action: 'pedestrian_replan' },
  { t: 18000, label: 'Simulation complete',            action: 'complete' },
  { t: 19000, label: 'Results ready',                  action: 'show_results' },
]

class DemoSequence {
  constructor() {
    this._timers = []
    this._bikeId = 'demo-bike-001'
    this._pedId  = 'demo-ped-001'
    this._onComplete = null
  }

  start(onComplete = null) {
    this._onComplete = onComplete
    simEngine.start('dense_market', true)

    STEPS.forEach(({ t, label, action }) => {
      const timer = setTimeout(() => this._runStep(label, action), t)
      this._timers.push(timer)
    })
  }

  stop() {
    this._timers.forEach(clearTimeout)
    this._timers = []
    simEngine.stop()
  }

  _runStep(label, action) {
    const store = useSimStore.getState()
    store.updateSimulationState({ demoStep: STEPS.findIndex((s) => s.action === action) + 1 })
    store.addEvent({ type: 'demo', message: label, severity: 'info' })

    switch (action) {
      case 'load_scenario':
        store.addEvent({ type: 'scenario', message: 'Scenario: Dense Market Environment', severity: 'info' })
        break

      case 'spawn_motorcycle':
        store.addObject({
          id: this._bikeId,
          type: OBJECT_TYPES.MOTORCYCLE,
          label: 'BIKE',
          x: 480, y: 380,
          vx: -14, vy: -12,
          heading: 220,
          confidence: 0.94,
          distance: 32.4,
          age: 0,
        })
        break

      case 'motorcycle_approaching':
        store.updateObject(this._bikeId, { x: 450, y: 330, distance: 22.1 })
        store.updateRiskState({ score: 45, level: 'MODERATE', ttc: 3.2 })
        break

      case 'detect_threat':
        store.updateRiskState({ score: 60, level: 'HIGH', primaryThreat: this._bikeId, ttc: 2.4 })
        break

      case 'ttc_decrease':
        store.updateRiskState({ ttc: 1.8 })
        break

      case 'risk_rise':
        store.updateRiskState({ score: 74, level: 'HIGH', ttc: 1.4 })
        break

      case 'path_unsafe':
        store.updatePlannerState({
          isReplanning: true,
          riskZones: [{ x: 400, y: 280, r: 70, intensity: 0.7 }],
        })
        store.addDecision({
          reason: `Motorcycle #${this._bikeId} entered the predicted vehicle trajectory.`,
          ttcBefore: 3.2, ttcAfter: 1.4,
          probBefore: 0.35, probAfter: 0.84,
          decision: 'Current trajectory rejected',
          response: 'Speed reduced · Alternative trajectory generated',
          objectId: this._bikeId,
        })
        break

      case 'new_path':
        store.updatePlannerState({
          planningLatencyMs: 67,
          replanCount: 1,
        })
        break

      case 'vehicle_replan':
        store.updatePlannerState({
          isReplanning: false,
          riskZones: [],
          lastReplanReason: 'Motorcycle trajectory intersection',
        })
        store.updateSimulationState({ replans: 1 })
        store.addEvent({ type: 'replan_done', message: 'Trajectory replanned — motorcycle avoided', severity: 'success' })
        break

      case 'motorcycle_clear':
        store.updateObject(this._bikeId, { x: 300, y: 180, confidence: 0.91 })
        store.updateRiskState({ score: 18, level: 'SAFE', ttc: null, primaryThreat: null })
        break

      case 'spawn_pedestrian':
        store.addObject({
          id: this._pedId,
          type: OBJECT_TYPES.PEDESTRIAN,
          label: 'PERSON',
          x: 350, y: 260,
          vx: 10, vy: 0,
          heading: 90,
          confidence: 0.87,
          distance: 18.3,
          age: 0,
        })
        store.updateRiskState({ score: 52, level: 'MODERATE', ttc: 2.8, primaryThreat: this._pedId })
        break

      case 'pedestrian_replan':
        store.updateRiskState({ score: 68, level: 'HIGH', ttc: 1.6 })
        store.updatePlannerState({ isReplanning: true })
        store.addDecision({
          reason: 'Pedestrian crossing predicted trajectory.',
          ttcBefore: 2.8, ttcAfter: 1.6,
          probBefore: 0.42, probAfter: 0.76,
          decision: 'Current trajectory rejected',
          response: 'Vehicle decelerated · Safe path selected',
          objectId: this._pedId,
        })
        setTimeout(() => {
          store.updatePlannerState({ isReplanning: false })
          store.updateRiskState({ score: 20, level: 'SAFE', ttc: null })
          store.addEvent({ type: 'replan_done', message: 'Trajectory adjusted — pedestrian avoided', severity: 'success' })
        }, 1400)
        break

      case 'complete':
        store.completeSimulation()
        store.updateSimulationState({ nearMisses: 2, collisions: 0 })
        if (this._onComplete) this._onComplete()
        break

      case 'show_results':
        break

      default:
        break
    }
  }
}

export const demoSequence = new DemoSequence()
