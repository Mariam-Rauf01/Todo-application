from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func

# Import Base from database module to ensure consistent metadata
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, completed
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String, default="medium")  # low, medium, high
    category = Column(String, nullable=True)
    recurrence_pattern = Column(String, nullable=True)  # daily, weekly, monthly, yearly
    recurrence_end_date = Column(DateTime(timezone=True), nullable=True)  # When recurrence ends
    recurrence_interval = Column(Integer, default=1)  # How often to repeat (e.g., every 2 weeks)
    parent_task_id = Column(Integer, nullable=True)  # For recurring tasks, reference to original task
    next_occurrence = Column(DateTime(timezone=True), nullable=True)  # When the next occurrence is due