"""Carbon emission calculator using IPCC/EPA emission factors.

Supports:
- Single-record and batch calculation (Scope 1, 2, 3)
- Real-time grid intensity override for Scope 2
- Renewable energy offset computation
- Emission intensity (per production unit)
- Factor caching and runtime override
- Multi-scenario comparison
"""

from __future__ import annotations

import json
import os
from typing import Dict, List, Optional, Tuple

from app.config import settings


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_factors_from_disk() -> Dict:
    """Load emission factors JSON from the configured data directory."""
    factors_path = os.path.join(settings.data_dir, "emission_factors.json")
    try:
        with open(factors_path, "r") as fh:
            return json.load(fh)
    except FileNotFoundError:
        # Inline fallback mirrors emission_factors.json exactly
        return {
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
            "diesel": {"combustion": 2.68},
            "waste": {"landfill": 0.58, "incineration": 0.91, "recycled": 0.021},
            "water": {"treatment_and_supply": 0.344},
            "transport": {
                "truck_diesel": 0.14,
                "van_diesel": 0.195,
                "rail_freight": 0.028,
            },
            "scope_mapping": {
                "scope1": ["natural_gas", "diesel"],
                "scope2": ["electricity"],
                "scope3": ["waste", "water", "transport"],
            },
        }


# ---------------------------------------------------------------------------
# Main class
# ---------------------------------------------------------------------------

class CarbonCalculator:
    """Calculate carbon emissions from operational data using standard factors.

    Attributes:
        factors: The emission factor dictionary loaded at construction time.
    """

    def __init__(self, factors_override: Optional[Dict] = None) -> None:
        """Create a calculator instance.

        Args:
            factors_override: Supply a custom factor dict to skip disk I/O.
                              Useful for unit tests.
        """
        self.factors: Dict = factors_override if factors_override else _load_factors_from_disk()

    # ------------------------------------------------------------------
    # Core calculation — single record
    # ------------------------------------------------------------------

    def calculate(self, record) -> Dict:
        """Calculate emissions for a single operational data record.

        Args:
            record: An ORM model or any object exposing the fields:
                    natural_gas_m3, diesel_liters, electricity_kwh,
                    waste_kg, water_m3, transport_km, production_units.

        Returns:
            Dictionary with per-scope and total emission values (kgCO2e).
        """
        f = self.factors

        # --- Scope 1: Direct combustion ---
        scope1_gas    = record.natural_gas_m3 * f["natural_gas"]["combustion"]
        scope1_diesel = record.diesel_liters  * f["diesel"]["combustion"]
        scope1_total  = scope1_gas + scope1_diesel

        # --- Scope 2: Purchased electricity (market-based default) ---
        scope2_elec  = record.electricity_kwh * f["electricity"]["grid_default"]
        scope2_total = scope2_elec

        # --- Scope 3: Upstream / downstream indirect ---
        scope3_waste     = record.waste_kg     * f["waste"]["landfill"]
        scope3_water     = record.water_m3     * f["water"]["treatment_and_supply"]
        scope3_transport = record.transport_km * f["transport"]["truck_diesel"]
        scope3_total     = scope3_waste + scope3_water + scope3_transport

        total = scope1_total + scope2_total + scope3_total

        # Emission intensity (kg CO2e per production unit)
        intensity = 0.0
        prod = getattr(record, "production_units", None)
        if prod and prod > 0:
            intensity = total / prod

        return {
            "scope1_natural_gas":  round(scope1_gas,      4),
            "scope1_diesel":       round(scope1_diesel,    4),
            "scope1_total":        round(scope1_total,     4),
            "scope2_electricity":  round(scope2_elec,      4),
            "scope2_total":        round(scope2_total,     4),
            "scope3_waste":        round(scope3_waste,     4),
            "scope3_water":        round(scope3_water,     4),
            "scope3_transport":    round(scope3_transport, 4),
            "scope3_total":        round(scope3_total,     4),
            "total_emissions":     round(total,            4),
            "emission_intensity":  round(intensity,        6),
        }

    def calculate_with_grid_intensity(
        self,
        record,
        grid_intensity: float,
        renewable_offset_pct: float = 0.0,
    ) -> Dict:
        """Calculate emissions using a real-time grid carbon intensity.

        Overrides the default Scope 2 factor with the live grid signal,
        and optionally applies a renewable energy offset.

        Args:
            record: Operational data record.
            grid_intensity: Live carbon intensity in gCO2/kWh.
            renewable_offset_pct: Percentage (0-100) of electricity
                                  sourced from on-site/PPA renewables,
                                  which zeroes out that fraction of Scope 2.

        Returns:
            Updated emission breakdown dict.
        """
        result = self.calculate(record)

        # Convert g/kWh → kg/kWh then apply renewable offset
        ef_live = (grid_intensity / 1000) * (1 - min(renewable_offset_pct, 100) / 100)
        scope2_elec  = record.electricity_kwh * ef_live
        scope2_total = max(0.0, scope2_elec)

        total = result["scope1_total"] + scope2_total + result["scope3_total"]

        intensity = 0.0
        prod = getattr(record, "production_units", None)
        if prod and prod > 0:
            intensity = total / prod

        result.update(
            {
                "scope2_electricity": round(scope2_elec,  4),
                "scope2_total":       round(scope2_total, 4),
                "total_emissions":    round(total,        4),
                "emission_intensity": round(intensity,    6),
            }
        )
        return result

    # ------------------------------------------------------------------
    # Batch calculation
    # ------------------------------------------------------------------

    def batch_calculate(
        self,
        records: List,
        grid_intensity: Optional[float] = None,
        renewable_offset_pct: float = 0.0,
    ) -> List[Dict]:
        """Calculate emissions for a list of operational records.

        Args:
            records: Iterable of operational data objects.
            grid_intensity: Optional live grid intensity (gCO2/kWh).
                            If provided, overrides Scope 2 factor.
            renewable_offset_pct: Renewable offset percentage (0-100).

        Returns:
            List of emission breakdown dicts in the same order as input.
        """
        results = []
        for rec in records:
            if grid_intensity is not None:
                em = self.calculate_with_grid_intensity(
                    rec, grid_intensity, renewable_offset_pct
                )
            else:
                em = self.calculate(rec)
            results.append(em)
        return results

    # ------------------------------------------------------------------
    # Aggregate helpers
    # ------------------------------------------------------------------

    def calculate_scope_totals(self, breakdowns: List[Dict]) -> Dict:
        """Aggregate a list of breakdown dicts into period-level scope totals.

        Args:
            breakdowns: List of dicts returned by ``calculate()``.

        Returns:
            A summary dict with summed scope values and grand total.
        """
        if not breakdowns:
            return {k: 0.0 for k in (
                "scope1_total", "scope2_total", "scope3_total", "total_emissions",
                "avg_emission_intensity",
            )}

        keys = [
            "scope1_natural_gas", "scope1_diesel", "scope1_total",
            "scope2_electricity", "scope2_total",
            "scope3_waste", "scope3_water", "scope3_transport", "scope3_total",
            "total_emissions",
        ]
        agg = {k: round(sum(b.get(k, 0.0) for b in breakdowns), 4) for k in keys}

        # Weighted average intensity (exclude zero-unit records)
        intensities = [
            b["emission_intensity"]
            for b in breakdowns
            if b.get("emission_intensity", 0) > 0
        ]
        agg["avg_emission_intensity"] = round(
            sum(intensities) / len(intensities), 6
        ) if intensities else 0.0

        return agg

    def calculate_renewable_savings(
        self,
        records: List,
        renewable_pct: float,
        grid_intensity_g_kwh: Optional[float] = None,
    ) -> Dict:
        """Estimate Scope 2 savings from switching to renewable energy.

        Args:
            records: List of operational records.
            renewable_pct: Percentage of electricity to source renewably (0-100).
            grid_intensity_g_kwh: Optional live grid intensity (gCO2/kWh).

        Returns:
            Dict with baseline totals, simulated totals, and savings.
        """
        gi = grid_intensity_g_kwh
        baseline  = self.batch_calculate(records, grid_intensity=gi)
        simulated = self.batch_calculate(records, grid_intensity=gi,
                                         renewable_offset_pct=renewable_pct)

        base_totals = self.calculate_scope_totals(baseline)
        sim_totals  = self.calculate_scope_totals(simulated)

        saved     = base_totals["total_emissions"] - sim_totals["total_emissions"]
        saved_pct = (
            saved / base_totals["total_emissions"] * 100
            if base_totals["total_emissions"] else 0.0
        )

        return {
            "baseline_emissions_kg":  base_totals["total_emissions"],
            "simulated_emissions_kg": sim_totals["total_emissions"],
            "savings_kg":             round(saved,     4),
            "savings_pct":            round(saved_pct, 2),
            "renewable_pct_applied":  renewable_pct,
        }

    # ------------------------------------------------------------------
    # Factor access
    # ------------------------------------------------------------------

    def get_factors(self) -> Dict:
        """Return the emission factor dictionary currently in use."""
        return self.factors

    def get_factor(self, category: str, subcategory: str) -> Optional[float]:
        """Retrieve a single numeric factor value.

        Args:
            category:    Top-level key (e.g. ``"electricity"``).
            subcategory: Sub-key (e.g. ``"grid_default"``).

        Returns:
            Float factor or ``None`` if not found.
        """
        return self.factors.get(category, {}).get(subcategory)

    def get_scope_for_category(self, category: str) -> Optional[str]:
        """Return the GHG scope for a given input category.

        Args:
            category: e.g. ``"diesel"``, ``"electricity"``, ``"waste"``.

        Returns:
            ``"scope1"``, ``"scope2"``, ``"scope3"``, or ``None``.
        """
        mapping: Dict = self.factors.get("scope_mapping", {})
        for scope, categories in mapping.items():
            if category in categories:
                return scope
        return None

    def reload_factors(self) -> None:
        """Reload emission factors from disk, discarding cached values."""
        self.factors = _load_factors_from_disk()

    # ------------------------------------------------------------------
    # Comparison utilities
    # ------------------------------------------------------------------

    def compare_scenarios(
        self,
        records: List,
        scenarios: List[Tuple[str, float, float]],
    ) -> List[Dict]:
        """Compare multiple grid/renewable scenarios for the same records.

        Args:
            records: List of operational records.
            scenarios: List of ``(label, grid_intensity_g_kwh, renewable_pct)``
                       tuples.  Use ``grid_intensity=-1`` to indicate 'use
                       default factor'.

        Returns:
            List of scenario result dicts ordered as supplied.
        """
        results = []
        for label, grid_intensity, renewable_pct in scenarios:
            gi = grid_intensity if grid_intensity >= 0 else None
            breakdowns = self.batch_calculate(
                records, grid_intensity=gi, renewable_offset_pct=renewable_pct
            )
            totals = self.calculate_scope_totals(breakdowns)
            results.append(
                {
                    "scenario":             label,
                    "grid_intensity_g_kwh": grid_intensity,
                    "renewable_pct":        renewable_pct,
                    **totals,
                }
            )
        return results