"""What-if simulator for emission scenario analysis."""

from typing import Dict
from app.schemas.optimize import SimulationRequest, SimulationResult


class Simulator:
    """Simulate the impact of operational changes on emissions."""

    def simulate(self, baseline_emission, request: SimulationRequest) -> SimulationResult:
        """
        Apply percentage changes to baseline emissions and calculate new totals.
        """
        # Baseline values
        base_s1_gas = baseline_emission.scope1_natural_gas
        base_s1_diesel = baseline_emission.scope1_diesel
        base_s2_elec = baseline_emission.scope2_electricity
        base_s3_waste = baseline_emission.scope3_waste
        base_s3_water = baseline_emission.scope3_water
        base_s3_transport = baseline_emission.scope3_transport
        baseline_total = baseline_emission.total_emissions

        # Apply changes
        sim_s2_elec = base_s2_elec * (1 + request.electricity_change_pct / 100)
        sim_s1_gas = base_s1_gas * (1 + request.gas_change_pct / 100)
        sim_s1_diesel = base_s1_diesel * (1 + request.diesel_change_pct / 100)
        sim_s3_waste = base_s3_waste * (1 + request.waste_change_pct / 100)

        # Renewable energy offset (reduces scope 2)
        if request.renewable_energy_pct > 0:
            sim_s2_elec *= (1 - request.renewable_energy_pct / 100)

        # Recalculate
        sim_s1_total = sim_s1_gas + sim_s1_diesel
        sim_s2_total = max(0, sim_s2_elec)
        sim_s3_total = sim_s3_waste + base_s3_water + base_s3_transport
        sim_total = sim_s1_total + sim_s2_total + sim_s3_total

        change_abs = sim_total - baseline_total
        change_pct = (change_abs / baseline_total * 100) if baseline_total else 0

        breakdown = {
            "baseline": {
                "scope1": round(baseline_emission.scope1_total, 2),
                "scope2": round(baseline_emission.scope2_total, 2),
                "scope3": round(baseline_emission.scope3_total, 2),
                "total": round(baseline_total, 2),
            },
            "simulated": {
                "scope1": round(sim_s1_total, 2),
                "scope2": round(sim_s2_total, 2),
                "scope3": round(sim_s3_total, 2),
                "total": round(sim_total, 2),
            },
        }

        return SimulationResult(
            factory_id=request.factory_id,
            baseline_emissions=round(baseline_total, 2),
            simulated_emissions=round(sim_total, 2),
            change_pct=round(change_pct, 2),
            change_absolute=round(change_abs, 2),
            breakdown=breakdown,
        )