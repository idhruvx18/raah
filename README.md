# RAAH
## Risk-Aware Adaptive Autonomous Navigation

> "The safer way forward."

---

## Problem Statement

**SIH26037** — Adaptive Path Planning and Collision Avoidance for Autonomous Vehicles on Unstructured Indian Roads

**Theme:** Robotics and Drones · **Category:** Software · **Edition:** Smart India Hackathon 2026

---

## Overview

RAAH is a full-stack autonomous driving research platform that implements risk-aware adaptive path planning for unstructured Indian road conditions. The system continuously evaluates whether the current trajectory is safe, quantifies risk from multiple contributing factors, and replans dynamically when a collision threat is detected.

Standard autonomous navigation stacks fail on Indian roads because they assume structured environments — lane markings, predictable traffic, and rule-following behaviour. RAAH is designed from the ground up for the reality of Indian roads: unmarked lanes, mixed traffic, cattle crossings, dense market areas, and human behaviour that cannot be predicted.

---

## Features

- **Live Command Center** — Real-time simulation dashboard with vehicle telemetry, risk display, object detection panel, and event log
- **Mock Simulation Engine** — Complete autonomous vehicle simulation running entirely in the browser, no backend required
- **Five Scenarios** — Unmarked Village Road, Unsignalized Intersection, Highway Merge, Dense Market, Cattle Crossing
- **Scenario Injector** — Inject live events (motorcycle cut-in, pedestrian, animal, roadblock, vehicle merge) during simulation
- **Dynamic Path Replanning** — Watch RAAH detect a threat, compute risk, and smoothly replan the trajectory in real time
- **Explainable AI Panel** — Understand exactly why RAAH replanned: TTC change, collision probability, decision, and response
- **Risk Analysis** — Risk score breakdown by contributing factors with time-series charts
- **Path Planning Visualiser** — Interactive layer toggles: current path, risk map, predicted obstacle trajectories, alternative path
- **AI Perception View** — Simulated camera feed with bounding boxes, confidence scores, and velocity vectors
- **Analytics** — Session metrics, speed charts, replan frequency by scenario, latency analysis
- **Results** — Baseline vs RAAH comparison (clearly labelled as simulated)
- **Technology** — Interactive architecture diagram with clickable components
- **Research** — Real citations to IDD, CARLA, Hybrid A\*, ByteTrack, YOLOv9, and more
- **Demo Mode** — 16-step cinematic demo sequence running automatically

---

## Architecture

```
CARLA Simulator
      ↓
Python Autonomy Backend (FastAPI)
      ↓
WebSocket Connection
      ↓
RAAH Frontend (React + Zustand)
      ↓
Simulation Canvas (Canvas API)
```

**Current state:** The frontend runs a complete mock simulation engine. The architecture is backend-ready — when the FastAPI/CARLA backend is connected, the WebSocket message handler replaces the mock engine tick by dispatching the same Zustand store actions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| State | Zustand (subscribeWithSelector) |
| Charts | Recharts |
| Animation | CSS animations, Canvas API, Framer Motion |
| Icons | Lucide React |
| Backend (planned) | Python, FastAPI, WebSocket |
| Simulation (planned) | CARLA Open-Source Simulator |
| AI Perception (planned) | YOLOv9, OpenCV, PyTorch |
| Tracking (planned) | ByteTrack, Kalman Filter |
| Planning (planned) | Hybrid A\*, local trajectory optimisation |
| Control (planned) | Stanley, Pure Pursuit, MPC |

---

## Project Structure

```
raah/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Nav, Footer, Layout
│   │   │   ├── simulation/   # SimCanvas (Canvas API renderer)
│   │   │   └── ui/           # AnimatedNumber, RiskScale, StatusBadge, Notification
│   │   ├── pages/            # All 11 route pages
│   │   ├── simulation/       # SimEngine, DemoSequence, scenarios
│   │   ├── store/            # Zustand simulationStore (central state)
│   │   └── hooks/            # Custom React hooks
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/                  # Python FastAPI backend (scaffold)
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   └── services/
│   └── requirements.txt
├── docs/
│   └── architecture/
├── .gitignore
├── .env.example
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+ (for backend)

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
cd frontend
npm run build
npm run preview
```

### Running the Backend (scaffold)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API available at [http://localhost:8000](http://localhost:8000)

---

## Running Demo Mode

1. Open the app at `/dashboard`
2. Click **Demo Mode** (the amber button)
3. The 16-step cinematic sequence runs automatically:
   - Vehicle starts in Dense Market scenario
   - Motorcycle appears and enters trajectory
   - RAAH detects threat, risk rises, TTC decreases
   - Path replans smoothly
   - Motorcycle avoided
   - Pedestrian appears, RAAH reacts again
   - Simulation completes
4. Click **View Results** to see the comparison

---

## Simulation Architecture

The mock simulation engine (`src/simulation/SimEngine.js`) drives all state through the Zustand store. It runs at ~60 FPS via `requestAnimationFrame` and simulates:

- Ego vehicle movement along waypoint routes
- Dynamic object spawning and movement
- Real-time risk computation (proximity, relative velocity, trajectory intersection, traffic density, road hazard)
- Time-to-collision (TTC) calculation
- Automatic replanning when risk exceeds threshold
- Event injection (motorcycle, pedestrian, animal, roadblock, vehicle merge)

The canvas renderer (`src/components/simulation/SimCanvas.jsx`) reads directly from the Zustand store and renders at the display frame rate. It is completely decoupled from the engine.

**Backend-ready design:** When the FastAPI/WebSocket backend is connected, replace `simEngine.start()` with a WebSocket connection that dispatches the same store actions from incoming messages.

---

## Future CARLA Integration

```
CARLA Python API
      ↓
sensor_data_pipeline.py   (YOLO + ByteTrack + Kalman)
      ↓
risk_engine.py            (TTC + collision probability)
      ↓
planner.py                (Hybrid A* + costmap)
      ↓
controller.py             (Stanley/MPC)
      ↓
FastAPI WebSocket server
      ↓
ws://localhost:8000/ws/simulation
      ↓
RAAH Frontend store
```

---

## Development Roadmap

- [x] Complete frontend UI with all 11 pages
- [x] Mock simulation engine (vehicle, objects, risk, replanning)
- [x] Demo mode sequence (16-step cinematic)
- [x] Scenario system (5 scenarios + injector)
- [x] Risk engine + analytics + results
- [x] Technology + research pages with real citations
- [ ] Python FastAPI backend
- [ ] WebSocket bridge
- [ ] CARLA integration
- [ ] YOLOv9 perception pipeline
- [ ] ByteTrack MOT integration
- [ ] Hybrid A\* planner implementation
- [ ] Stanley/MPC controller
- [ ] Real experimental results

---

## Team

Built for Smart India Hackathon 2026 by a multidisciplinary team combining expertise in AI, robotics, control systems, and product design.

---

## References

- [India Driving Dataset (IDD)](https://idd.insaan.iiit.ac.in/)
- [CARLA Open-Source Simulator](https://carla.org/)
- [MathWorks Automated Driving Toolbox](https://www.mathworks.com/products/automated-driving.html)
- [Hybrid A\* — Dolgov et al.](https://ai.stanford.edu/~ddolgov/papers/dolgov_gpp_stair08.pdf)
- [ByteTrack — Zhang et al. ECCV 2022](https://arxiv.org/abs/2110.06864)
- [YOLOv9 — Wang et al. 2024](https://arxiv.org/abs/2402.13616)
- [ROS costmap_2d](http://wiki.ros.org/costmap_2d)

---

> All simulation values shown in the application are generated by the mock engine for demonstration purposes.  
> They are not the result of real vehicle deployments or peer-reviewed experiments.
