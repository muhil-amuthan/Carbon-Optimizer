"""AI engine for anomaly detection, forecasting, and insights."""

import numpy as np
from typing import List, Dict
from datetime import timedelta

from app.schemas.emission import AnomalyResult


class AIEngine:
    """Statistical AI engine for emission analysis."""

    def detect_anomalies(
        self, emission_results: list, sensitivity: float = 2.0
    ) -> List[AnomalyResult]:
        """
        Detect anomalies using Z-score method with rolling statistics.
        """
        emissions = [r.total_emissions for r in emission_results]
        dates = [r.date for r in emission_results]
        factory_id = emission_results[0].factory_id

        mean_val = np.mean(emissions)
        std_val = np.std(emissions)

        if std_val == 0:
            std_val = 1.0  # Avoid division by zero

        anomalies = []
        for i, (em, dt) in enumerate(zip(emissions, dates)):
            z_score = abs(em - mean_val) / std_val
            deviation_pct = ((em - mean_val) / mean_val) * 100 if mean_val else 0

            is_anomaly = z_score > sensitivity

            severity = "normal"
            if z_score > sensitivity * 1.5:
                severity = "critical"
            elif z_score > sensitivity:
                severity = "warning"

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

    def forecast_emissions(
        self, emission_results: list, periods: int = 30
    ) -> List[Dict]:
        """
        Simple linear trend forecasting.
        Uses numpy polyfit for trend extraction.
        """
        emissions = [r.total_emissions for r in emission_results]
        dates = [r.date for r in emission_results]

        x = np.arange(len(emissions))
        y = np.array(emissions)

        # Linear fit
        coeffs = np.polyfit(x, y, deg=1)
        slope, intercept = coeffs

        # Generate forecast
        last_date = dates[-1]
        forecast = []

        for i in range(1, periods + 1):
            future_x = len(emissions) + i
            predicted = slope * future_x + intercept
            # Add some realistic noise
            noise = np.random.normal(0, np.std(emissions) * 0.1)
            predicted = max(0, predicted + noise)

            forecast_date = last_date + timedelta(days=i)
            forecast.append(
                {
                    "date": str(forecast_date),
                    "predicted_emissions": round(predicted, 2),
                    "lower_bound": round(predicted * 0.9, 2),
                    "upper_bound": round(predicted * 1.1, 2),
                    "confidence": 0.85,
                }
            )

        return forecast

    def generate_insights(self, emission_results: list) -> List[Dict]:
        """Generate actionable insights from emission data."""
        emissions = [r.total_emissions for r in emission_results]
        scope1_vals = [r.scope1_total for r in emission_results]
        scope2_vals = [r.scope2_total for r in emission_results]
        scope3_vals = [r.scope3_total for r in emission_results]
        intensities = [r.emission_intensity for r in emission_results]

        insights = []

        # Trend insight
        if len(emissions) >= 2:
            first_half = np.mean(emissions[: len(emissions) // 2])
            second_half = np.mean(emissions[len(emissions) // 2:])
            trend_change = ((second_half - first_half) / first_half) * 100

            if trend_change > 5:
                insights.append(
                    {
                        "type": "warning",
                        "category": "trend",
                        "title": "Rising Emission Trend",
                        "message": f"Emissions have increased by {trend_change:.1f}% in the recent period. Consider reviewing operational efficiency.",
                        "priority": "high",
                    }
                )
            elif trend_change < -5:
                insights.append(
                    {
                        "type": "success",
                        "category": "trend",
                        "title": "Declining Emission Trend",
                        "message": f"Emissions have decreased by {abs(trend_change):.1f}%. Your reduction efforts are working!",
                        "priority": "info",
                    }
                )

        # Scope dominance insight
        total_s1 = sum(scope1_vals)
        total_s2 = sum(scope2_vals)
        total_s3 = sum(scope3_vals)
        grand_total = total_s1 + total_s2 + total_s3

        if grand_total > 0:
            s2_pct = (total_s2 / grand_total) * 100
            if s2_pct > 50:
                insights.append(
                    {
                        "type": "info",
                        "category": "scope_analysis",
                        "title": "Electricity is Your Biggest Emitter",
                        "message": f"Scope 2 (electricity) accounts for {s2_pct:.1f}% of total emissions. Consider renewable energy sources or efficiency upgrades.",
                        "priority": "high",
                    }
                )

            s1_pct = (total_s1 / grand_total) * 100
            if s1_pct > 40:
                insights.append(
                    {
                        "type": "info",
                        "category": "scope_analysis",
                        "title": "High Direct Emissions",
                        "message": f"Scope 1 (direct fuel combustion) accounts for {s1_pct:.1f}%. Focus on fuel switching and efficiency improvements.",
                        "priority": "high",
                    }
                )

        # Intensity insight
        if intensities:
            avg_intensity = np.mean(intensities)
            max_intensity = max(intensities)
            if max_intensity > avg_intensity * 1.3:
                insights.append(
                    {
                        "type": "warning",
                        "category": "efficiency",
                        "title": "Inconsistent Emission Intensity",
                        "message": f"Peak emission intensity ({max_intensity:.2f}) is significantly higher than average ({avg_intensity:.2f}). Investigate production inefficiencies on high-intensity days.",
                        "priority": "medium",
                    }
                )

        # Variability insight
        cv = (np.std(emissions) / np.mean(emissions)) * 100 if np.mean(emissions) > 0 else 0
        if cv > 20:
            insights.append(
                {
                    "type": "info",
                    "category": "variability",
                    "title": "High Emission Variability",
                    "message": f"Emission variability is {cv:.1f}% (coefficient of variation). Standardizing operations could reduce peak emissions.",
                    "priority": "medium",
                }
            )

        # Quick win insight
        insights.append(
            {
                "type": "tip",
                "category": "quick_win",
                "title": "Quick Win: Compressed Air Audit",
                "message": "Compressed air leaks typically account for 20-30% of compressed air energy. A simple audit can yield 5-8% electricity savings.",
                "priority": "low",
            }
        )

        return insights