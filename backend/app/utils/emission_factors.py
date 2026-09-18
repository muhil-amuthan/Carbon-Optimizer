"""Utility to access and validate emission factors."""

import json
import os
from typing import Dict, Optional
from app.config import settings


def load_emission_factors() -> Dict:
    """Load emission factors from the data directory."""
    path = os.path.join(settings.data_dir, "emission_factors.json")
    with open(path, "r") as f:
        return json.load(f)


def get_factor(category: str, subcategory: str) -> Optional[float]:
    """Get a specific emission factor value."""
    factors = load_emission_factors()
    cat = factors.get(category, {})
    return cat.get(subcategory)


def get_scope_mapping() -> Dict:
    """Get the mapping of categories to emission scopes."""
    factors = load_emission_factors()
    return factors.get("scope_mapping", {})