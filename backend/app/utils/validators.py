"""Custom validation utilities."""

from datetime import date
from typing import Optional


def validate_date_range(start: Optional[date], end: Optional[date]) -> bool:
    """Validate that start date is before end date."""
    if start and end:
        return start <= end
    return True


def validate_factory_id(factory_id: str) -> bool:
    """Validate factory ID format."""
    if not factory_id or len(factory_id) > 50:
        return False
    return factory_id.isalnum() or all(c.isalnum() or c in "-_" for c in factory_id)


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value to a range."""
    return max(min_val, min(value, max_val))