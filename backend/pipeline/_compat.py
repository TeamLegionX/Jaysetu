"""Compatibility shims for third-party packages.

pysheds 0.5 calls `np.in1d`, which was removed in NumPy 2.4 (`np.isin` is the drop-in replacement).
Remove this once pysheds ships a release without `in1d`.
"""
import numpy as np

if not hasattr(np, "in1d"):
    np.in1d = np.isin  # type: ignore[attr-defined]
