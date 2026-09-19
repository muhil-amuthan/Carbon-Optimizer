import os
import sys
import requests
import json

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:8000"
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

def run_tests():
    print("=" * 60)
    print("🚀 RUNNING CARBON-OPTIMIZER INTEGRATION TESTS")
    print("=" * 60)

    # 1. Health
    print("\n[1/8] Checking API Health...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(f"  ✅ Health OK: {r.json()}")

    # 2. Upload Factory CSV
    print("\n[2/8] Uploading Factory Operational CSV...")
    csv_path = os.path.join(DATA_DIR, "sample_factory_6months.csv")
    with open(csv_path, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/data/upload-csv", files={"file": ("factory.csv", f, "text/csv")})
    assert r.status_code == 200, f"Upload failed: {r.text}"
    print(f"  ✅ Uploaded {r.json()['records_inserted']} records for {r.json()['factory_ids']}")

    # 3. Calculate Emissions
    print("\n[3/8] Calculating Scope 1, 2, 3 Emissions for FAC001...")
    r = requests.post(f"{BASE_URL}/api/emissions/calculate?factory_id=FAC001")
    assert r.status_code == 200, f"Calculation failed: {r.text}"
    res = r.json()
    print(f"  ✅ Calculated {len(res)} days of emissions")
    print(f"  ✅ Latest Record Scope 1: {res[-1]['scope1_total']} kgCO2e | Scope 2: {res[-1]['scope2_total']} kgCO2e | Scope 3: {res[-1]['scope3_total']} kgCO2e")

    # 4. Summary & AI Insights
    print("\n[4/8] Fetching Emission Summary & AI Insights...")
    r_sum = requests.get(f"{BASE_URL}/api/emissions/summary/FAC001")
    assert r_sum.status_code == 200
    print(f"  ✅ Total Factory Emissions: {r_sum.json()['total_emissions_kg']:,.2f} kgCO2e")

    r_ins = requests.get(f"{BASE_URL}/api/ai/insights/FAC001")
    assert r_ins.status_code == 200
    print(f"  ✅ Generated {len(r_ins.json()['insights'])} AI Insights")

    # 5. Anomaly Detection
    print("\n[5/8] Running AI Anomaly Detection...")
    r_anom = requests.get(f"{BASE_URL}/api/ai/anomalies/FAC001?sensitivity=2.0")
    assert r_anom.status_code == 200
    print(f"  ✅ Anomalies detected: {r_anom.json()['total_anomalies']}")

    # 6. Budget Optimizer
    print("\n[6/8] Testing Knapsack Budget Optimizer ($100,000 budget)...")
    payload = {
        "factory_id": "FAC001",
        "budget_usd": 100000,
        "target_reduction_pct": 30.0,
        "exclude_actions": []
    }
    r_opt = requests.post(f"{BASE_URL}/api/optimize/run", json=payload)
    assert r_opt.status_code == 200, f"Optimization failed: {r_opt.text}"
    opt_data = r_opt.json()
    print(f"  ✅ Selected Actions: {len(opt_data['selected_actions'])}")
    print(f"  ✅ Total Cost: ${opt_data['total_cost']:,.2f} (Budget Remaining: ${opt_data['budget_remaining']:,.2f})")
    print(f"  ✅ Estimated Carbon Reduction: {opt_data['total_reduction_pct']}%")

    # 7. What-If Simulator
    print("\n[7/8] Testing What-If Scenario Simulator...")
    sim_payload = {
        "factory_id": "FAC001",
        "electricity_change_pct": -15.0,
        "gas_change_pct": -10.0,
        "diesel_change_pct": 0.0,
        "waste_change_pct": -20.0,
        "renewable_energy_pct": 30.0,
        "production_change_pct": 0.0
    }
    r_sim = requests.post(f"{BASE_URL}/api/optimize/simulate", json=sim_payload)
    assert r_sim.status_code == 200
    sim_data = r_sim.json()
    print(f"  ✅ Baseline: {sim_data['baseline_emissions']:,.2f} kgCO2e -> Simulated: {sim_data['simulated_emissions']:,.2f} kgCO2e ({sim_data['change_pct']}%)")

    # 8. Grid Data & Scheduler
    print("\n[8/8] Testing Grid Ingestion & Smart Scheduling...")
    grid_csv = os.path.join(DATA_DIR, "sample_npp_grid.csv")
    with open(grid_csv, "rb") as f:
        r_grid = requests.post(f"{BASE_URL}/api/grid/upload-grid-data", files={"file": ("grid.csv", f, "text/csv")})
    assert r_grid.status_code == 200

    r_win = requests.get(f"{BASE_URL}/api/grid/optimal-window?region=REGION_A")
    assert r_win.status_code == 200
    win_data = r_win.json()
    print(f"  ✅ Optimal Window: {win_data['start_time']} - {win_data['end_time']}")
    print(f"  ✅ Avg Carbon Intensity: {win_data['avg_carbon_intensity']} gCO2/kWh")

    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED! BACKEND IS FULLY FUNCTIONAL!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
