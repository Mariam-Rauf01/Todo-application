from enum import Enum
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel

class EventType(str, Enum):
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_DELETED = "task_deleted"
    USER_CREATED = "user_created"
    USER_LOGIN = "user_login"

class Event(BaseModel):
    event_type: EventType
    user_id: int
    entity_id: Optional[int] = None
    entity_data: Optional[dict] = None
    timestamp: datetime = datetime.utcnow()
    metadata: Optional[dict] = None