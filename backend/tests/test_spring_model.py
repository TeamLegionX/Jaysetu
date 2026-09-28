import numpy as np
import pytest
from models.spring_model import (sample_pseudo_absences, build_training_table, spatial_cv, random_cv,
                                 SpringModel, delineate_zones, FEATURES, CVResult)


def _synthetic_stack(H=60, W=60, seed=0):
    """Build a feature stack where a 'true' linear signal in twi+lineament predicts spring occurrence,
    plus pure-noise features, so spatial vs random CV should diverge and the model should learn the signal."""
    rng = np.random.default_rng(seed)
    twi = rng.normal(size=(H, W))
    linfeat = rng.normal(size=(H, W))
    noise = {f: rng.normal(size=(H, W)) for f in FEATURES if f not in ("twi", "lineament_density")}
    stack = np.stack([noise.get(f, twi if f == "twi" else linfeat) for f in FEATURES], axis=-1)
    signal = 1.5 * twi + 1.2 * linfeat
    return stack, signal


def test_pseudo_absence_respects_min_distance_and_mask():
    mask = np.ones((40, 40), bool)
    presence = np.array([[20, 20]])
    rng = np.random.default_rng(0)
    ab = sample_pseudo_absences(mask, presence, n=50, min_dist_px=8, rng=rng)
    d = np.hypot(ab[:, 0] - 20, ab[:, 1] - 20)
    assert (d >= 8).all() and len(ab) == 50


def test_pseudo_absence_raises_when_infeasible():
    mask = np.zeros((10, 10), bool); mask[0, 0] = True
    with pytest.raises(ValueError):
        sample_pseudo_absences(mask, np.array([[5, 5]]), n=5, min_dist_px=1, rng=np.random.default_rng(0))


def test_build_training_table_drops_nan_rows_and_groups():
    stack, signal = _synthetic_stack()
    stack[5, 5, 0] = np.nan
    presence = np.array([[5, 5], [10, 10], [30, 30]])
    absence = np.array([[0, 0], [15, 15], [45, 45]])
    t = build_training_table(stack, presence, absence, block_px=20)
    assert t.X.shape[0] == 5   # one presence row dropped for NaN
    assert set(t.y) == {0, 1}
    assert t.groups.max() < 9  # 60/20=3 -> 3x3=9 blocks


def test_spatial_cv_runs_and_reasonable_auc():
    stack, signal = _synthetic_stack(seed=1)
    rng = np.random.default_rng(1)
    mask = np.ones(stack.shape[:2], bool)
    presence = np.argwhere(signal > np.percentile(signal, 90))[:40]
    absence = sample_pseudo_absences(mask, presence, n=120, min_dist_px=2, rng=rng)
    t = build_training_table(stack, presence, absence, block_px=15)
    cv = spatial_cv(t, n_splits=4)
    assert isinstance(cv, CVResult) and 0.5 < cv.auc_mean <= 1.0


def test_spatial_cv_rejects_too_many_splits():
    stack, signal = _synthetic_stack()
    presence = np.array([[1, 1], [2, 2]])
    absence = np.array([[3, 3], [4, 4]])
    t = build_training_table(stack, presence, absence, block_px=50)  # -> 4 blocks total
    with pytest.raises(ValueError):
        spatial_cv(t, n_splits=10)


def test_buffer_drops_training_points_near_test_blocks():
    stack, signal = _synthetic_stack(seed=2)
    rng = np.random.default_rng(2)
    mask = np.ones(stack.shape[:2], bool)
    presence = np.argwhere(signal > np.percentile(signal, 85))[:60]
    absence = sample_pseudo_absences(mask, presence, n=150, min_dist_px=2, rng=rng)
    t = build_training_table(stack, presence, absence, block_px=10)
    cv0 = spatial_cv(t, n_splits=3, buffer_px=0)
    cv_buf = spatial_cv(t, n_splits=3, buffer_px=15)
    assert cv_buf.n_dropped_by_buffer > 0
    assert cv0.n_dropped_by_buffer == 0


def test_random_cv_is_optimistic_vs_spatial_on_autocorrelated_data():
    """With strongly spatially autocorrelated features, leaky random CV should score at least as well as
    (usually noticeably better than) properly blocked spatial CV, on average."""
    H = W = 50
    rng = np.random.default_rng(3)
    base = rng.normal(size=(H, W))
    from scipy.ndimage import gaussian_filter
    smooth = gaussian_filter(base, sigma=6)     # strong spatial autocorrelation
    stack = np.stack([smooth if f == "twi" else rng.normal(size=(H, W)) for f in FEATURES], axis=-1)
    presence = np.argwhere(smooth > np.percentile(smooth, 85))
    presence = presence[rng.choice(len(presence), 50, replace=False)]
    absence = sample_pseudo_absences(np.ones((H, W), bool), presence, n=150, min_dist_px=1, rng=rng)
    t = build_training_table(stack, presence, absence, block_px=8)
    sp = spatial_cv(t, n_splits=4)
    rd = random_cv(t, n_splits=4)
    assert rd.auc_mean >= sp.auc_mean - 0.05


def test_fit_predict_save_load_roundtrip(tmp_path):
    stack, signal = _synthetic_stack(seed=4)
    rng = np.random.default_rng(4)
    mask = np.ones(stack.shape[:2], bool)
    presence = np.argwhere(signal > np.percentile(signal, 90))[:30]
    absence = sample_pseudo_absences(mask, presence, n=90, min_dist_px=2, rng=rng)
    t = build_training_table(stack, presence, absence, block_px=15)
    model = SpringModel.fit(t)
    raster = model.predict_raster(stack)
    assert raster.shape == stack.shape[:2] and np.nanmin(raster) >= 0 and np.nanmax(raster) <= 1
    model.save(tmp_path / "m")
    loaded = SpringModel.load(tmp_path / "m")
    np.testing.assert_allclose(loaded.predict_raster(stack), raster, atol=1e-5)
    assert loaded.metadata["score_semantics"].startswith("relative")


def test_explain_reasons_reference_top_feature():
    stack, signal = _synthetic_stack(seed=5)
    rng = np.random.default_rng(5)
    mask = np.ones(stack.shape[:2], bool)
    presence = np.argwhere(signal > np.percentile(signal, 90))[:30]
    absence = sample_pseudo_absences(mask, presence, n=90, min_dist_px=2, rng=rng)
    t = build_training_table(stack, presence, absence, block_px=15)
    model = SpringModel.fit(t)
    sv, reasons = model.explain(t.X[:5], top_k=2)
    assert sv.shape == (5, len(FEATURES)) and all(len(r) == 2 for r in reasons)
    assert all(isinstance(x, str) and len(x) > 0 for r in reasons for x in r)


def test_delineate_zones_inside_catchment_with_reasons():
    stack, signal = _synthetic_stack(seed=6)
    rng = np.random.default_rng(6)
    H, W = stack.shape[:2]
    mask = np.ones((H, W), bool)
    presence = np.argwhere(signal > np.percentile(signal, 90))[:30]
    absence = sample_pseudo_absences(mask, presence, n=90, min_dist_px=2, rng=rng)
    t = build_training_table(stack, presence, absence, block_px=15)
    model = SpringModel.fit(t)
    score = model.predict_raster(stack)
    catchment = np.zeros((H, W), bool); catchment[10:40, 10:40] = True
    labels, zones = delineate_zones(score, catchment, model, stack, percentile=80, min_cells=3)
    assert labels.shape == (H, W)
    assert (labels[~catchment] == 0).all()   # no zone outside the catchment
    assert len(zones) > 0
    for z in zones:
        assert z["n_cells"] >= 3 and len(z["reasons"]) == 3


def test_delineate_zones_empty_catchment_raises():
    stack, signal = _synthetic_stack(seed=7)
    score = np.full(stack.shape[:2], np.nan)
    with pytest.raises(ValueError):
        delineate_zones(score, np.zeros(stack.shape[:2], bool), None, stack)
