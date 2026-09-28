"""Spring-discharge recession analysis and recharge-impairment flag.

Maillet (1905) exponential recession:  Q(t) = Q0 * exp(-alpha * t)
Impairment: after removing the effect of rainfall, does dry-season baseflow trend downward?
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import stats


@dataclass
class Recession:
    q0: float
    alpha_per_day: float
    r2: float
    n: int

    @property
    def half_life_days(self) -> float:
        return float(np.log(2) / self.alpha_per_day) if self.alpha_per_day > 0 else float("inf")


def extract_recession_segments(q, min_len: int = 5, tol: float = 0.0) -> list[np.ndarray]:
    """Index arrays of runs where discharge is non-increasing (daily data), NaNs break runs."""
    q = np.asarray(q, dtype=float)
    segs, cur = [], []
    for i in range(len(q)):
        if np.isnan(q[i]) or q[i] <= 0:
            cur = _flush(cur, segs, min_len)
            continue
        if cur and q[i] > q[cur[-1]] * (1 + tol):
            cur = _flush(cur, segs, min_len)
        cur.append(i)
    _flush(cur, segs, min_len)
    return segs


def _flush(cur, segs, min_len):
    if len(cur) >= min_len:
        segs.append(np.array(cur))
    return []


def fit_maillet(t_days, q) -> Recession:
    t = np.asarray(t_days, dtype=float)
    q = np.asarray(q, dtype=float)
    m = (q > 0) & ~np.isnan(q)
    if m.sum() < 3:
        raise ValueError("need >= 3 positive points")
    res = stats.linregress(t[m], np.log(q[m]))
    return Recession(q0=float(np.exp(res.intercept)), alpha_per_day=float(-res.slope),
                     r2=float(res.rvalue ** 2), n=int(m.sum()))


def master_recession_alpha(q) -> Recession:
    """Fit alpha on the slowest-decaying (baseflow-dominated) segment: median alpha of all segments,
    weighted toward the longest ones. Returns the pooled log-linear fit over all segments with
    segment-specific intercepts removed."""
    q = np.asarray(q, dtype=float)
    segs = extract_recession_segments(q)
    if not segs:
        raise ValueError("no recession segments found")
    xs, ys = [], []
    for s in segs:
        t = np.arange(len(s), dtype=float)
        y = np.log(q[s])
        xs.append(t - t.mean())
        ys.append(y - y.mean())
    x, y = np.concatenate(xs), np.concatenate(ys)
    slope = float((x * y).sum() / (x * x).sum())
    ss_res = float(((y - slope * x) ** 2).sum())
    ss_tot = float((y ** 2).sum())
    return Recession(q0=float(np.nanmax(q)), alpha_per_day=-slope,
                     r2=1 - ss_res / ss_tot if ss_tot > 0 else 1.0, n=len(x))


@dataclass
class ImpairmentResult:
    impaired: bool
    n_years: int
    tau: float | None
    p_value: float | None
    detail: str


def flag_recharge_impairment(years, annual_rain_mm, dry_season_min_q, alpha: float = 0.10,
                             min_years: int = 6) -> ImpairmentResult:
    """True impairment = declining dry-season baseflow that rainfall does NOT explain.

    1. Regress dry-season baseflow on annual rainfall (OLS).
    2. Mann-Kendall-style test (Kendall tau vs year) on the residuals.
    Impaired if tau < 0 and p < alpha.
    """
    y = np.asarray(years, dtype=float)
    p = np.asarray(annual_rain_mm, dtype=float)
    q = np.asarray(dry_season_min_q, dtype=float)
    m = ~(np.isnan(y) | np.isnan(p) | np.isnan(q))
    y, p, q = y[m], p[m], q[m]
    if len(y) < min_years:
        return ImpairmentResult(False, len(y), None, None,
                                f"Insufficient record ({len(y)} < {min_years} years); cannot assess.")
    slope, intercept, *_ = stats.linregress(p, q)
    resid = q - (intercept + slope * p)
    tau, pv = stats.kendalltau(y, resid)
    impaired = bool(tau < 0 and pv < alpha)
    return ImpairmentResult(impaired, len(y), float(tau), float(pv),
                            "Baseflow declining beyond rainfall variability." if impaired
                            else "No rainfall-independent decline detected.")
