from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing import Annotated, Optional
from datetime import datetime

# =============================================================================
# USER SCHEMAS - Pydantic v2 Best Practices
# =============================================================================

class UserCreate(BaseModel):
    """
    User registration schema with Pydantic v2 validation.
    
    Uses Annotated + Field + StringConstraints for strict validation.
    """
    full_name: Annotated[
        str, 
        StringConstraints(min_length=2, max_length=100, strip_whitespace=True)
    ] = Field(
        ..., 
        description="User's full name (2-100 characters)"
    )
    
    email: EmailStr = Field(
        ..., 
        description="User's email address (must be valid email format)"
    )
    
    password: Annotated[
        str,
        StringConstraints(min_length=8)
    ] = Field(
        ...,
        description="Password (minimum 8 characters, longer passwords are automatically hashed with SHA256 for bcrypt compatibility)"
    )
    
    username: Optional[
        Annotated[
            str, 
            StringConstraints(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
        ]
    ] = Field(
        default=None, 
        description="Optional username (3-50 chars, alphanumeric + underscore only)"
    )


# Legacy User Schemas (kept for backward compatibility)
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreateLegacy(UserBase):
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

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    recurrence_pattern: Optional[str] = None  # daily, weekly, monthly, yearly
    recurrence_end_date: Optional[datetime] = None
    recurrence_interval: Optional[int] = None
    parent_task_id: Optional[int] = None
    next_occurrence: Optional[datetime] = None

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

# Login Response with User Info
class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    email: str
    full_name: str
    user_id: int

class TokenData(BaseModel):
    email: Optional[str] = None

# Chat Message Schemas
class ChatMessageCreate(BaseModel):
    message: str
    response: Optional[str] = None
    sender: str = "user"

class ChatMessage(BaseModel):
    id: int
    user_id: int
    message: str
    response: Optional[str] = None
    sender: str
    created_at: datetime

    class Config:
        from_attributes = True

