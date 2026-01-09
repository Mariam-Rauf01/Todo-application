from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import logging
from .models import Notification, NotificationStatus
from .schemas import NotificationCreate, NotificationUpdate

logger = logging.getLogger(__name__)

def create_notification(db: Session, notification: NotificationCreate, user_id: int):
    """Create a new notification"""
    db_notification = Notification(
        user_id=user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        task_id=notification.task_id,
        scheduled_at=notification.scheduled_at
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    logger.info(f"Created notification {db_notification.id} for user {user_id}")
    return db_notification

def get_user_notifications(
    db: Session, 
    user_id: int, 
    status: NotificationStatus = None, 
    limit: int = 50,
    skip: int = 0
) -> List[Notification]:
    """Get notifications for a user with optional filtering"""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if status:
        query = query.filter(Notification.status == status)
    
    # Order by creation date, newest first
    query = query.order_by(Notification.created_at.desc())
    
    notifications = query.offset(skip).limit(limit).all()
    return notifications

def mark_notification_as_read(db: Session, notification_id: int, user_id: int):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification and notification.status != NotificationStatus.READ:
        notification.status = NotificationStatus.READ
        notification.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notification)
        logger.info(f"Marked notification {notification_id} as read")
    
    return notification

def mark_all_notifications_as_read(db: Session, user_id: int):
    """Mark all user notifications as read"""
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status != NotificationStatus.READ
    ).all()
    
    for notification in notifications:
        notification.status = NotificationStatus.READ
        notification.read_at = datetime.utcnow()
    
    db.commit()
    logger.info(f"Marked all {len(notifications)} notifications as read for user {user_id}")

def delete_notification(db: Session, notification_id: int, user_id: int):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        logger.info(f"Deleted notification {notification_id}")
        return True
    
    return False

def get_unread_notification_count(db: Session, user_id: int) -> int:
    """Get the count of unread notifications for a user"""
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status == NotificationStatus.UNREAD
    ).count()
    
    return count

def schedule_task_due_notifications(db: Session, task, user_id: int):
    """Schedule notifications for task due dates"""
    if not task.due_date:
        return
    
    # Schedule a notification 24 hours before due date
    notification_time = task.due_date - timedelta(hours=24)
    
    if notification_time > datetime.utcnow():
        notification = NotificationCreate(
            title="Task Due Soon",
            message=f"Your task '{task.title}' is due tomorrow.",
            notification_type="task_due",
            task_id=task.id,
            scheduled_at=notification_time
        )
        create_notification(db, notification, user_id)
        logger.info(f"Scheduled due date notification for task {task.id}")

def schedule_overdue_notifications(db: Session, task, user_id: int):
    """Schedule notifications for overdue tasks"""
    if not task.due_date or task.status == "completed":
        return
    
    if datetime.utcnow() > task.due_date:
        notification = NotificationCreate(
            title="Task Overdue",
            message=f"Your task '{task.title}' is overdue.",
            notification_type="task_overdue",
            task_id=task.id
        )
        create_notification(db, notification, user_id)
        logger.info(f"Scheduled overdue notification for task {task.id}")