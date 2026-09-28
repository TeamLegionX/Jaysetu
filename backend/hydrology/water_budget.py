"""Deterministic daily bucket model + the brief's annual water-yield identity.

Bucket (per unit area, mm):
    S_t = S_{t-1} + P_t - Q_t - ET_t - R_t         0 <= S <= Smax
    Q_t : saturation-excess runoff plus an infiltration-excess share `runoff_frac * P`
    ET_t: PET * min(1, S / (theta_stress * Smax))
    R_t : drainage above field capacity (fraction `perc_frac` per day of S above `s_fc`)

Trench uplift adds a second small store: runoff from the treated area is captured up to
trench capacity (and what the trench can drain that day), and the captured water becomes recharge.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class BucketParams:
    s_max_mm: float = 120.0     # root-zone / soil storage capacity
    s_fc_frac: float = 0.6      # field capacity as fraction of s_max
    perc_frac: float = 0.25     # fraction of water above FC drained per day
    runoff_frac: float = 0.10   # infiltration-excess runoff share of rain
    stress_frac: float = 0.5    # ET is unstressed above stress_frac * s_max
    s0_frac: float = 0.3


def annual_water_yield_m3(rainfall_mm: float, recharge_area_m2: float, infiltration_coeff: float,
                          discharge_m3: float, et_m3: float) -> float:
    """The brief's identity: (P x A x C) - (discharge + ET). Negative => deficit."""
    if not 0 <= infiltration_coeff <= 1:
        raise ValueError("infiltration_coeff must be in [0, 1]")
    return rainfall_mm / 1000.0 * recharge_area_m2 * infiltration_coeff - (discharge_m3 + et_m3)


def simulate_bucket(rain_mm, pet_mm, params: BucketParams = BucketParams()) -> dict[str, np.ndarray]:
    rain = np.asarray(rain_mm, dtype=float)
    pet = np.asarray(pet_mm, dtype=float)
    if rain.shape != pet.shape:
        raise ValueError("rain and pet must have the same shape")
    if np.isnan(rain).any() or np.isnan(pet).any():
        raise ValueError("NaNs in forcing - gap-fill or mask before simulating")
    n = rain.size
    S = params.s0_frac * params.s_max_mm
    s_fc = params.s_fc_frac * params.s_max_mm
    out = {k: np.zeros(n) for k in ("runoff", "et", "recharge", "storage")}
    for t in range(n):
        q_ie = params.runoff_frac * rain[t]
        S += rain[t] - q_ie
        q_se = max(S - params.s_max_mm, 0.0)
        S -= q_se
        stress = min(1.0, S / (params.stress_frac * params.s_max_mm))
        et = min(pet[t] * stress, S)
        S -= et
        rch = params.perc_frac * max(S - s_fc, 0.0)
        S -= rch
        out["runoff"][t] = q_ie + q_se
        out["et"][t] = et
        out["recharge"][t] = rch
        out["storage"][t] = S
    return out


def trench_uplift(runoff_mm, treated_area_m2: float, trench_capacity_m3: float,
                  trench_drain_m3_per_day: float) -> dict[str, np.ndarray | float]:
    """Extra recharge from trenches capturing runoff generated on the treated area.

    Mass balance is explicit: captured + bypass = runoff volume, every day.
    """
    runoff = np.asarray(runoff_mm, dtype=float)
    if treated_area_m2 <= 0 or trench_capacity_m3 < 0 or trench_drain_m3_per_day < 0:
        raise ValueError("treated area must be > 0; capacity and drain rate >= 0")
    stored = 0.0
    captured = np.zeros_like(runoff)
    bypass = np.zeros_like(runoff)
    infiltrated = np.zeros_like(runoff)
    for t, r in enumerate(runoff):
        inflow = r / 1000.0 * treated_area_m2
        drain = min(stored, trench_drain_m3_per_day)
        stored -= drain
        infiltrated[t] = drain
        room = trench_capacity_m3 - stored
        take = min(inflow, max(room, 0.0))
        stored += take
        captured[t] = take
        bypass[t] = inflow - take
    infiltrated[-1] += stored  # water left at end of series infiltrates after the record ends
    return {"captured_m3": captured, "bypass_m3": bypass, "infiltrated_m3": infiltrated,
            "annual_increase_m3": float(infiltrated.sum())}
