"""IMD gridded climate ingestion: sentinel cleaning, monthly climatology, anomalies.

IMD gridded binaries use -999.0 as missing rainfall and 99.9 as missing temperature. If these leak into
means they silently corrupt baselines (a single 99.9 in a 30-year monthly mean shifts it by ~3 C).
"""
from __future__ import annotations

import numpy as np
import xarray as xr

RAIN_MISSING = -999.0
TEMP_MISSING = 99.9


def clean_imd(da: xr.DataArray, kind: str) -> xr.DataArray:
    """Replace IMD missing-value flags with NaN. kind in {'rain','tmax','tmin'}."""
    if kind == "rain":
        bad = da <= RAIN_MISSING + 1e-3
        out = da.where(~bad)
        out = out.where(~(out < 0))            # negative rain is never physical
    elif kind in {"tmax", "tmin"}:
        bad = da >= TEMP_MISSING - 1e-3
        out = da.where(~bad)
    else:
        raise ValueError("kind must be 'rain', 'tmax' or 'tmin'")
    out.attrs = {**da.attrs, "cleaned": f"IMD sentinel -> NaN ({kind})"}
    return out


def load_imd(variable: str, start_year: int, end_year: int, cache_dir: str) -> xr.DataArray:
    """Download (via imdlib) and return a cleaned DataArray. Requires network access to imdpune.gov.in.

    variable: 'rain' (0.25 deg), 'tmax' or 'tmin' (1 deg).
    """
    import imdlib as imd  # lazy

    data = imd.get_data(variable, start_year, end_year, fn_format="yearwise", file_dir=cache_dir)
    da = data.get_xarray()
    da = da[list(da.data_vars)[0]] if isinstance(da, xr.Dataset) else da
    return clean_imd(da, variable)


def monthly_totals(rain: xr.DataArray) -> xr.DataArray:
    """Monthly rainfall totals. Months with any missing day become NaN (min_count = days in month)."""
    days = rain.time.dt.days_in_month
    s = rain.resample(time="MS").sum(skipna=True, min_count=1)
    n_valid = rain.notnull().resample(time="MS").sum()
    expected = days.resample(time="MS").first()
    return s.where(n_valid == expected)


def monthly_climatology(monthly: xr.DataArray, base_start: int, base_end: int) -> xr.DataArray:
    base = monthly.sel(time=slice(f"{base_start}-01-01", f"{base_end}-12-31"))
    return base.groupby("time.month").mean("time", skipna=True)


def monthly_anomaly_pct(monthly: xr.DataArray, clim: xr.DataArray) -> xr.DataArray:
    """Percent departure from the monthly normal (NaN where normal is ~0)."""
    normal = clim.sel(month=monthly.time.dt.month)
    with np.errstate(divide="ignore", invalid="ignore"):
        return ((monthly - normal) / normal.where(normal > 1e-6) * 100.0).drop_vars("month", errors="ignore")


def annual_stats(rain: xr.DataArray, year_start_month: int = 6) -> xr.DataArray:
    """Hydrological-year rainfall totals (default June-May, the Indian monsoon year)."""
    shifted = rain.assign_coords(hyear=("time", (rain.time.dt.year - (rain.time.dt.month < year_start_month)).values))
    return shifted.groupby("hyear").sum(skipna=True)
