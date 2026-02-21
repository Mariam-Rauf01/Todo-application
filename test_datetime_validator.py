"""Test datetime validator"""
from datetime import datetime
from dateutil import parser as dateutil_parser

def parse_datetime_fields(value):
    """
    Parse datetime fields from various formats (ISO strings, date strings, etc.)
    This handles both datetime strings and date-only strings from frontend
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        # Try to parse using dateutil (handles most formats)
        return dateutil_parser.parse(value)
    except (ValueError, TypeError) as e:
        # If parsing fails, return None
        print(f"Error parsing {value}: {e}")
        return None

# Test cases
test_cases = [
    None,
    "2025-02-21",
    "2025-02-21T10:30:00",
    "2025-02-21T10:30:00Z",
    "2025-02-21T10:30:00+05:00",
    datetime(2025, 2, 21),
    "2025-02-21 10:30:00",
    "02/21/2025",
    "invalid-date"
]

print("Testing datetime parser:")
print("=" * 60)
for test in test_cases:
    result = parse_datetime_fields(test)
    print(f"Input: {test!r:35} -> Output: {result}")
print("=" * 60)
