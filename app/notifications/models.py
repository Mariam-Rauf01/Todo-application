from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class NotificationType(str, Enum):
    TASK_DUE = "task_due"
    TASK_OVERDUE = "task_overdue"
    TASK_ASSIGNED = "task_assigned"
    SYSTEM_MESSAGE = "system_message"
    RECURRING_TASK = "recurring_task"

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Will be foreign key reference
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=False)  # NotificationType
    status = Column(String, default="unread")  # NotificationStatus
    task_id = Column(Integer, nullable=True)  # Optional reference to a task
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)  # When to send the notification