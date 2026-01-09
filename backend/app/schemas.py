from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"
    due_date: Optional[datetime] = None
    priority: str = "medium"
    category: Optional[str] = None
    recurrence_pattern: Optional[str] = None  # daily, weekly, monthly, yearly
    recurrence_end_date: Optional[datetime] = None
    recurrence_interval: Optional[int] = 1
    parent_task_id: Optional[int] = None
    next_occurrence: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    status: Optional[str] = None

class Task(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None