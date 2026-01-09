from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime, timedelta
from sqlalchemy import func

from . import database, auth, models

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard")
def get_dashboard_data(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Get comprehensive dashboard data for the user
    """
    # Get task statistics
    total_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).count()
    completed_tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.status == "completed"
    ).count()
    pending_tasks = total_tasks - completed_tasks
    
    # Get tasks by priority
    high_priority = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.priority == "high"
    ).count()
    medium_priority = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.priority == "medium"
    ).count()
    low_priority = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.priority == "low"
    ).count()
    
    # Get tasks by category
    categories = db.query(models.Task.category, func.count(models.Task.id)).filter(
        models.Task.user_id == current_user.id
    ).group_by(models.Task.category).all()
    
    # Get tasks due this week
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    tasks_due_this_week = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.due_date >= week_start,
        models.Task.due_date <= week_end,
        models.Task.status != "completed"
    ).count()
    
    # Get completion rate over time (last 7 days)
    completion_data = []
    for i in range(7):
        date = today - timedelta(days=i)
        completed = db.query(models.Task).filter(
            models.Task.user_id == current_user.id,
            models.Task.status == "completed",
            func.date(models.Task.updated_at) == date
        ).count()
        completion_data.append({
            "date": date.isoformat(),
            "completed": completed
        })
    
    return {
        "summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
        },
        "by_priority": {
            "high": high_priority,
            "medium": medium_priority,
            "low": low_priority
        },
        "by_category": [{"name": cat[0], "count": cat[1]} for cat in categories if cat[0]],
        "due_this_week": tasks_due_this_week,
        "completion_trend": list(reversed(completion_data))  # Reverse to show oldest first
    }

@router.get("/tasks-trend")
def get_tasks_trend(
    days: int = 30,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get task creation trend over the specified number of days
    """
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days-1)
    
    trend_data = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        created = db.query(models.Task).filter(
            models.Task.user_id == current_user.id,
            func.date(models.Task.created_at) == date
        ).count()
        
        completed = db.query(models.Task).filter(
            models.Task.user_id == current_user.id,
            models.Task.status == "completed",
            func.date(models.Task.updated_at) == date
        ).count()
        
        trend_data.append({
            "date": date.isoformat(),
            "created": created,
            "completed": completed
        })
    
    return trend_data

@router.get("/productivity-insights")
def get_productivity_insights(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Get productivity insights based on task completion patterns
    """
    # Get all completed tasks
    completed_tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.status == "completed"
    ).all()
    
    if not completed_tasks:
        return {
            "message": "Complete more tasks to get productivity insights",
            "suggestions": [
                "Try breaking large tasks into smaller, manageable pieces",
                "Set realistic deadlines for your tasks",
                "Prioritize high-impact tasks first"
            ]
        }
    
    # Calculate average completion time
    total_completion_time = 0
    completed_count = 0
    
    for task in completed_tasks:
        if task.created_at and task.updated_at:
            completion_time = (task.updated_at - task.created_at).days
            if completion_time >= 0:  # Only count valid completion times
                total_completion_time += completion_time
                completed_count += 1
    
    avg_completion_days = round(total_completion_time / completed_count, 2) if completed_count > 0 else 0
    
    # Get most productive time of day (based on completion time)
    completion_hours = []
    for task in completed_tasks:
        if task.updated_at:
            completion_hours.append(task.updated_at.hour)
    
    most_productive_hour = max(set(completion_hours), key=completion_hours.count) if completion_hours else 12
    
    # Get most productive day of week
    completion_days = []
    for task in completed_tasks:
        if task.updated_at:
            completion_days.append(task.updated_at.weekday())  # 0=Monday, 6=Sunday
    
    if completion_days:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        most_productive_day_idx = max(set(completion_days), key=completion_days.count)
        most_productive_day = day_names[most_productive_day_idx]
    else:
        most_productive_day = "N/A"
    
    # Get priority completion rates
    high_priority_completed = len([t for t in completed_tasks if t.priority == "high"])
    medium_priority_completed = len([t for t in completed_tasks if t.priority == "medium"])
    low_priority_completed = len([t for t in completed_tasks if t.priority == "low"])
    
    total_high = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.priority == "high"
    ).count()
    total_medium = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.priority == "medium"
    ).count()
    total_low = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.priority == "low"
    ).count()
    
    high_priority_rate = round((high_priority_completed / total_high * 100) if total_high > 0 else 0, 2)
    medium_priority_rate = round((medium_priority_completed / total_medium * 100) if total_medium > 0 else 0, 2)
    low_priority_rate = round((low_priority_completed / total_low * 100) if total_low > 0 else 0, 2)
    
    return {
        "average_completion_days": avg_completion_days,
        "most_productive_hour": most_productive_hour,
        "most_productive_day": most_productive_day,
        "priority_completion_rates": {
            "high": high_priority_rate,
            "medium": medium_priority_rate,
            "low": low_priority_rate
        },
        "suggestions": [
            f"Your average task completion time is {avg_completion_days} days. Consider setting more realistic deadlines.",
            f"You're most productive around {most_productive_hour}:00. Schedule important tasks during this time.",
            f"You're most productive on {most_productive_day}s. Plan your week accordingly.",
            f"Your high priority task completion rate is {high_priority_rate}%. Keep up the good work on important tasks!"
        ]
    }