"""Green-Ampt infiltration.

Units: lengths in cm, time in hours (the units of the Rawls et al. 1983 table),
unless a function says otherwise.

    f*  = Ks * (1 + psi * d_theta / F)            potential infiltration rate
    F - psi*d_theta*ln(1 + F / (psi*d_theta)) = Ks * t      (ponded, cumulative)
"""
from __future__ import annotations

import math
from dataclasses import dataclass

# Rawls, Brakensiek & Miller (1983) - USDA texture classes, as tabulated in
# Chow, Maidment & Mays (1988) "Applied Hydrology" Table 4.3.1.
#   ks_cm_h : saturated hydraulic conductivity (cm/h)
#   psi_cm  : wetting-front suction head (cm)
#   porosity, eff_porosity : total and effective porosity (-)
USDA_SOIL_TABLE: dict[str, dict[str, float]] = {
    "sand":            {"ks_cm_h": 21.00, "psi_cm": 4.95,  "porosity": 0.437, "eff_porosity": 0.417},
    "loamy sand":      {"ks_cm_h": 6.11,  "psi_cm": 6.13,  "porosity": 0.437, "eff_porosity": 0.401},
    "sandy loam":      {"ks_cm_h": 2.59,  "psi_cm": 11.01, "porosity": 0.453, "eff_porosity": 0.412},
    "loam":            {"ks_cm_h": 1.32,  "psi_cm": 8.89,  "porosity": 0.463, "eff_porosity": 0.434},
    "silt loam":       {"ks_cm_h": 0.68,  "psi_cm": 16.68, "porosity": 0.501, "eff_porosity": 0.486},
    "sandy clay loam": {"ks_cm_h": 0.43,  "psi_cm": 21.85, "porosity": 0.398, "eff_porosity": 0.330},
    "clay loam":       {"ks_cm_h": 0.23,  "psi_cm": 20.88, "porosity": 0.464, "eff_porosity": 0.309},
    "silty clay loam": {"ks_cm_h": 0.15,  "psi_cm": 27.30, "porosity": 0.471, "eff_porosity": 0.432},
    "sandy clay":      {"ks_cm_h": 0.12,  "psi_cm": 23.90, "porosity": 0.430, "eff_porosity": 0.321},
    "silty clay":      {"ks_cm_h": 0.09,  "psi_cm": 29.22, "porosity": 0.479, "eff_porosity": 0.423},
    "clay":            {"ks_cm_h": 0.06,  "psi_cm": 31.63, "porosity": 0.475, "eff_porosity": 0.385},
}

# Hard-rock (weathered/fractured) media. PLACEHOLDER VALUES - indicative only.
# Storage (as theta_e) and Ks for weathered hard rock must be replaced with the
# CGWB / GEC-2015 tabulated values for the district in question. Kept in a separate
# table so they can never be silently mistaken for USDA values.
HARD_ROCK_TABLE_PLACEHOLDER: dict[str, dict[str, float]] = {
    "weathered granite/gneiss": {"ks_cm_h": 0.50, "psi_cm": 15.0, "porosity": 0.05, "eff_porosity": 0.03},
    "weathered basalt":         {"ks_cm_h": 0.40, "psi_cm": 15.0, "porosity": 0.05, "eff_porosity": 0.025},
    "fractured quartzite":      {"ks_cm_h": 0.30, "psi_cm": 10.0, "porosity": 0.03, "eff_porosity": 0.015},
}


@dataclass(frozen=True)
class SoilParams:
    ks_cm_h: float
    psi_cm: float
    d_theta: float  # available moisture deficit (-)

    def __post_init__(self):
        if self.ks_cm_h <= 0 or self.psi_cm <= 0:
            raise ValueError("ks_cm_h and psi_cm must be > 0")
        if not (0 < self.d_theta <= 1):
            raise ValueError("d_theta must be in (0, 1]")


def soil_params(texture: str, initial_saturation: float = 0.3, *, hard_rock: bool = False) -> SoilParams:
    """Look up Green-Ampt parameters. d_theta = (1 - Se) * theta_e."""
    if not 0.0 <= initial_saturation < 1.0:
        raise ValueError("initial_saturation must be in [0, 1)")
    table = HARD_ROCK_TABLE_PLACEHOLDER if hard_rock else USDA_SOIL_TABLE
    key = texture.strip().lower()
    if key not in table:
        raise KeyError(f"Unknown texture {texture!r}. Options: {sorted(table)}")
    row = table[key]
    return SoilParams(row["ks_cm_h"], row["psi_cm"], (1.0 - initial_saturation) * row["eff_porosity"])


def infiltration_rate(F_cm: float, p: SoilParams) -> float:
    """Potential infiltration rate f* (cm/h) at cumulative depth F (cm).

    As F -> 0 the rate is unbounded, so a small floor is applied to F.
    """
    F = max(F_cm, 1e-6)
    return p.ks_cm_h * (1.0 + p.psi_cm * p.d_theta / F)


def cumulative_infiltration(t_h: float, p: SoilParams, tol: float = 1e-10, max_iter: int = 100) -> float:
    """Cumulative infiltration F(t) (cm) under continuous ponding.

    Solves F - S ln(1+F/S) = Ks t (S = psi*d_theta) by Newton iteration.
    """
    if t_h < 0:
        raise ValueError("t_h must be >= 0")
    if t_h == 0:
        return 0.0
    S = p.psi_cm * p.d_theta
    Kt = p.ks_cm_h * t_h
    F = max(Kt, math.sqrt(2.0 * Kt * S))  # start from the larger of the short/long-time limits
    for _ in range(max_iter):
        g = F - S * math.log1p(F / S) - Kt
        dg = F / (S + F)
        F_new = F - g / dg
        if F_new <= 0:
            F_new = F / 2
        if abs(F_new - F) < tol * max(1.0, F):
            return F_new
        F = F_new
    return F


def infiltration_over_event(rain_intensity_cm_h: float, duration_h: float, p: SoilParams,
                            dt_h: float = 1 / 60) -> dict[str, float]:
    """Time-stepped Green-Ampt under constant rainfall intensity (handles time-to-ponding).

    Returns infiltration and runoff depth (cm) over the event.
    """
    if rain_intensity_cm_h < 0 or duration_h < 0:
        raise ValueError("rain intensity and duration must be >= 0")
    S = p.psi_cm * p.d_theta
    F = 0.0
    t = 0.0
    ponded = False
    t_pond = None
    while t < duration_h - 1e-12:
        dt = min(dt_h, duration_h - t)
        rain = rain_intensity_cm_h * dt
        if not ponded:
            f_cap = infiltration_rate(F, p)
            if rain_intensity_cm_h <= f_cap:
                F += rain
            else:
                ponded = True
                t_pond = t
                F += min(rain, f_cap * dt)
        else:
            F = min(F + p.ks_cm_h * dt * (1.0 + S / max(F, 1e-6)), F + rain)
        t += dt
    total_rain = rain_intensity_cm_h * duration_h
    return {"infiltration_cm": F, "runoff_cm": max(total_rain - F, 0.0),
            "time_to_ponding_h": t_pond if t_pond is not None else float("inf")}
