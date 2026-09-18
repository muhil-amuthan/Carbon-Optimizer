"""What-if simulator for emission scenario analysis.

Supports:
- Single scenario simulation (change electricity, gas, diesel, waste, renewables)
- Batch multi-scenario comparison
- One-factor-at-a-time sensitivity analysis
- Monte Carlo uncertainty quantification
"""

from __future__ import annotations

import random
from typing import Dict, List, Optional

from app.schemas.optimize import SimulationRequest, SimulationResult


class Simulator:
    """Simulate the impact of operational changes on emissions."""

    # ------------------------------------------------------------------
    # Core — single scenario
    # ------------------------------------------------------------------

    def simulate(
        self,
        baseline_emission,
        request: SimulationRequest,
    ) -> SimulationResult:
        """Apply percentage changes to baseline emissions and return new totals.

        Args:
            baseline_emission: An EmissionResult ORM object representing
                               the current operational baseline.
            request: SimulationRequest with change percentages per input.

        Returns:
            SimulationResult with before/after breakdown.
        """
        base_s1_gas    = baseline_emission.scope1_natural_gas
        base_s1_diesel = baseline_emission.scope1_diesel
        base_s2_elec   = baseline_emission.scope2_electricity
        base_s3_waste  = baseline_emission.scope3_waste
        base_s3_water  = baseline_emission.scope3_water
        base_s3_trans  = baseline_emission.scope3_transport
        baseline_total = baseline_emission.total_emissions

        # Apply input-level changes
        sim_s1_gas    = base_s1_gas    * (1 + request.gas_change_pct      / 100)
        sim_s1_diesel = base_s1_diesel * (1 + request.diesel_change_pct   / 100)
        sim_s2_elec   = base_s2_elec   * (1 + request.electricity_change_pct / 100)
        sim_s3_waste  = base_s3_waste  * (1 + request.waste_change_pct    / 100)

        # Renewable energy offset (reduces scope 2)
        if request.renewable_energy_pct > 0:
            sim_s2_elec *= (1 - request.renewable_energy_pct / 100)

        # Aggregate
        sim_s1_total = sim_s1_gas + sim_s1_diesel
        sim_s2_total = max(0.0, sim_s2_elec)
        sim_s3_total = sim_s3_waste + base_s3_water + base_s3_trans
        sim_total    = sim_s1_total + sim_s2_total + sim_s3_total

        change_abs = sim_total - baseline_total
        change_pct = (change_abs / baseline_total * 100) if baseline_total else 0.0

        breakdown = {
            "baseline": {
                "scope1": round(baseline_emission.scope1_total, 2),
                "scope2": round(baseline_emission.scope2_total, 2),
                "scope3": round(baseline_emission.scope3_total, 2),
                "total":  round(baseline_total,                 2),
            },
            "simulated": {
                "scope1": round(sim_s1_total, 2),
                "scope2": round(sim_s2_total, 2),
                "scope3": round(sim_s3_total, 2),
                "total":  round(sim_total,    2),
            },
        }

        return SimulationResult(
            factory_id=request.factory_id,
            baseline_emissions=round(baseline_total, 2),
            simulated_emissions=round(sim_total,     2),
            change_pct=round(change_pct,             2),
            change_absolute=round(change_abs,        2),
            breakdown=breakdown,
        )

    # ------------------------------------------------------------------
    # Batch simulation
    # ------------------------------------------------------------------

    def batch_simulate(
        self,
        baseline_emission,
        scenarios: List[Dict],
    ) -> List[Dict]:
        """Run multiple named scenarios against the same baseline.

        Args:
            baseline_emission: Baseline EmissionResult.
            scenarios: List of dicts, each with a ``name`` key and the
                       same fields as SimulationRequest (all optional,
                       defaulting to 0).

        Returns:
            List of result dicts with ``scenario_name`` and simulation output.
        """
        results: List[Dict] = []
        for scenario in scenarios:
            name = scenario.get("name", "unnamed")
            req  = SimulationRequest(
                factory_id=baseline_emission.factory_id,
                electricity_change_pct=scenario.get("electricity_change_pct", 0),
                gas_change_pct=        scenario.get("gas_change_pct",         0),
                diesel_change_pct=     scenario.get("diesel_change_pct",      0),
                waste_change_pct=      scenario.get("waste_change_pct",       0),
                renewable_energy_pct=  scenario.get("renewable_energy_pct",   0),
                production_change_pct= scenario.get("production_change_pct",  0),
            )
            result = self.simulate(baseline_emission, req)
            results.append(
                {
                    "scenario_name":      name,
                    "simulated_emissions": result.simulated_emissions,
                    "change_pct":          result.change_pct,
                    "change_absolute":     result.change_absolute,
                    "breakdown":           result.breakdown,
                }
            )
        return results

    # ------------------------------------------------------------------
    # Sensitivity analysis
    # ------------------------------------------------------------------

    def sensitivity_analysis(
        self,
        baseline_emission,
        factory_id: str,
        levers: Optional[List[str]] = None,
        change_pct: float = 10.0,
    ) -> List[Dict]:
        """One-factor-at-a-time sensitivity analysis.

        Applies a ``change_pct`` increase and decrease to each lever
        independently, keeping all others at zero, to show which input
        has the greatest impact on total emissions.

        Args:
            baseline_emission: Baseline EmissionResult.
            factory_id: Factory identifier.
            levers: Subset of levers to analyse. Defaults to all five.
            change_pct: Percentage change to apply (positive and negative).

        Returns:
            List of lever dicts sorted by absolute impact (highest first).
        """
        all_levers = [
            "electricity_change_pct",
            "gas_change_pct",
            "diesel_change_pct",
            "waste_change_pct",
            "renewable_energy_pct",
        ]
        active_levers = levers if levers else all_levers

        results: List[Dict] = []
        baseline_total = baseline_emission.total_emissions

        for lever in active_levers:
            impacts = {}
            for direction, delta in [("increase", change_pct), ("decrease", -change_pct)]:
                kwargs = {l: 0 for l in all_levers}
                kwargs[lever] = delta
                req = SimulationRequest(factory_id=factory_id, **kwargs)
                res = self.simulate(baseline_emission, req)
                impacts[direction] = {
                    "emissions": res.simulated_emissions,
                    "change_pct": res.change_pct,
                }

            # Impact magnitude = max absolute change across ±
            max_impact = max(
                abs(impacts["increase"]["change_pct"]),
                abs(impacts["decrease"]["change_pct"]),
            )

            results.append(
                {
                    "lever":           lever,
                    "baseline_kg":     round(baseline_total, 2),
                    "impact_pct":      round(max_impact, 2),
                    "increase_result": impacts["increase"],
                    "decrease_result": impacts["decrease"],
                }
            )

        results.sort(key=lambda x: x["impact_pct"], reverse=True)
        for rank, item in enumerate(results, 1):
            item["rank"] = rank

        return results

    # ------------------------------------------------------------------
    # Monte Carlo
    # ------------------------------------------------------------------

    def monte_carlo(
        self,
        baseline_emission,
        factory_id: str,
        n_simulations: int = 500,
        uncertainty_pct: float = 15.0,
        seed: Optional[int] = None,
    ) -> Dict:
        """Monte Carlo simulation to quantify emission uncertainty.

        Randomly samples each input change from a uniform distribution
        within ``±uncertainty_pct`` and reports statistical summaries.

        Args:
            baseline_emission: Baseline EmissionResult.
            factory_id: Factory identifier.
            n_simulations: Number of Monte Carlo samples.
            uncertainty_pct: Half-range of uniform distribution (%).
            seed: Optional random seed for reproducibility.

        Returns:
            Dict with mean, std, percentile bands, and distribution bins.
        """
        if seed is not None:
            random.seed(seed)

        levers = [
            "electricity_change_pct",
            "gas_change_pct",
            "diesel_change_pct",
            "waste_change_pct",
            "renewable_energy_pct",
        ]
        all_levers = {l: 0 for l in levers}
        simulated_totals: List[float] = []

        for _ in range(n_simulations):
            kwargs = {
                l: random.uniform(-uncertainty_pct, uncertainty_pct)
                for l in levers
            }
            # Renewable must be non-negative (it's an offset, not a reduction)
            kwargs["renewable_energy_pct"] = abs(kwargs["renewable_energy_pct"])
            req = SimulationRequest(factory_id=factory_id, **kwargs)
            res = self.simulate(baseline_emission, req)
            simulated_totals.append(res.simulated_emissions)

        n = len(simulated_totals)
        sorted_totals = sorted(simulated_totals)
        mean_val = sum(sorted_totals) / n
        variance = sum((v - mean_val) ** 2 for v in sorted_totals) / n
        std_val  = variance ** 0.5

        def percentile(p: float) -> float:
            idx = int(p / 100 * (n - 1))
            return round(sorted_totals[idx], 2)

        # Build simple 10-bin histogram
        lo, hi = sorted_totals[0], sorted_totals[-1]
        bin_width = (hi - lo) / 10 if hi > lo else 1.0
        bins: List[Dict] = []
        for b in range(10):
            lower = lo + b * bin_width
            upper = lower + bin_width
            count = sum(1 for v in sorted_totals if lower <= v < upper)
            bins.append({"lower": round(lower, 2), "upper": round(upper, 2), "count": count})

        return {
            "n_simulations":    n_simulations,
            "uncertainty_pct":  uncertainty_pct,
            "baseline_kg":      round(baseline_emission.total_emissions, 2),
            "mean_kg":          round(mean_val, 2),
            "std_kg":           round(std_val,  2),
            "p5_kg":            percentile(5),
            "p25_kg":           percentile(25),
            "median_kg":        percentile(50),
            "p75_kg":           percentile(75),
            "p95_kg":           percentile(95),
            "min_kg":           round(sorted_totals[0],  2),
            "max_kg":           round(sorted_totals[-1], 2),
            "histogram_bins":   bins,
        }
