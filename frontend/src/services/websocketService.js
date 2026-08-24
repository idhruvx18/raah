/**
 * RAAH WebSocket Service
 * ======================
 * Backend-ready WebSocket client that connects to the FastAPI backend.
 * When the backend is running, call connect() instead of starting the mock engine.
 *
 * Message handling dispatches the same Zustand store actions as the mock engine,
 * so the UI is completely agnostic of whether data comes from the mock or the real backend.
 *
 * Usage:
 *   import { wsService } from './websocketService'
 *   wsService.connect('ws://localhost:8000/ws/simulation')
 *   wsService.send({ type: 'control', action: 'start', scenario: 'dense_market' })
 *   wsService.disconnect()
 */

import { useSimStore } from '../store/simulationStore'

class WebSocketService {
  constructor() {
    this._ws = null
    this._url = null
    this._reconnectTimer = null
    this._reconnectAttempts = 0
    this._maxReconnects = 5
  }

  connect(url = 'ws://localhost:8000/ws/simulation') {
    this._url = url
    this._open()
  }

  _open() {
    if (this._ws?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(this._url)
    this._ws = ws

    ws.onopen = () => {
      this._reconnectAttempts = 0
      console.info('[RAAH WS] Connected to backend')
      useSimStore.getState().addEvent({
        type: 'info',
        message: 'Backend connection established',
        severity: 'success',
      })
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        this._dispatch(msg)
      } catch (e) {
        console.error('[RAAH WS] Failed to parse message', e)
      }
    }

    ws.onerror = (err) => {
      console.error('[RAAH WS] Error', err)
    }

    ws.onclose = () => {
      console.warn('[RAAH WS] Connection closed')
      this._scheduleReconnect()
    }
  }

  _dispatch(msg) {
    const store = useSimStore.getState()

    switch (msg.type) {
      case 'state_update':
        if (msg.vehicle)    store.updateVehicleState(msg.vehicle)
        if (msg.objects)    store.setObjects(msg.objects)
        if (msg.risk)       store.updateRiskState(msg.risk)
        if (msg.planner)    store.updatePlannerState(msg.planner)
        if (msg.simulation) store.updateSimulationState(msg.simulation)
        break

      case 'event':
        store.addEvent(msg)
        break

      case 'decision':
        store.addDecision(msg)
        break

      default:
        break
    }
  }

  send(payload) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(payload))
    }
  }

  injectEvent(eventType) {
    this.send({ type: 'inject_event', event: eventType })
  }

  control(action, scenario = null) {
    this.send({ type: 'control', action, scenario })
  }

  disconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
    this._ws?.close()
    this._ws = null
  }

  _scheduleReconnect() {
    if (this._reconnectAttempts >= this._maxReconnects) {
      console.warn('[RAAH WS] Max reconnection attempts reached')
      return
    }
    this._reconnectAttempts++
    const delay = Math.min(1000 * 2 ** this._reconnectAttempts, 30000)
    console.info(`[RAAH WS] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`)
    this._reconnectTimer = setTimeout(() => this._open(), delay)
  }

  get isConnected() {
    return this._ws?.readyState === WebSocket.OPEN
  }
}

export const wsService = new WebSocketService()
