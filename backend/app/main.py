"""
RAAH Backend — FastAPI entry point
===================================
This is the scaffold for the Python autonomy backend.
It provides a WebSocket endpoint that will stream simulation state
to the RAAH frontend.

Current state: scaffold with mock WebSocket echo.
Future state:  real CARLA-driven autonomy pipeline.

Architecture:
    CARLA API
        ↓
    perception.py   (YOLO + ByteTrack)
        ↓
    risk_engine.py  (TTC + collision probability)
        ↓
    planner.py      (Hybrid A*)
        ↓
    controller.py   (Stanley / MPC)
        ↓
    WebSocket → RAAH Frontend
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import time
import math

app = FastAPI(
    title="RAAH Backend",
    description="Risk-Aware Adaptive Autonomous Navigation — Python backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST endpoints ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "RAAH Backend",
        "version": "1.0.0",
        "status": "online",
        "problem_statement": "SIH26037",
    }

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/api/scenarios")
async def list_scenarios():
    """Return available simulation scenarios."""
    return {
        "scenarios": [
            {"id": "village_road",   "title": "Unmarked Village Road",      "difficulty": 4},
            {"id": "intersection",   "title": "Unsignalized Intersection",  "difficulty": 5},
            {"id": "highway_merge",  "title": "Highway Merge",              "difficulty": 4},
            {"id": "dense_market",   "title": "Dense Market Area",          "difficulty": 5},
            {"id": "cattle_crossing","title": "Cattle Crossing",            "difficulty": 3},
        ]
    }

# ── WebSocket simulation stream ─────────────────────────────────────────────────

@app.websocket("/ws/simulation")
async def simulation_ws(websocket: WebSocket):
    """
    WebSocket endpoint for real-time simulation state.

    Message format (server → client):
    {
        "type": "state_update",
        "vehicle": { x, y, heading, speed, throttle, brake, steering, destinationDist },
        "objects": [ { id, type, label, x, y, vx, vy, confidence, distance } ],
        "risk": { score, level, ttc, primaryThreat, contributors },
        "planner": { currentPath, alternativePath, riskZones, isReplanning },
        "simulation": { status, tick, timeElapsed, distanceTravelled, replans }
    }

    Message format (client → server):
    {
        "type": "inject_event",
        "event": "motorcycle_cutin" | "pedestrian" | "animal" | "roadblock" | "vehicle_merge"
    }
    OR
    {
        "type": "control",
        "action": "start" | "pause" | "stop",
        "scenario": "dense_market"
    }
    """
    await websocket.accept()
    tick = 0

    try:
        while True:
            # Read any incoming commands (non-blocking)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.033)
                msg = json.loads(data)
                # TODO: handle "inject_event" and "control" messages from CARLA pipeline
            except asyncio.TimeoutError:
                pass

            # TODO: Replace this mock state with real CARLA + pipeline state
            tick += 1
            t = tick * 0.033
            mock_state = {
                "type": "state_update",
                "vehicle": {
                    "x": 400 + math.sin(t * 0.1) * 20,
                    "y": 500 - (t * 8) % 460,
                    "heading": math.sin(t * 0.1) * 10,
                    "speed": 35 + math.sin(t * 0.3) * 8,
                    "throttle": 42,
                    "brake": 0,
                    "steering": math.sin(t * 0.1) * 8,
                    "destinationDist": max(0, 240 - t * 2),
                },
                "objects": [],
                "risk": {
                    "score": max(5, 15 + math.sin(t * 0.4) * 10),
                    "level": "SAFE",
                    "ttc": None,
                    "primaryThreat": None,
                    "contributors": {
                        "obstacleProximity": 0.08,
                        "relativeVelocity": 0.06,
                        "trajectoryIntersect": 0.05,
                        "trafficDensity": 0.04,
                        "roadHazard": 0.03,
                    },
                },
                "planner": {
                    "isReplanning": False,
                    "replanCount": 0,
                    "planningLatencyMs": 0,
                },
                "simulation": {
                    "status": "RUNNING",
                    "tick": tick,
                    "timeElapsed": round(t, 1),
                },
            }

            await websocket.send_text(json.dumps(mock_state))
            await asyncio.sleep(0.033)  # ~30 Hz

    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
