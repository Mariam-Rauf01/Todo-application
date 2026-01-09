from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime
import logging

from . import models, schemas, database, auth
from .events import Event, EventType

# Kafka service will be imported later to avoid circular import
kafka_service = None
from .recurrence import calculate_next_occurrence, create_next_occurrence_task, RecurrencePattern
from .notifications import service as notification_service

router = APIRouter()
logger = logging.getLogger(__name__)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.Task])
def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    due_date_from: Optional[datetime] = None,
    due_date_to: Optional[datetime] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all tasks for the current user with optional filtering
    """
    try:
        query = db.query(models.Task).filter(models.Task.user_id == current_user.id)

        # Apply filters
        if status:
            query = query.filter(models.Task.status == status)
        if priority:
            query = query.filter(models.Task.priority == priority)
        if category:
            query = query.filter(models.Task.category == category)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                models.Task.title.ilike(search_filter) |
                models.Task.description.ilike(search_filter)
            )
        if due_date_from:
            query = query.filter(models.Task.due_date >= due_date_from)
        if due_date_to:
            query = query.filter(models.Task.due_date <= due_date_to)

        tasks = query.offset(skip).limit(limit).all()
        return tasks
    except Exception as db_error:
        logger.warning(f"Database error in get_tasks: {db_error}. Returning empty list.")
        return []

@router.post("/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new task for the current user
    """
    db_task = models.Task(
        title=task.title,
        description=task.description,
        status=task.status,
        user_id=current_user.id,
        due_date=task.due_date,
        priority=task.priority,
        category=task.category,
        recurrence_pattern=task.recurrence_pattern,
        recurrence_end_date=task.recurrence_end_date,
        recurrence_interval=task.recurrence_interval or 1,
        parent_task_id=task.parent_task_id
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Handle recurrence - if this is a recurring task, calculate the next occurrence
    if db_task.recurrence_pattern:
        next_occurrence = calculate_next_occurrence(
            current_date=db_task.due_date or datetime.utcnow(),
            pattern=RecurrencePattern(db_task.recurrence_pattern),
            interval=db_task.recurrence_interval,
            end_date=db_task.recurrence_end_date
        )

        if next_occurrence:
            db_task.next_occurrence = next_occurrence
            db.commit()
            logger.info(f"Set next occurrence for recurring task {db_task.id} to {next_occurrence}")

    # Schedule notifications for due date
    if db_task.due_date:
        notification_service.schedule_task_due_notifications(db, db_task, current_user.id)

    # Publish task created event to Kafka
    try:
        if kafka_service:
            event = Event(
                event_type=EventType.TASK_CREATED,
                user_id=current_user.id,
                entity_id=db_task.id,
                entity_data={
                    "title": db_task.title,
                    "description": db_task.description,
                    "status": db_task.status,
                    "due_date": db_task.due_date.isoformat() if db_task.due_date else None,
                    "priority": db_task.priority,
                    "category": db_task.category,
                    "recurrence_pattern": db_task.recurrence_pattern,
                    "recurrence_end_date": db_task.recurrence_end_date.isoformat() if db_task.recurrence_end_date else None,
                    "recurrence_interval": db_task.recurrence_interval,
                    "parent_task_id": db_task.parent_task_id,
                    "next_occurrence": db_task.next_occurrence.isoformat() if db_task.next_occurrence else None
                }
            )
            kafka_service.send_message("task_events", event.dict())
            logger.info(f"Published task created event for task ID: {db_task.id}")
    except Exception as e:
        logger.error(f"Failed to publish task created event: {e}")

    return db_task

@router.get("/{task_id}", response_model=schemas.Task)
def get_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific task by ID
    """
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a specific task by ID
    """
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Store original values for the event
    original_data = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "priority": task.priority,
        "category": task.category,
        "recurrence_pattern": task.recurrence_pattern,
        "recurrence_end_date": task.recurrence_end_date.isoformat() if task.recurrence_end_date else None,
        "recurrence_interval": task.recurrence_interval,
        "parent_task_id": task.parent_task_id,
        "next_occurrence": task.next_occurrence.isoformat() if task.next_occurrence else None
    }

    # Update task fields
    for field, value in task_update.dict(exclude_unset=True).items():
        setattr(task, field, value)

    # If the task is completed and has a recurrence pattern, create the next occurrence
    if (task_update.status == "completed" and task.recurrence_pattern and
        task.next_occurrence and not task.parent_task_id):  # Only for original recurring tasks
        next_occurrence = calculate_next_occurrence(
            current_date=task.next_occurrence,
            pattern=RecurrencePattern(task.recurrence_pattern),
            interval=task.recurrence_interval,
            end_date=task.recurrence_end_date
        )

        if next_occurrence:
            # Create the next occurrence task
            next_task_data = create_next_occurrence_task(
                original_task_data={
                    "title": task.title,
                    "description": task.description,
                    "status": "pending",
                    "due_date": next_occurrence,
                    "priority": task.priority,
                    "category": task.category,
                    "recurrence_pattern": task.recurrence_pattern,
                    "recurrence_end_date": task.recurrence_end_date,
                    "recurrence_interval": task.recurrence_interval,
                    "parent_task_id": task.id
                },
                next_occurrence_date=next_occurrence
            )

            next_task = models.Task(
                title=next_task_data["title"],
                description=next_task_data["description"],
                status=next_task_data["status"],
                user_id=task.user_id,
                due_date=next_task_data["due_date"],
                priority=next_task_data["priority"],
                category=next_task_data["category"],
                recurrence_pattern=next_task_data["recurrence_pattern"],
                recurrence_end_date=next_task_data["recurrence_end_date"],
                recurrence_interval=next_task_data["recurrence_interval"],
                parent_task_id=next_task_data["parent_task_id"]
            )

            db.add(next_task)
            db.commit()
            db.refresh(next_task)

            # Update the original task's next occurrence
            task.next_occurrence = next_occurrence
            db.commit()

            logger.info(f"Created next occurrence task {next_task.id} for recurring task {task.id}")

    # If due date is updated, reschedule notifications
    if task_update.due_date is not None:
        # Cancel existing due date notifications and schedule new ones
        notification_service.schedule_task_due_notifications(db, task, current_user.id)

    # If status is updated to completed, mark any related notifications as read
    if task_update.status == "completed":
        # Find and mark related notifications as read
        from .notifications.models import Notification, NotificationStatus
        related_notifications = db.query(Notification).filter(
            Notification.task_id == task.id,
            Notification.user_id == current_user.id
        ).all()

        for notification in related_notifications:
            if notification.status != NotificationStatus.READ:
                notification.status = NotificationStatus.READ
                notification.read_at = datetime.utcnow()

        db.commit()

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    # Publish task updated event to Kafka
    try:
        if kafka_service:
            event = Event(
                event_type=EventType.TASK_UPDATED,
                user_id=current_user.id,
                entity_id=task.id,
                entity_data={
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "priority": task.priority,
                    "category": task.category,
                    "recurrence_pattern": task.recurrence_pattern,
                    "recurrence_end_date": task.recurrence_end_date.isoformat() if task.recurrence_end_date else None,
                    "recurrence_interval": task.recurrence_interval,
                    "parent_task_id": task.parent_task_id,
                    "next_occurrence": task.next_occurrence.isoformat() if task.next_occurrence else None
                },
                metadata={
                    "previous_data": original_data
                }
            )
            kafka_service.send_message("task_events", event.dict())
            logger.info(f"Published task updated event for task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to publish task updated event: {e}")

    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific task by ID
    """
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Store task data for the event
    task_data = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "priority": task.priority,
        "category": task.category,
        "recurrence_pattern": task.recurrence_pattern,
        "recurrence_end_date": task.recurrence_end_date.isoformat() if task.recurrence_end_date else None,
        "recurrence_interval": task.recurrence_interval,
        "parent_task_id": task.parent_task_id,
        "next_occurrence": task.next_occurrence.isoformat() if task.next_occurrence else None
    }

    db.delete(task)
    db.commit()

    # Publish task deleted event to Kafka
    try:
        if kafka_service:
            event = Event(
                event_type=EventType.TASK_DELETED,
                user_id=current_user.id,
                entity_id=task.id,
                entity_data=task_data
            )
            kafka_service.send_message("task_events", event.dict())
            logger.info(f"Published task deleted event for task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to publish task deleted event: {e}")

    return {"message": "Task deleted successfully"}

# Endpoint to get recurring tasks
@router.get("/recurring/", response_model=List[schemas.Task])
def get_recurring_tasks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all recurring tasks for the current user
    """
    recurring_tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.recurrence_pattern.isnot(None)
    ).all()
    return recurring_tasks

# Advanced search endpoint
@router.get("/search/", response_model=List[schemas.Task])
def search_tasks(
    q: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    due_date_from: Optional[datetime] = None,
    due_date_to: Optional[datetime] = None,
    sort_by: Optional[str] = "created_at",  # created_at, due_date, priority
    sort_order: Optional[str] = "asc",  # asc, desc
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search tasks with advanced filtering and sorting
    """
    query = db.query(models.Task).filter(models.Task.user_id == current_user.id)

    # Apply text search
    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            models.Task.title.ilike(search_filter) |
            models.Task.description.ilike(search_filter)
        )

    # Apply filters
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if category:
        query = query.filter(models.Task.category == category)
    if due_date_from:
        query = query.filter(models.Task.due_date >= due_date_from)
    if due_date_to:
        query = query.filter(models.Task.due_date <= due_date_to)

    # Apply sorting
    if sort_by == "due_date":
        if sort_order == "desc":
            query = query.order_by(models.Task.due_date.desc())
        else:
            query = query.order_by(models.Task.due_date.asc())
    elif sort_by == "priority":
        if sort_order == "desc":
            query = query.order_by(models.Task.priority.desc())
        else:
            query = query.order_by(models.Task.priority.asc())
    elif sort_by == "created_at":
        if sort_order == "desc":
            query = query.order_by(models.Task.created_at.desc())
        else:
            query = query.order_by(models.Task.created_at.asc())

    tasks = query.offset(skip).limit(limit).all()
    return tasks

# Get task statistics
@router.get("/stats/")
def get_task_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get task statistics for the current user
    """
    from sqlalchemy import func

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

    return {
        "total": total_tasks,
        "completed": completed_tasks,
        "pending": pending_tasks,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "categories": [{"name": cat[0], "count": cat[1]} for cat in categories if cat[0]]
    }