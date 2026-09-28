"""Spring / groundwater-emergence potential model: XGBoost + spatial CV + SHAP.

WHAT THE MODEL PREDICTS. It is trained on known spring locations (positives) vs pseudo-absences, so its output is a
*relative spring-occurrence suitability score*, not a calibrated probability (the class prior is set by how many
pseudo-absences are drawn) and not a recharge rate. Recharge zones for a spring are then taken as high-suitability,
high-infiltration cells *inside the spring's catchment* (see `delineate_zones`).

LEAKAGE CONTROL. Neighbouring pixels are near-duplicates (Tobler). Validation therefore uses
  (1) GroupKFold over square geographic blocks, and
  (2) an optional exclusion buffer: training points closer than `buffer_px` to any test point are dropped.
Random pixel splits are provided only via `random_cv` so the size of the leakage can be measured, never for reporting.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import xgboost as xgb
from scipy import ndimage
from scipy.spatial import cKDTree
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import GroupKFold, KFold

FEATURES = ["elevation", "slope_deg", "curvature", "twi", "log_flowacc",
            "lineament_density", "lithology_score", "soil_ks", "rainfall_mm"]

# feature -> (text when the feature pushes the score UP, text when it pushes it DOWN)
REASON_TEMPLATES: dict[str, tuple[str, str]] = {
    "elevation": ("elevation band is typical of known springs in this area", "elevation is outside the band where springs occur"),
    "slope_deg": ("gentle-to-moderate slope favours infiltration and emergence", "slope is too steep (fast runoff) or too flat for emergence"),
    "curvature": ("concave terrain concentrates flow", "convex terrain sheds water"),
    "twi": ("high topographic wetness: water accumulates and lingers", "low topographic wetness: water drains away quickly"),
    "log_flowacc": ("large upslope contributing area feeds this location", "small upslope contributing area"),
    "lineament_density": ("dense fractures/lineaments provide flow paths", "few fractures/lineaments to carry groundwater"),
    "lithology_score": ("lithology is favourable for storage and transmission", "lithology is poorly permeable"),
    "soil_ks": ("permeable soil allows infiltration", "low-permeability soil restricts infiltration"),
    "rainfall_mm": ("relatively high rainfall supplies recharge", "relatively low rainfall limits recharge"),
}

DEFAULT_PARAMS = dict(n_estimators=300, max_depth=4, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8,
                      min_child_weight=3, reg_lambda=5.0, objective="binary:logistic", eval_metric="logloss",
                      tree_method="hist", n_jobs=1, random_state=0)


# ----------------------------------------------------------------------------- sampling
def sample_pseudo_absences(candidate_mask: np.ndarray, presence_rc: np.ndarray, n: int, min_dist_px: float,
                           rng: np.random.Generator, exclude_mask: np.ndarray | None = None) -> np.ndarray:
    """Draw `n` (row, col) pseudo-absences from valid cells at least `min_dist_px` from every known spring.

    `exclude_mask` (optional) removes further cells, e.g. very high AHP-potential cells, to lower the chance that a
    pseudo-absence is an undiscovered spring.
    """
    ok = candidate_mask.copy()
    if exclude_mask is not None:
        ok &= ~exclude_mask
    dist = ndimage.distance_transform_edt(~_rasterise(presence_rc, ok.shape))
    ok &= dist >= min_dist_px
    idx = np.flatnonzero(ok.ravel())
    if idx.size < n:
        raise ValueError(f"only {idx.size} eligible cells for {n} pseudo-absences; relax min_dist_px/exclude_mask")
    pick = rng.choice(idx, size=n, replace=False)
    return np.column_stack(np.unravel_index(pick, ok.shape))


def _rasterise(rc: np.ndarray, shape) -> np.ndarray:
    m = np.zeros(shape, bool)
    m[rc[:, 0], rc[:, 1]] = True
    return m


@dataclass
class TrainingTable:
    X: np.ndarray
    y: np.ndarray
    rc: np.ndarray        # (n, 2) row/col
    groups: np.ndarray    # block id per row
    features: list[str]


def build_training_table(stack: np.ndarray, presence_rc: np.ndarray, absence_rc: np.ndarray,
                         block_px: int, features: list[str] = FEATURES) -> TrainingTable:
    """stack: (H, W, F) raster stack. Blocks are block_px x block_px squares (choose >= spatial autocorrelation range)."""
    if stack.shape[2] != len(features):
        raise ValueError("stack depth != number of features")
    rc = np.vstack([presence_rc, absence_rc]).astype(int)
    y = np.r_[np.ones(len(presence_rc)), np.zeros(len(absence_rc))].astype(int)
    X = stack[rc[:, 0], rc[:, 1], :]
    ok = ~np.isnan(X).any(axis=1)
    if not ok.all():
        X, y, rc = X[ok], y[ok], rc[ok]
    nb_cols = int(np.ceil(stack.shape[1] / block_px))
    groups = (rc[:, 0] // block_px) * nb_cols + (rc[:, 1] // block_px)
    return TrainingTable(X, y, rc, groups, list(features))


# ----------------------------------------------------------------------------- validation
@dataclass
class CVResult:
    scheme: str
    auc: list[float]
    ap: list[float]
    folds_skipped: int
    n_dropped_by_buffer: int

    @property
    def auc_mean(self) -> float: return float(np.mean(self.auc)) if self.auc else float("nan")
    @property
    def ap_mean(self) -> float: return float(np.mean(self.ap)) if self.ap else float("nan")
    def summary(self) -> dict:
        return {"scheme": self.scheme, "auc_mean": self.auc_mean, "auc_folds": self.auc, "ap_mean": self.ap_mean,
                "folds_skipped": self.folds_skipped, "train_points_dropped_by_buffer": self.n_dropped_by_buffer}


def _spw(y): return float((y == 0).sum() / max((y == 1).sum(), 1))


def spatial_cv(t: TrainingTable, n_splits: int = 5, buffer_px: float = 0.0, params: dict | None = None) -> CVResult:
    """Block-grouped CV with optional buffer between train and test points."""
    params = {**DEFAULT_PARAMS, **(params or {})}
    n_groups = len(np.unique(t.groups))
    if n_groups < n_splits:
        raise ValueError(f"only {n_groups} spatial blocks for {n_splits} folds; use a smaller block_px")
    auc, ap, skipped, dropped = [], [], 0, 0
    for tr, te in GroupKFold(n_splits=n_splits).split(t.X, t.y, t.groups):
        if buffer_px > 0:
            d, _ = cKDTree(t.rc[te]).query(t.rc[tr])
            keep = d >= buffer_px
            dropped += int((~keep).sum())
            tr = tr[keep]
        if len(np.unique(t.y[te])) < 2 or len(np.unique(t.y[tr])) < 2:
            skipped += 1
            continue
        m = xgb.XGBClassifier(**params, scale_pos_weight=_spw(t.y[tr])).fit(t.X[tr], t.y[tr])
        p = m.predict_proba(t.X[te])[:, 1]
        auc.append(float(roc_auc_score(t.y[te], p)))
        ap.append(float(average_precision_score(t.y[te], p)))
    return CVResult("spatial_block" + (f"+buffer{buffer_px:g}px" if buffer_px else ""), auc, ap, skipped, dropped)


def random_cv(t: TrainingTable, n_splits: int = 5, params: dict | None = None, seed: int = 0) -> CVResult:
    """LEAKY random-pixel CV - diagnostic only, to quantify how much it inflates skill."""
    params = {**DEFAULT_PARAMS, **(params or {})}
    auc, ap = [], []
    for tr, te in KFold(n_splits, shuffle=True, random_state=seed).split(t.X):
        m = xgb.XGBClassifier(**params, scale_pos_weight=_spw(t.y[tr])).fit(t.X[tr], t.y[tr])
        p = m.predict_proba(t.X[te])[:, 1]
        auc.append(float(roc_auc_score(t.y[te], p))); ap.append(float(average_precision_score(t.y[te], p)))
    return CVResult("random_pixel(LEAKY - do not report)", auc, ap, 0, 0)


# ----------------------------------------------------------------------------- model
@dataclass
class SpringModel:
    booster: xgb.XGBClassifier
    features: list[str]
    metadata: dict = field(default_factory=dict)

    @classmethod
    def fit(cls, t: TrainingTable, params: dict | None = None, cv: CVResult | None = None) -> "SpringModel":
        params = {**DEFAULT_PARAMS, **(params or {})}
        m = xgb.XGBClassifier(**params, scale_pos_weight=_spw(t.y)).fit(t.X, t.y)
        meta = {"n_positive": int((t.y == 1).sum()), "n_negative": int((t.y == 0).sum()),
                "params": params, "cv": cv.summary() if cv else None,
                "score_semantics": "relative spring-occurrence suitability (uncalibrated; class prior set by pseudo-absence ratio)"}
        return cls(m, list(t.features), meta)

    def predict_raster(self, stack: np.ndarray, chunk: int = 200_000) -> np.ndarray:
        H, W, F = stack.shape
        flat = stack.reshape(-1, F)
        out = np.full(flat.shape[0], np.nan)
        ok = ~np.isnan(flat).any(axis=1)
        idx = np.flatnonzero(ok)
        for i in range(0, idx.size, chunk):
            s = idx[i:i + chunk]
            out[s] = self.booster.predict_proba(flat[s])[:, 1]
        return out.reshape(H, W)

    # ---- explainability
    def explain(self, X: np.ndarray, top_k: int = 3) -> tuple[np.ndarray, list[list[str]]]:
        """SHAP contributions (log-odds) per row and plain-language reasons, ranked by |contribution|."""
        import shap
        expl = shap.TreeExplainer(self.booster)
        sv = np.asarray(expl.shap_values(X))
        if sv.ndim == 3:            # some shap versions return (n, F, classes)
            sv = sv[..., -1]
        return sv, [self._reasons(sv[i], X[i], top_k) for i in range(len(X))]

    def _reasons(self, sv_row: np.ndarray, x_row: np.ndarray, top_k: int) -> list[str]:
        out = []
        for j in np.argsort(-np.abs(sv_row))[:top_k]:
            f = self.features[j]
            pos, neg = REASON_TEMPLATES.get(f, (f"{f} raises the score", f"{f} lowers the score"))
            out.append(f"{pos if sv_row[j] > 0 else neg} ({f} = {x_row[j]:.3g}, {sv_row[j]:+.2f} log-odds)")
        return out

    # ---- persistence
    def save(self, directory: str | Path) -> None:
        d = Path(directory); d.mkdir(parents=True, exist_ok=True)
        self.booster.save_model(d / "model.json")
        (d / "meta.json").write_text(json.dumps({"features": self.features, **self.metadata}, indent=2, default=float))

    @classmethod
    def load(cls, directory: str | Path) -> "SpringModel":
        d = Path(directory)
        meta = json.loads((d / "meta.json").read_text())
        b = xgb.XGBClassifier(); b.load_model(d / "model.json")
        return cls(b, meta.pop("features"), meta)


# ----------------------------------------------------------------------------- zones
def delineate_zones(score: np.ndarray, catchment_mask: np.ndarray, model: SpringModel, stack: np.ndarray,
                    percentile: float = 90.0, min_cells: int = 5, max_shap_cells: int = 20_000,
                    seed: int = 0) -> tuple[np.ndarray, list[dict]]:
    """High-score connected regions inside a springshed, each with SHAP-derived plain-language reasons.

    Returns (label raster, zone records). Threshold = `percentile` of scores within the catchment (rank-based
    because scores are uncalibrated). SHAP is computed for every zone cell (subsampled above `max_shap_cells`).
    """
    inside = catchment_mask & ~np.isnan(score)
    if not inside.any():
        raise ValueError("empty catchment / no scored cells")
    thr = np.percentile(score[inside], percentile)
    labels, n = ndimage.label(inside & (score >= thr), structure=np.ones((3, 3)))
    rng = np.random.default_rng(seed)
    zones = []
    for k in range(1, n + 1):
        cells = np.argwhere(labels == k)
        if len(cells) < min_cells:
            labels[labels == k] = 0
            continue
        sample = cells if len(cells) <= max_shap_cells else cells[rng.choice(len(cells), max_shap_cells, replace=False)]
        X = stack[sample[:, 0], sample[:, 1], :]
        sv, _ = model.explain(X, top_k=1)
        mean_sv, mean_x = sv.mean(axis=0), X.mean(axis=0)
        zones.append({"zone_id": k, "n_cells": int(len(cells)), "mean_score": float(score[labels == k].mean()),
                      "reasons": model._reasons(mean_sv, mean_x, top_k=3),
                      "mean_shap": {f: float(v) for f, v in zip(model.features, mean_sv)}})
    return labels, zones
