# Simple in-memory database for quick testing
# This avoids needing to install SQLAlchemy and other dependencies

from typing import Optional, List
from datetime import datetime
import uuid

# In-memory storage
users_db = {}
tasks_db = {}

class User:
    def __init__(self, id: int, email: str, hashed_password: str, full_name: str):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.full_name = full_name
        self.is_active = True

class Task:
    def __init__(self, id: int, title: str, description: str, status: str, 
                 user_id: int, priority: str = "medium", category: str = None, 
                 due_date: datetime = None):
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.user_id = user_id
        self.priority = priority
        self.category = category
        self.due_date = due_date
        self.created_at = datetime.utcnow()

def get_user_by_email(email: str) -> Optional[User]:
    for user in users_db.values():
        if user.email == email:
            return user
    return None

def get_user_by_id(user_id: int) -> Optional[User]:
    return users_db.get(user_id)

def create_user(email: str, hashed_password: str, full_name: str) -> User:
    user_id = len(users_db) + 1
    user = User(user_id, email, hashed_password, full_name)
    users_db[user_id] = user
    return user

def get_tasks_for_user(user_id: int) -> List[Task]:
    return [task for task in tasks_db.values() if task.user_id == user_id]

def create_task(title: str, description: str, user_id: int, 
               priority: str = "medium", category: str = None, 
               due_date: datetime = None) -> Task:
    task_id = len(tasks_db) + 1
    task = Task(task_id, title, description, "pending", user_id, priority, category, due_date)
    tasks_db[task_id] = task
    return task

def get_task_by_id(task_id: int) -> Optional[Task]:
    return tasks_db.get(task_id)

def delete_task(task_id: int) -> bool:
    if task_id in tasks_db:
        del tasks_db[task_id]
        return True
    return False

def update_task(task_id: int, **kwargs) -> Optional[Task]:
    task = tasks_db.get(task_id)
    if task:
        for key, value in kwargs.items():
            if hasattr(task, key):
                setattr(task, key, value)
        return task
    return None
