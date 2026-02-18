from datetime import datetime, timedelta
from typing import Optional
from enum import Enum

class RecurrencePattern(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

def calculate_next_occurrence(
    current_date: datetime,
    pattern: RecurrencePattern,
    interval: int = 1,
    end_date: Optional[datetime] = None
) -> Optional[datetime]:
    """
    Calculate the next occurrence date based on the recurrence pattern
    """
    if end_date and current_date >= end_date:
        return None  # Recurrence has ended
    
    if pattern == RecurrencePattern.DAILY:
        next_date = current_date + timedelta(days=interval)
    elif pattern == RecurrencePattern.WEEKLY:
        next_date = current_date + timedelta(weeks=interval)
    elif pattern == RecurrencePattern.MONTHLY:
        # For monthly recurrence, we add months carefully
        # This is a simplified approach - in production, you might want to use dateutil
        next_date = add_months(current_date, interval)
    elif pattern == RecurrencePattern.YEARLY:
        next_date = add_years(current_date, interval)
    else:
        return None  # Invalid pattern
    
    # Check if the next occurrence is beyond the end date
    if end_date and next_date > end_date:
        return None
    
    return next_date

def add_months(source_date: datetime, months: int) -> datetime:
    """
    Add months to a date, handling month-end edge cases
    """
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, [31,
        29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1])
    return source_date.replace(year=year, month=month, day=day)

def add_years(source_date: datetime, years: int) -> datetime:
    """
    Add years to a date, handling leap year edge cases
    """
    try:
        return source_date.replace(year=source_date.year + years)
    except ValueError:  # Feb 29 on a non-leap year
        # If the original date was Feb 29 and the new year is not a leap year,
        # set to Feb 28
        return source_date.replace(year=source_date.year + years, day=28)

def create_next_occurrence_task(original_task_data: dict, next_occurrence_date: datetime) -> dict:
    """
    Create data for the next occurrence of a recurring task
    """
    next_task_data = original_task_data.copy()
    
    # Reset status to pending for the new occurrence
    next_task_data['status'] = 'pending'
    
    # Set the due date to the next occurrence date
    next_task_data['due_date'] = next_occurrence_date
    
    # Clear the ID since this is a new task
    if 'id' in next_task_data:
        del next_task_data['id']
    
    # Set the parent task ID to reference the original task
    next_task_data['parent_task_id'] = original_task_data.get('id')
    
    return next_task_data