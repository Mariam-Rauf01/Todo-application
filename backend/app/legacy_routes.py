"""
Legacy API routes for compatibility with React/Vite frontend
These routes maintain the same interface as the original Flask backend
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime
import logging

from . import models, schemas, database, auth

router = APIRouter()
logger = logging.getLogger(__name__)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def convert_task_to_legacy_format(task):
    """Convert a task model to the legacy format expected by the React app"""
    return {
        "id": str(task.id),
        "title": task.title,
        "completed": task.status == "completed",
        "created_at": task.created_at.isoformat() if task.created_at else None
    }

def convert_legacy_request_to_task_create(request_data):
    """Convert legacy request format to task creation format"""
    status_val = "completed" if request_data.get("completed", False) else "pending"
    
    return schemas.TaskCreate(
        title=request_data["title"],
        description=request_data.get("description"),
        status=status_val,
        due_date=request_data.get("due_date"),
        priority=request_data.get("priority", "medium"),
        category=request_data.get("category"),
        recurrence_pattern=request_data.get("recurrence_pattern"),
        recurrence_end_date=request_data.get("recurrence_end_date"),
        recurrence_interval=request_data.get("recurrence_interval", 1),
        parent_task_id=request_data.get("parent_task_id")
    )

@router.get("/", response_model=List[dict])
def get_tasks_legacy(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint for getting tasks in the format expected by React app
    """
    try:
        tasks = db.query(models.Task).filter(
            models.Task.user_id == current_user.id
        ).order_by(models.Task.created_at.desc()).all()
        
        return [convert_task_to_legacy_format(task) for task in tasks]
    except Exception as db_error:
        logger.warning(f"Database error in get_tasks_legacy: {db_error}. Returning empty list.")
        return []


@router.post("/", response_model=dict)
def create_task_legacy(
    task_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint for creating tasks in the format expected by React app
    """
    # Validate required fields
    if not task_data.get("title"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task title is required"
        )
    
    # Convert legacy format to internal format
    task_create = convert_legacy_request_to_task_create(task_data)
    
    # Create task
    db_task = models.Task(
        title=task_create.title,
        description=task_create.description,
        status=task_create.status,
        user_id=current_user.id,
        due_date=task_create.due_date,
        priority=task_create.priority,
        category=task_create.category,
        recurrence_pattern=task_create.recurrence_pattern,
        recurrence_end_date=task_create.recurrence_end_date,
        recurrence_interval=task_create.recurrence_interval,
        parent_task_id=task_create.parent_task_id
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return convert_task_to_legacy_format(db_task)


@router.put("/{task_id}", response_model=dict)
def update_task_legacy(
    task_id: str,
    task_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint for updating tasks in the format expected by React app
    """
    # Convert string ID to integer
    try:
        task_int_id = int(task_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task ID"
        )
    
    # Get the task
    task = db.query(models.Task).filter(
        models.Task.id == task_int_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Prepare update data
    update_data = {}
    
    # Handle title update
    if "title" in task_data:
        update_data["title"] = task_data["title"]
    
    # Handle completed status - convert boolean to status string
    if "completed" in task_data:
        update_data["status"] = "completed" if task_data["completed"] else "pending"

    # Update the task
    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    return convert_task_to_legacy_format(task)


@router.delete("/{task_id}")
def delete_task_legacy(
    task_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint for deleting tasks in the format expected by React app
    """
    # Convert string ID to integer
    try:
        task_int_id = int(task_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task ID"
        )
    
    # Get the task
    task = db.query(models.Task).filter(
        models.Task.id == task_int_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}