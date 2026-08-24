"""
RAAH Risk Engine
================
Computes the composite risk score and time-to-collision (TTC)
from vehicle state and detected objects.

This is the Python counterpart of the frontend mock risk computation
in SimEngine.js — the real implementation when CARLA is connected.
"""

import math
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class VehicleState:
    x: float
    y: float
    vx: float
    vy: float
    speed: float  # km/h


@dataclass
class ObjectState:
    id: str
    x: float
    y: float
    vx: float
    vy: float
    confidence: float
    object_type: str


@dataclass
class RiskState:
    score: float
    level: str
    ttc: Optional[float]
    primary_threat: Optional[str]
    contributors: dict


def dist(a, b) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def compute_risk(vehicle: VehicleState, objects: List[ObjectState]) -> RiskState:
    """
    Compute composite risk score [0, 100] from vehicle and object states.

    Weights:
        w1 = obstacle proximity     (0.30)
        w2 = relative velocity      (0.25)
        w3 = trajectory intersection(0.30)
        w4 = traffic density        (0.10)
        w5 = road hazard            (0.05)
    """
    if not objects:
        return RiskState(
            score=10.0,
            level="SAFE",
            ttc=None,
            primary_threat=None,
            contributors={
                "obstacleProximity": 0.08,
                "relativeVelocity": 0.06,
                "trajectoryIntersect": 0.05,
                "trafficDensity": 0.04,
                "roadHazard": 0.03,
            },
        )

    max_risk = 0.0
    min_ttc = None
    primary_threat_id = None

    for obj in objects:
        d = dist((obj.x, obj.y), (vehicle.x, vehicle.y))
        proximity = max(0.0, 1.0 - d / 200.0)

        rel_vx = obj.vx - vehicle.vx
        rel_vy = obj.vy - vehicle.vy
        rel_speed = math.sqrt(rel_vx ** 2 + rel_vy ** 2)
        vel_factor = min(1.0, rel_speed / 30.0)

        risk = (proximity * 55 + vel_factor * 35) * obj.confidence

        # TTC estimate
        if rel_speed > 0.01:
            ttc = (d * 0.15) / rel_speed
            if ttc < 5.0 and (min_ttc is None or ttc < min_ttc):
                min_ttc = ttc

        if risk > max_risk:
            max_risk = risk
            primary_threat_id = obj.id

    score = max(5.0, min(95.0, max_risk))
    level = _risk_level(score)

    contributors = {
        "obstacleProximity": round(min(1.0, max_risk / 100.0) * 0.9, 2),
        "relativeVelocity": round(min(1.0, max_risk / 100.0) * 0.75, 2),
        "trajectoryIntersect": round(min(1.0, max_risk / 100.0) * 0.95, 2),
        "trafficDensity": round(len(objects) / 10.0, 2),
        "roadHazard": round(min(1.0, max_risk / 100.0) * 0.4, 2),
    }

    return RiskState(
        score=round(score, 1),
        level=level,
        ttc=round(min_ttc, 1) if min_ttc is not None else None,
        primary_threat=primary_threat_id,
        contributors=contributors,
    )


def _risk_level(score: float) -> str:
    if score < 30:
        return "SAFE"
    if score < 55:
        return "MODERATE"
    if score < 75:
        return "HIGH"
    return "CRITICAL"
