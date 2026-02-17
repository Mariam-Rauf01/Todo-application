#!/usr/bin/env python
"""
Minimal server for testing chatbot features
Only requires fastapi and uvicorn
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

app = FastAPI(title="AI Chatbot Test Server")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
users = {}
tasks = {}
user_id_counter = 1
task_id_counter = 1

class User:
    def __init__(self, id: int, email: str, hashed_password: str, full_name: str):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.full_name = full_name
        self.is_active = True

# Auth endpoints
@app.post("/api/auth/signup")
def signup(email: str, password: str, full_name: str):
    global user_id_counter
    user = User(user_id_counter, email, password, full_name)
    users[email] = user
    user_id_counter += 1
    return {"message": "User created", "email": email}

@app.post("/api/auth/login")
def login(email: str, password: str):
    user = users.get(email)
    if not user or user.hashed_password != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": f"token_{email}", "token_type": "bearer", "email": email}

def get_current_user(email: str = "test@test.com"):
    user = users.get(email)
    if not user:
        # Create a test user if none exists
        global user_id_counter
        user = User(user_id_counter, email, "password", "Test User")
        users[email] = user
        user_id_counter += 1
    return user

# Task endpoints
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "pending"
    priority: str = "medium"
    user_id: int = 1

@app.post("/api/tasks/")
def create_task(task: TaskCreate):
    global task_id_counter
    new_task = {
        "id": task_id_counter,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "user_id": task.user_id,
        "created_at": datetime.utcnow().isoformat()
    }
    tasks[task_id_counter] = new_task
    task_id_counter += 1
    return new_task

@app.get("/api/tasks/")
def get_tasks(user_id: int = 1):
    return [t for t in tasks.values() if t["user_id"] == user_id]

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    if task_id in tasks:
        del tasks[task_id]
        return {"message": "Task deleted"}
    raise HTTPException(status_code=404, detail="Task not found")

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, title: str = None, status: str = None):
    if task_id in tasks:
        if title:
            tasks[task_id]["title"] = title
        if status:
            tasks[task_id]["status"] = status
        return tasks[task_id]
    raise HTTPException(status_code=404, detail="Task not found")

# Chatbot endpoint
class ChatRequest(BaseModel):
    message: str

@app.post("/api/chatbot/chat")
def chat(request: ChatRequest, user = Depends(get_current_user)):
    message = request.message.lower()
    
    # Who am I?
    if "who am i" in message or "my email" in message:
        return {"response": f"👤 You are logged in as: {user.email}"}
    
    # List tasks
    if "show" in message or "list" in message or "what" in message and "task" in message:
        user_tasks = [t for t in tasks.values() if t["user_id"] == user.id]
        if not user_tasks:
            return {"response": "You have no tasks yet!"}
        task_list = "\n".join([f"• {t['title']} ({t['status']})" for t in user_tasks])
        return {"response": f"📋 Your tasks:\n{task_list}"}
    
    # Create task
    if "create" in message or "add" in message or "new" in message:
        # Extract title
        import re
        match = re.search(r"(?:create|add|new)[:\s]+(.+)", message)
        if match:
            title = match.group(1).strip()
            global task_id_counter
            new_task = {
                "id": task_id_counter,
                "title": title,
                "description": "",
                "status": "pending",
                "priority": "medium",
                "user_id": user.id,
                "created_at": datetime.utcnow().isoformat()
            }
            tasks[task_id_counter] = new_task
            task_id_counter += 1
            return {"response": f"✅ Task created: '{title}'"}
        return {"response": "What task would you like to create?"}
    
    # Delete task
    if "delete" in message or "remove" in message:
        import re
        match = re.search(r"(?:delete|remove)[:\s]+(.+)", message)
        if match:
            title = match.group(1).strip()
            for tid, t in tasks.items():
                if t["user_id"] == user.id and title in t["title"].lower():
                    del tasks[tid]
                    return {"response": f"✅ Task '{t['title']}' deleted"}
            return {"response": f"❌ Task '{title}' not found"}
        return {"response": "Which task would you like to delete?"}
    
    # Default response
    return {"response": "I can help you:\n• Create tasks: 'create task: Buy groceries'\n• List tasks: 'show tasks'\n• Delete tasks: 'delete task: Buy groceries'\n• Who am I?: 'Who am I?'"}

@app.get("/")
def root():
    return {"message": "AI Chatbot Test Server - Go to /docs for API docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
