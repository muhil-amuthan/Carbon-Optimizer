"""AI engine for anomaly detection, forecasting, and insights.

Supports:
- Z-score anomaly detection (rolling and global)
- Linear trend forecasting with confidence bands
- Seasonal decomposition (additive, 7-day / 30-day period)
- Multi-factory benchmarking and performance scoring
- Actionable insight generation
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import timedelta
from typing import Dict, List, Optional

import numpy as np

from app.schemas.emission import AnomalyResult


class AIEngine:
    """Statistical AI engine for emission analysis."""

    # ------------------------------------------------------------------
    # Anomaly Detection
    # ------------------------------------------------------------------

    def detect_anomalies(
        self,
        emission_results: list,
        sensitivity: float = 2.0,
        use_rolling: bool = True,
        window: int = 7,
    ) -> List[AnomalyResult]:
        """Detect anomalies using Z-score method.

        Args:
            emission_results: List of EmissionResult ORM objects.
            sensitivity: Z-score threshold; lower = more sensitive.
            use_rolling: If True, use a rolling window mean/std instead
                         of the global series statistics.
            window: Rolling window size (days) used when use_rolling=True.

        Returns:
            List of AnomalyResult objects, one per data point.
        """
        if not emission_results:
            return []

        emissions = [r.total_emissions for r in emission_results]
        dates = [r.date for r in emission_results]
        factory_id = emission_results[0].factory_id

        global_mean = float(np.mean(emissions))
        global_std  = float(np.std(emissions)) or 1.0

        anomalies: List[AnomalyResult] = []

        for i, (em, dt) in enumerate(zip(emissions, dates)):
            if use_rolling and len(emissions) >= window:
                # Rolling window centred on current index (left-padded)
                start = max(0, i - window // 2)
                end   = min(len(emissions), start + window)
                window_vals = emissions[start:end]
                mean_val = float(np.mean(window_vals))
                std_val  = float(np.std(window_vals)) or 1.0
            else:
                mean_val = global_mean
                std_val  = global_std

            z_score      = abs(em - mean_val) / std_val
            deviation_pct = ((em - mean_val) / mean_val * 100) if mean_val else 0.0
            is_anomaly   = z_score > sensitivity

            if z_score > sensitivity * 1.5:
                severity = "critical"
            elif z_score > sensitivity:
                severity = "warning"
            else:
                severity = "normal"

            anomalies.append(
                AnomalyResult(
                    date=dt,
                    factory_id=factory_id,
                    actual_emissions=round(em, 2),
                    expected_emissions=round(mean_val, 2),
                    deviation_pct=round(deviation_pct, 2),
                    is_anomaly=is_anomaly,
                    severity=severity,
                )
            )

        return anomalies

    # ------------------------------------------------------------------
    # Forecasting
    # ------------------------------------------------------------------

    def forecast_emissions(
        self,
        emission_results: list,
        periods: int = 30,
        add_noise: bool = True,
    ) -> List[Dict]:
        """Forecast future emissions using linear trend extrapolation.

        Uses numpy polyfit for trend extraction and adds a confidence
        interval based on the historical standard deviation.

        Args:
            emission_results: Historical emission results (ordered by date).
            periods: Number of future days to forecast.
            add_noise: If True, adds realistic Gaussian noise to each forecast
                       point for simulation-like output.

        Returns:
            List of dicts with ``date``, ``predicted_emissions``,
            ``lower_bound``, ``upper_bound``, and ``confidence``.
        """
        if not emission_results:
            return []

        emissions = np.array([r.total_emissions for r in emission_results])
        dates     = [r.date for r in emission_results]

        x = np.arange(len(emissions))
        slope, intercept = np.polyfit(x, emissions, deg=1)

        hist_std   = float(np.std(emissions))
        last_date  = dates[-1]
        n          = len(emissions)

        forecast: List[Dict] = []
        for i in range(1, periods + 1):
            future_x  = n + i
            predicted = float(slope * future_x + intercept)

            if add_noise:
                noise     = np.random.normal(0, hist_std * 0.1)
                predicted = max(0.0, predicted + float(noise))
            else:
                predicted = max(0.0, predicted)

            # Confidence widens as we go further into the future
            uncertainty_factor = 1 + (i / periods) * 0.5
            margin = hist_std * uncertainty_factor
            confidence = max(0.50, 0.92 - (i / periods) * 0.25)

            forecast.append(
                {
                    "date":               str(last_date + timedelta(days=i)),
                    "predicted_emissions": round(predicted,             2),
                    "lower_bound":         round(max(0, predicted - margin), 2),
                    "upper_bound":         round(predicted + margin,   2),
                    "confidence":          round(confidence,            2),
                }
            )

        return forecast

    # ------------------------------------------------------------------
    # Seasonal Decomposition
    # ------------------------------------------------------------------

    def seasonal_decompose(
        self,
        emission_results: list,
        period: int = 7,
    ) -> Dict:
        """Decompose emission time series into trend, seasonal, and residual.

        Uses a simple additive model:
            observed = trend + seasonal + residual

        Args:
            emission_results: Ordered emission history.
            period: Seasonality period in days (7 = weekly, 30 = monthly).

        Returns:
            Dict with ``trend``, ``seasonal``, ``residual``, and
            ``seasonality_strength`` (0–1 score).
        """
        if len(emission_results) < period * 2:
            return {
                "error": f"Need at least {period * 2} records for decomposition.",
                "trend":      [],
                "seasonal":   [],
                "residual":   [],
                "seasonality_strength": 0.0,
            }

        values = np.array([r.total_emissions for r in emission_results], dtype=float)
        dates  = [str(r.date) for r in emission_results]
        n      = len(values)

        # Centred moving average for trend
        half = period // 2
        trend = np.full(n, np.nan)
        for i in range(half, n - half):
            trend[i] = np.mean(values[i - half: i + half + 1])

        # Forward/backward fill the ends of trend
        first_valid = next(i for i in range(n) if not math.isnan(trend[i]))
        last_valid  = next(i for i in range(n - 1, -1, -1) if not math.isnan(trend[i]))
        trend[:first_valid] = trend[first_valid]
        trend[last_valid:]  = trend[last_valid]

        # Seasonal component: average deviation per period-phase
        detrended = values - trend
        seasonal_pattern = np.zeros(period)
        for phase in range(period):
            phase_vals = detrended[phase::period]
            seasonal_pattern[phase] = float(np.nanmean(phase_vals))

        # Tile seasonal across the full length
        seasonal = np.array([seasonal_pattern[i % period] for i in range(n)])

        residual = values - trend - seasonal

        # Seasonality strength: fraction of variance explained by seasonal
        var_residual  = float(np.var(residual))
        var_detrended = float(np.var(detrended)) or 1.0
        seasonality_strength = max(0.0, 1.0 - var_residual / var_detrended)

        return {
            "dates":                dates,
            "trend":                [round(float(v), 2) for v in trend],
            "seasonal":             [round(float(v), 2) for v in seasonal],
            "residual":             [round(float(v), 2) for v in residual],
            "period_days":          period,
            "seasonality_strength": round(seasonality_strength, 4),
        }

    # ------------------------------------------------------------------
    # Multi-factory Benchmarking
    # ------------------------------------------------------------------

    def benchmark_comparison(
        self,
        factory_emission_map: Dict[str, list],
    ) -> Dict:
        """Compare emission performance across multiple factories.

        Args:
            factory_emission_map: ``{factory_id: [EmissionResult, ...]}``.

        Returns:
            Dict with per-factory stats and ranking.
        """
        stats: List[Dict] = []

        for fid, results in factory_emission_map.items():
            if not results:
                continue
            totals     = [r.total_emissions for r in results]
            intensities = [r.emission_intensity for r in results
                           if r.emission_intensity and r.emission_intensity > 0]

            stats.append(
                {
                    "factory_id":       fid,
                    "total_emissions":  round(sum(totals), 2),
                    "avg_daily":        round(float(np.mean(totals)), 2),
                    "avg_intensity":    round(float(np.mean(intensities)), 4)
                                        if intensities else 0.0,
                    "peak_emission":    round(max(totals), 2),
                    "min_emission":     round(min(totals), 2),
                    "std_dev":          round(float(np.std(totals)), 2),
                    "record_count":     len(results),
                }
            )

        if not stats:
            return {"factories": [], "best_performer": None, "worst_performer": None}

        # Rank by avg daily (ascending = best)
        ranked = sorted(stats, key=lambda x: x["avg_daily"])
        for rank, item in enumerate(ranked, 1):
            item["rank"] = rank

        # Compute relative performance vs group average
        group_avg = float(np.mean([s["avg_daily"] for s in stats]))
        for item in stats:
            diff_pct = (item["avg_daily"] - group_avg) / group_avg * 100 if group_avg else 0
            item["vs_group_avg_pct"] = round(diff_pct, 2)

        return {
            "factories":      ranked,
            "group_avg_daily": round(group_avg, 2),
            "best_performer":  ranked[0]["factory_id"],
            "worst_performer": ranked[-1]["factory_id"],
        }

    # ------------------------------------------------------------------
    # Performance Scoring
    # ------------------------------------------------------------------

    def generate_performance_score(
        self,
        emission_results: list,
        target_daily_kg: Optional[float] = None,
        industry_avg_kg: Optional[float] = None,
    ) -> Dict:
        """Generate a 0–100 sustainability performance score.

        Evaluates:
        - Trend direction (improving vs. worsening)
        - Emission variability (consistency)
        - Progress toward a target (if supplied)
        - Comparison to industry average (if supplied)

        Args:
            emission_results: Ordered emission history.
            target_daily_kg: Optional daily emission reduction target (kg).
            industry_avg_kg: Optional industry benchmark daily average (kg).

        Returns:
            Dict with ``score``, ``grade``, and component sub-scores.
        """
        if not emission_results:
            return {"score": 0, "grade": "N/A", "components": {}}

        totals = [r.total_emissions for r in emission_results]
        n = len(totals)

        # Trend score (40 pts): rewards downward slope
        trend_score = 40.0
        if n >= 4:
            first_half  = float(np.mean(totals[:n // 2]))
            second_half = float(np.mean(totals[n // 2:]))
            trend_pct   = (first_half - second_half) / first_half * 100 if first_half else 0
            # +20 pts for every 10% improvement, max 40
            trend_score = min(40.0, max(0.0, 20.0 + trend_pct * 2))

        # Variability score (20 pts): lower CV = better
        mean_v = float(np.mean(totals))
        std_v  = float(np.std(totals))
        cv     = std_v / mean_v if mean_v else 0
        var_score = max(0.0, 20.0 * (1 - min(cv, 1.0)))

        # Target score (20 pts)
        target_score = 10.0  # neutral if no target
        if target_daily_kg and mean_v > 0:
            ratio = mean_v / target_daily_kg
            target_score = min(20.0, max(0.0, 20.0 / ratio))

        # Benchmark score (20 pts)
        benchmark_score = 10.0  # neutral if no benchmark
        if industry_avg_kg and mean_v > 0:
            ratio = mean_v / industry_avg_kg
            benchmark_score = min(20.0, max(0.0, 20.0 / ratio))

        total_score = trend_score + var_score + target_score + benchmark_score

        grade_map = [(90, "A+"), (80, "A"), (70, "B"), (60, "C"), (50, "D")]
        grade = "F"
        for threshold, letter in grade_map:
            if total_score >= threshold:
                grade = letter
                break

        return {
            "score": round(total_score, 1),
            "grade": grade,
            "components": {
                "trend_score":      round(trend_score,     1),
                "variability_score": round(var_score,      1),
                "target_score":     round(target_score,    1),
                "benchmark_score":  round(benchmark_score, 1),
            },
            "avg_daily_kg":     round(mean_v, 2),
            "target_daily_kg":  target_daily_kg,
            "industry_avg_kg":  industry_avg_kg,
        }

    # ------------------------------------------------------------------
    # Insight Generation
    # ------------------------------------------------------------------

    def generate_insights(self, emission_results: list) -> List[Dict]:
        """Generate actionable insights from emission data."""
        if not emission_results:
            return []

        emissions   = [r.total_emissions for r in emission_results]
        scope1_vals = [r.scope1_total    for r in emission_results]
        scope2_vals = [r.scope2_total    for r in emission_results]
        scope3_vals = [r.scope3_total    for r in emission_results]
        intensities = [r.emission_intensity for r in emission_results]

        insights: List[Dict] = []
        n = len(emissions)

        # --- Trend insight ---
        if n >= 2:
            first_half  = float(np.mean(emissions[: n // 2]))
            second_half = float(np.mean(emissions[n // 2:]))
            trend_change = ((second_half - first_half) / first_half * 100) if first_half else 0.0

            if trend_change > 5:
                insights.append(
                    {
                        "type":     "warning",
                        "category": "trend",
                        "title":    "Rising Emission Trend",
                        "message":  (
                            f"Emissions have increased by {trend_change:.1f}% in the recent period. "
                            "Consider reviewing operational efficiency."
                        ),
                        "priority": "high",
                    }
                )
            elif trend_change < -5:
                insights.append(
                    {
                        "type":     "success",
                        "category": "trend",
                        "title":    "Declining Emission Trend",
                        "message":  (
                            f"Emissions have decreased by {abs(trend_change):.1f}%. "
                            "Your reduction efforts are working!"
                        ),
                        "priority": "info",
                    }
                )

        # --- Scope dominance insight ---
        total_s1  = sum(scope1_vals)
        total_s2  = sum(scope2_vals)
        total_s3  = sum(scope3_vals)
        grand_total = total_s1 + total_s2 + total_s3

        if grand_total > 0:
            s2_pct = total_s2 / grand_total * 100
            if s2_pct > 50:
                insights.append(
                    {
                        "type":     "info",
                        "category": "scope_analysis",
                        "title":    "Electricity is Your Biggest Emitter",
                        "message":  (
                            f"Scope 2 (electricity) accounts for {s2_pct:.1f}% of total emissions. "
                            "Consider renewable energy sources or efficiency upgrades."
                        ),
                        "priority": "high",
                    }
                )

            s1_pct = total_s1 / grand_total * 100
            if s1_pct > 40:
                insights.append(
                    {
                        "type":     "info",
                        "category": "scope_analysis",
                        "title":    "High Direct Emissions",
                        "message":  (
                            f"Scope 1 (direct fuel combustion) accounts for {s1_pct:.1f}%. "
                            "Focus on fuel switching and efficiency improvements."
                        ),
                        "priority": "high",
                    }
                )

            s3_pct = total_s3 / grand_total * 100
            if s3_pct > 30:
                insights.append(
                    {
                        "type":     "info",
                        "category": "scope_analysis",
                        "title":    "Significant Indirect Emissions",
                        "message":  (
                            f"Scope 3 (indirect) accounts for {s3_pct:.1f}%. "
                            "Review supply chain, transport routes, and waste handling."
                        ),
                        "priority": "medium",
                    }
                )

        # --- Intensity insight ---
        valid_intensities = [v for v in intensities if v and v > 0]
        if valid_intensities:
            avg_intensity = float(np.mean(valid_intensities))
            max_intensity = max(valid_intensities)
            if max_intensity > avg_intensity * 1.3:
                insights.append(
                    {
                        "type":     "warning",
                        "category": "efficiency",
                        "title":    "Inconsistent Emission Intensity",
                        "message":  (
                            f"Peak emission intensity ({max_intensity:.2f}) is significantly "
                            f"higher than average ({avg_intensity:.2f}). "
                            "Investigate production inefficiencies on high-intensity days."
                        ),
                        "priority": "medium",
                    }
                )

        # --- Variability insight ---
        mean_em = float(np.mean(emissions))
        cv = float(np.std(emissions)) / mean_em * 100 if mean_em > 0 else 0
        if cv > 20:
            insights.append(
                {
                    "type":     "info",
                    "category": "variability",
                    "title":    "High Emission Variability",
                    "message":  (
                        f"Emission variability is {cv:.1f}% (coefficient of variation). "
                        "Standardising operations could reduce peak emissions."
                    ),
                    "priority": "medium",
                }
            )

        # --- Quick-win insight (always appended) ---
        insights.append(
            {
                "type":     "tip",
                "category": "quick_win",
                "title":    "Quick Win: Compressed Air Audit",
                "message":  (
                    "Compressed air leaks typically account for 20–30% of compressed air energy. "
                    "A simple audit can yield 5–8% electricity savings."
                ),
                "priority": "low",
            }
        )

        return insights

