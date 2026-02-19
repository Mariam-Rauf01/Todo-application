from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .models import NotificationType, NotificationStatus

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: NotificationType
    task_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    status: NotificationStatus
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True