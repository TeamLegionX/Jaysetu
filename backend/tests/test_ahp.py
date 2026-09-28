import numpy as np
import pytest
from models.ahp import (ahp_from_matrix, saaty_matrix_from_weights, brief_baseline_weights, weighted_overlay,
                        BRIEF_WEIGHTS_PCT, InconsistentJudgementsError, minmax_scale, AHPResult)


def test_perfectly_consistent_matrix_has_cr_zero():
    w = np.array([0.5, 0.3, 0.2])
    A = w[:, None] / w[None, :]
    r = ahp_from_matrix(A, ["a", "b", "c"])
    assert r.cr == pytest.approx(0, abs=1e-9) and np.allclose(r.weights, w)


def test_saaty_textbook_example():
    # Saaty's classic 3x3 example: known CR ~= 0.033
    A = np.array([[1, 3, 5], [1 / 3, 1, 3], [1 / 5, 1 / 3, 1]])
    r = ahp_from_matrix(A, list("abc"))
    assert r.lambda_max == pytest.approx(3.0385, abs=1e-3) and r.cr == pytest.approx(0.0332, abs=2e-3)


def test_inconsistent_matrix_blocks_overlay():
    A = np.array([[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]])   # cyclic preference
    r = ahp_from_matrix(A, list("abc"))
    assert r.cr > 0.10 and not r.consistent
    layers = {k: np.random.rand(3, 3) for k in "abc"}
    with pytest.raises(InconsistentJudgementsError):
        weighted_overlay(layers, r)


def test_non_reciprocal_rejected():
    with pytest.raises(ValueError):
        ahp_from_matrix([[1, 2], [2, 1]], ["a", "b"])


def test_brief_weights_pass_gate_and_are_normalised():
    r = brief_baseline_weights()
    assert r.cr < 0.10 and r.weights.sum() == pytest.approx(1.0)
    tot = sum(BRIEF_WEIGHTS_PCT.values())
    assert r.as_dict()["aquifer"] == pytest.approx(17.61 / tot)
    assert tot == pytest.approx(69.82)   # documents the brief's under-100 % sum


def test_overlay_bounds_and_mask():
    r = brief_baseline_weights()
    rng = np.random.default_rng(0)
    layers = {k: rng.random((10, 10)) for k in r.criteria}
    mask = np.ones((10, 10), bool); mask[0, 0] = False
    out = weighted_overlay(layers, r, mask)
    assert np.isnan(out[0, 0]) and np.nanmin(out) >= 0 and np.nanmax(out) <= 1


def test_overlay_all_ones_gives_one():
    r = brief_baseline_weights()
    out = weighted_overlay({k: np.ones((2, 2)) for k in r.criteria}, r)
    assert np.allclose(out, 1.0)


def test_overlay_rejects_unscaled_and_missing():
    r = brief_baseline_weights()
    ok = {k: np.ones((2, 2)) for k in r.criteria}
    bad = dict(ok, slope=np.full((2, 2), 5.0))
    with pytest.raises(ValueError):
        weighted_overlay(bad, r)
    with pytest.raises(KeyError):
        weighted_overlay({k: v for k, v in ok.items() if k != "soil"}, r)


def test_minmax():
    a = np.array([1.0, 2.0, 3.0])
    assert list(minmax_scale(a)) == [0, 0.5, 1] and list(minmax_scale(a, invert=True)) == [1, 0.5, 0]
