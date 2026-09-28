"""Analytic Hierarchy Process weighted-overlay baseline for spring / recharge potential.

Gate: the pairwise-comparison matrix must have Consistency Ratio CR < 0.10 (Saaty) before a baseline map is produced.

NOTE ON THE BRIEF'S WEIGHTS: aquifer 17.61 + geology 17.10 + soil 12.09 + drainage 8.55 + geomorphology 8.46
+ slope 6.01 = 69.82 %, not 100 %. They look like a subset of a longer literature list (other themes such as
lineament density, land use, rainfall are missing). `BRIEF_WEIGHTS_PCT` is kept verbatim and is renormalised to
sum to 1 for use; supply the missing themes or accept the renormalisation explicitly.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

RANDOM_INDEX = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
CR_LIMIT = 0.10

BRIEF_WEIGHTS_PCT: dict[str, float] = {
    "aquifer": 17.61, "geology": 17.10, "soil": 12.09,
    "drainage": 8.55, "geomorphology": 8.46, "slope": 6.01,
}


class InconsistentJudgementsError(ValueError):
    """Raised when CR >= 0.10; the baseline must not be generated."""


@dataclass
class AHPResult:
    criteria: list[str]
    weights: np.ndarray
    lambda_max: float
    ci: float
    cr: float

    @property
    def consistent(self) -> bool:
        return self.cr < CR_LIMIT

    def as_dict(self) -> dict[str, float]:
        return dict(zip(self.criteria, map(float, self.weights)))


def ahp_from_matrix(matrix, criteria: list[str]) -> AHPResult:
    """Principal-eigenvector weights and consistency ratio of a reciprocal pairwise matrix."""
    A = np.asarray(matrix, dtype=float)
    n = A.shape[0]
    if A.shape != (n, n) or len(criteria) != n:
        raise ValueError("matrix must be square and match criteria")
    if not np.allclose(A * A.T, 1.0, atol=1e-9):
        raise ValueError("matrix must be reciprocal (a_ij * a_ji = 1)")
    if n > max(RANDOM_INDEX):
        raise ValueError(f"n <= {max(RANDOM_INDEX)} supported")
    vals, vecs = np.linalg.eig(A)
    k = int(np.argmax(vals.real))
    w = np.abs(vecs[:, k].real)
    w = w / w.sum()
    lam = float(vals[k].real)
    ci = (lam - n) / (n - 1) if n > 1 else 0.0
    ri = RANDOM_INDEX[n]
    cr = ci / ri if ri > 0 else 0.0
    return AHPResult(list(criteria), w, lam, float(ci), float(max(cr, 0.0)))


_SAATY = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9], dtype=float)


def _to_saaty(ratio: float) -> float:
    r = max(ratio, 1.0 / ratio)
    v = _SAATY[np.argmin(np.abs(_SAATY - r))]
    return float(v if ratio >= 1 else 1.0 / v)


def saaty_matrix_from_weights(weights: dict[str, float]) -> tuple[np.ndarray, list[str]]:
    """Approximate the pairwise matrix implied by a weight vector, rounded to Saaty's 1-9 scale.

    This is a *reconstruction* used to test whether published weights are consistent to within Saaty's rounding.
    It is NOT the original experts' judgement matrix - replace with the real one when available.
    """
    names = list(weights)
    w = np.array([weights[k] for k in names], dtype=float)
    if (w <= 0).any():
        raise ValueError("weights must be positive")
    n = len(names)
    A = np.ones((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            v = _to_saaty(w[i] / w[j])
            A[i, j], A[j, i] = v, 1.0 / v
    return A, names


def brief_baseline_weights() -> AHPResult:
    """Weights of the brief renormalised to sum to 1, with the CR gate applied.

    The CR comes from a Saaty-scale reconstruction of the pairwise matrix (see `saaty_matrix_from_weights`);
    the *weights used* are the brief's own (renormalised), not the eigenvector of the rounded matrix, because
    rounding to the 1-9 scale distorts them (e.g. slope 8.6 % -> 9.7 %). Raises if CR >= 0.10.
    """
    A, names = saaty_matrix_from_weights(BRIEF_WEIGHTS_PCT)
    check = ahp_from_matrix(A, names)
    if not check.consistent:
        raise InconsistentJudgementsError(f"CR = {check.cr:.3f} >= {CR_LIMIT}")
    w = np.array([BRIEF_WEIGHTS_PCT[k] for k in names], dtype=float)
    return AHPResult(names, w / w.sum(), check.lambda_max, check.ci, check.cr)


def weighted_overlay(layers: dict[str, np.ndarray], result: AHPResult, mask: np.ndarray | None = None) -> np.ndarray:
    """Weighted sum of layers already reclassified to a common 0-1 suitability scale.

    Refuses to run if the judgement matrix was inconsistent (CR >= 0.10).
    """
    if not result.consistent:
        raise InconsistentJudgementsError(f"CR = {result.cr:.3f} >= {CR_LIMIT}; baseline not generated")
    missing = set(result.criteria) - set(layers)
    if missing:
        raise KeyError(f"missing layers: {sorted(missing)}")
    shape = layers[result.criteria[0]].shape
    out = np.zeros(shape, dtype=float)
    for name, w in zip(result.criteria, result.weights):
        lyr = np.asarray(layers[name], dtype=float)
        if lyr.shape != shape:
            raise ValueError(f"layer {name!r} shape mismatch")
        if np.nanmin(lyr) < -1e-9 or np.nanmax(lyr) > 1 + 1e-9:
            raise ValueError(f"layer {name!r} must be scaled to [0, 1]")
        out += w * lyr
    if mask is not None:
        out = np.where(mask, out, np.nan)
    return out


def minmax_scale(a: np.ndarray, invert: bool = False) -> np.ndarray:
    lo, hi = np.nanmin(a), np.nanmax(a)
    s = np.zeros_like(a, dtype=float) if hi == lo else (a - lo) / (hi - lo)
    return 1.0 - s if invert else s
