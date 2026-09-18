"""Utility functions to access, validate, and compare emission factors.

Provides:
- ``load_emission_factors()``    — load (and cache) factors from disk
- ``get_factor()``               — retrieve a single factor value
- ``get_scope_mapping()``        — scope → category mapping
- ``list_categories()``          — list all top-level factor categories
- ``get_all_factors_flat()``     — flat {category.subcategory: value} dict
- ``compare_to_defaults()``      — diff a custom factor set vs. defaults
- ``validate_custom_factors()``  — check structure/type of a factor dict
"""

from __future__ import annotations

import json
import os
from typing import Dict, List, Optional, Tuple

from app.config import settings

# ---------------------------------------------------------------------------
# Internal cache
# ---------------------------------------------------------------------------

_FACTORS_CACHE: Optional[Dict] = None

_DEFAULT_FACTORS: Dict = {
    "electricity": {
        "grid_default": 0.716,
        "solar": 0.041,
        "wind": 0.011,
        "hydro": 0.024,
        "nuclear": 0.012,
        "coal": 0.995,
        "natural_gas_power": 0.410,
    },
    "natural_gas": {"combustion": 2.0},
    "diesel":      {"combustion": 2.68},
    "waste":       {"landfill": 0.58, "incineration": 0.91, "recycled": 0.021},
    "water":       {"treatment_and_supply": 0.344},
    "transport":   {"truck_diesel": 0.14, "van_diesel": 0.195, "rail_freight": 0.028},
    "scope_mapping": {
        "scope1": ["natural_gas", "diesel"],
        "scope2": ["electricity"],
        "scope3": ["waste", "water", "transport"],
    },
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_emission_factors(use_cache: bool = True) -> Dict:
    """Load emission factors from the data directory.

    Args:
        use_cache: If True (default), return cached factors after first load.
                   Pass False to force a fresh read from disk.

    Returns:
        Emission factor dictionary.
    """
    global _FACTORS_CACHE

    if use_cache and _FACTORS_CACHE is not None:
        return _FACTORS_CACHE

    path = os.path.join(settings.data_dir, "emission_factors.json")
    try:
        with open(path, "r") as fh:
            factors = json.load(fh)
    except FileNotFoundError:
        factors = dict(_DEFAULT_FACTORS)

    _FACTORS_CACHE = factors
    return factors


def invalidate_cache() -> None:
    """Clear the in-memory factor cache so the next call re-reads from disk."""
    global _FACTORS_CACHE
    _FACTORS_CACHE = None


def get_factor(category: str, subcategory: str) -> Optional[float]:
    """Get a single numeric emission factor value.

    Args:
        category:    Top-level key (e.g. ``"electricity"``).
        subcategory: Sub-key (e.g. ``"grid_default"``).

    Returns:
        Float factor value, or ``None`` if not found.
    """
    factors = load_emission_factors()
    cat = factors.get(category, {})
    value = cat.get(subcategory)
    return float(value) if isinstance(value, (int, float)) else None


def get_scope_mapping() -> Dict:
    """Return the mapping of GHG scopes to input categories.

    Returns:
        ``{"scope1": [...], "scope2": [...], "scope3": [...]}``
    """
    factors = load_emission_factors()
    return factors.get("scope_mapping", {})


def list_categories() -> List[str]:
    """Return a list of all top-level factor categories (excluding metadata keys).

    Returns:
        Sorted list of category names (e.g. ``["diesel", "electricity", ...]``).
    """
    factors = load_emission_factors()
    excluded = {"scope_mapping", "sources", "metadata"}
    return sorted(k for k in factors if k not in excluded)


def get_all_factors_flat() -> Dict[str, float]:
    """Return a flat ``{category.subcategory: value}`` dict of all numeric factors.

    Useful for building UI dropdowns or performing bulk calculations.

    Returns:
        Flat dict, e.g. ``{"electricity.grid_default": 0.716, ...}``.
    """
    factors = load_emission_factors()
    excluded = {"scope_mapping", "sources", "metadata"}
    flat: Dict[str, float] = {}
    for cat, sub_dict in factors.items():
        if cat in excluded or not isinstance(sub_dict, dict):
            continue
        for sub, val in sub_dict.items():
            if isinstance(val, (int, float)):
                flat[f"{cat}.{sub}"] = float(val)
    return flat


def compare_to_defaults(custom_factors: Dict) -> List[Dict]:
    """Diff a custom factor dictionary against the built-in defaults.

    Args:
        custom_factors: A factor dict in the same structure as the JSON file.

    Returns:
        List of change dicts with keys ``key``, ``default``, ``custom``,
        and ``pct_change``.  Only keys that differ are listed.
    """
    default_flat = _flatten_factors(_DEFAULT_FACTORS)
    custom_flat  = _flatten_factors(custom_factors)

    changes: List[Dict] = []
    all_keys = set(default_flat) | set(custom_flat)

    for key in sorted(all_keys):
        d_val = default_flat.get(key)
        c_val = custom_flat.get(key)

        if d_val == c_val:
            continue

        pct = None
        if d_val is not None and c_val is not None and d_val != 0:
            pct = round((c_val - d_val) / d_val * 100, 2)

        changes.append(
            {
                "key":        key,
                "default":    d_val,
                "custom":     c_val,
                "pct_change": pct,
                "status":     "added" if d_val is None else
                              "removed" if c_val is None else
                              "changed",
            }
        )

    return changes


def validate_custom_factors(custom_factors: Dict) -> Tuple[bool, List[str]]:
    """Validate that a custom factor dict has the required keys and numeric values.

    Checks that all required categories are present and that all sub-values
    that exist are numeric.

    Args:
        custom_factors: Factor dict to validate.

    Returns:
        Tuple of ``(is_valid, error_messages)``.
    """
    required_categories = ["electricity", "natural_gas", "diesel", "waste", "water", "transport"]
    errors: List[str] = []

    if not isinstance(custom_factors, dict):
        return False, ["Top-level must be a dict"]

    for cat in required_categories:
        if cat not in custom_factors:
            errors.append(f"Missing required category: '{cat}'")
            continue
        sub = custom_factors[cat]
        if not isinstance(sub, dict):
            errors.append(f"Category '{cat}' must be a dict, got {type(sub).__name__}")
            continue
        for key, val in sub.items():
            if key in ("unit", "source"):
                continue
            if not isinstance(val, (int, float)):
                errors.append(
                    f"'{cat}.{key}' must be numeric, got {type(val).__name__} ({val!r})"
                )

    return len(errors) == 0, errors


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _flatten_factors(factors: Dict) -> Dict[str, float]:
    """Flatten a factor dict, extracting only numeric leaf values."""
    excluded = {"scope_mapping", "sources", "metadata"}
    flat: Dict[str, float] = {}
    for cat, sub in factors.items():
        if cat in excluded or not isinstance(sub, dict):
            continue
        for key, val in sub.items():
            if isinstance(val, (int, float)):
                flat[f"{cat}.{key}"] = float(val)
    return flat