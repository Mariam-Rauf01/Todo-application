"""
AI Chatbot for TaskMate - Clean Implementation
Supports English and Roman Urdu for task management
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import re
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import requests

from . import models, schemas, database, auth

load_dotenv()

router = APIRouter()

# =============================================================================
# Request/Response Models
# =============================================================================

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    action: Optional[Dict[str, Any]] = None

# =============================================================================
# Gemini AI Integration
# =============================================================================

def is_gemini_configured() -> bool:
    """Check if Gemini API key is configured"""
    return bool(os.getenv("GEMINI_API_KEY"))

async def call_gemini_api(prompt: str, system_prompt: str = None) -> Optional[str]:
    """Call Gemini API to get AI response"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    contents = [{
        "role": "user",
        "parts": [{"text": f"System: {system_prompt}\n\nUser: {prompt}"}]
    }] if system_prompt else [{
        "role": "user",
        "parts": [{"text": prompt}]
    }]

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000,
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if result.get('candidates'):
                return result['candidates'][0]['content']['parts'][0]['text']
        return None
    except Exception:
        return None

# =============================================================================
# System Prompt for AI Assistant
# =============================================================================

SYSTEM_PROMPT = """You are TodoBot, a friendly AI task management assistant.

LANGUAGE STYLE:
- Respond in the same language as the user (English or Roman Urdu)
- Be conversational, friendly, and helpful
- Use emojis sparingly: 😊 ✅ 🎉 👍
- Keep responses short and clear

TASK ACTIONS YOU SUPPORT:
1. Create tasks: "Add task to buy groceries"
2. List tasks: "Show my tasks"
3. Complete tasks: "Mark task as done"
4. Delete tasks: "Delete task"
5. Update tasks: "Update task priority"

ROMAN URDU EXAMPLES:
- "Task banao: Kal doctor ke paas jana hai"
- "Mere tasks dikhao"
- "Task complete karo"

Always respond naturally. Only include JSON action blocks when actually creating/updating/deleting tasks."""

# =============================================================================
# Command Parser (Rule-based fallback)
# =============================================================================

def parse_command(message: str) -> Dict[str, Any]:
    """Parse user message to identify intent"""
    msg_lower = message.lower().strip()
    
    # Check for create task
    if any(pattern in msg_lower for pattern in ['add task', 'create task', 'task banao', 'naya task']):
        title_match = re.search(r'(?:add|create|banao|task)\s*[:\-]?\s*(.+?)(?:\s*$)', msg_lower)
        title = title_match.group(1).strip() if title_match else message
        return {"intent": "create", "title": title}
    
    # Check for list tasks
    if any(pattern in msg_lower for pattern in ['show tasks', 'list tasks', 'tasks dikhao', 'mere tasks']):
        return {"intent": "list"}
    
    # Check for complete task
    if any(pattern in msg_lower for pattern in ['complete', 'mark as done', 'task pura', 'ho gaya']):
        return {"intent": "complete"}
    
    # Check for delete task
    if any(pattern in msg_lower for pattern in ['delete', 'remove', 'hatao', 'khatam']):
        return {"intent": "delete"}
    
    return {"intent": "chat"}

# =============================================================================
# Helper Functions
# =============================================================================

def get_user_tasks(db, user_id: int, limit: int = 10) -> list:
    """Get user's recent tasks"""
    return db.query(models.Task).filter(
        models.Task.user_id == user_id
    ).order_by(models.Task.created_at.desc()).limit(limit).all()

def format_tasks_list(tasks: list) -> str:
    """Format tasks as a readable list"""
    if not tasks:
        return "No tasks found! 🎉"
    
    lines = []
    for task in tasks[:10]:
        status_icon = "✅" if task.status == "completed" else "⬜"
        priority_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(task.priority, "🟡")
        lines.append(f"{status_icon} {priority_icon} {task.title}")
    
    return "\n".join(lines)

# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """
    Main chat endpoint - handles all user messages
    """
    try:
        message = request.message.strip()
        parsed = parse_command(message)
        intent = parsed.get("intent", "chat")
        
        response_text = ""
        action_data = None
        
        # Handle different intents
        if intent == "create":
            title = parsed.get("title", "Untitled Task")
            if len(title) > 2:
                # Create task in database
                new_task = models.Task(
                    title=title,
                    description="",
                    status="pending",
                    priority="medium",
                    user_id=current_user.id
                )
                db.add(new_task)
                db.commit()
                db.refresh(new_task)
                
                # Friendly response
                if any(word in message.lower() for word in ['karo', 'banao', 'hai', 'mera']):
                    response_text = f"✅ Ho gaya! '{title}' task add kar diya!"
                else:
                    response_text = f"✅ Done! Added '{title}' to your tasks!"
                
                action_data = {"action": "add", "task_id": new_task.id}
            else:
                response_text = "Please provide a task name. Example: 'Add task to buy groceries'"
        
        elif intent == "list":
            tasks = get_user_tasks(db, current_user.id)
            tasks_text = format_tasks_list(tasks)
            
            if any(word in message.lower() for word in ['dikhao', 'mera', 'mere']):
                response_text = f"📋 Yeh rahe aapke tasks:\n\n{tasks_text}"
            else:
                response_text = f"📋 Your tasks:\n\n{tasks_text}"
        
        elif intent == "complete":
            # Find and complete the most recent pending task
            task = db.query(models.Task).filter(
                models.Task.user_id == current_user.id,
                models.Task.status == "pending"
            ).first()
            
            if task:
                task.status = "completed"
                db.commit()
                response_text = f"✅ Task '{task.title}' marked as completed!"
                action_data = {"action": "complete", "task_id": task.id}
            else:
                response_text = "No pending tasks to complete!"
        
        elif intent == "delete":
            # Find and delete the most recent task
            task = db.query(models.Task).filter(
                models.Task.user_id == current_user.id
            ).order_by(models.Task.created_at.desc()).first()
            
            if task:
                task_title = task.title
                db.delete(task)
                db.commit()
                response_text = f"🗑️ Task '{task_title}' deleted!"
                action_data = {"action": "delete", "task_id": task.id}
            else:
                response_text = "No tasks to delete!"
        
        else:
            # Use Gemini AI for general conversation
            if is_gemini_configured():
                user_tasks = get_user_tasks(db, current_user.id, 5)
                tasks_context = f"User has {len(user_tasks)} tasks"
                
                ai_response = await call_gemini_api(
                    f"User said: {message}. Context: {tasks_context}. Respond naturally.",
                    SYSTEM_PROMPT
                )
                response_text = ai_response if ai_response else "Hey! I can help you manage tasks. Try: 'Add task to buy groceries' or 'Show my tasks' 😊"
            else:
                response_text = "Hey! I can help you manage tasks. Try: 'Add task to buy groceries' or 'Show my tasks' 😊"
        
        # Save messages to database
        try:
            user_msg = models.ChatMessage(
                user_id=current_user.id,
                message=message,
                sender="user"
            )
            db.add(user_msg)
            
            bot_msg = models.ChatMessage(
                user_id=current_user.id,
                message=response_text,
                sender="bot"
            )
            db.add(bot_msg)
            
            db.commit()
        except Exception:
            db.rollback()
        
        return ChatResponse(response=response_text, action=action_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages")
async def get_messages(
    limit: int = 50,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """Get chat history for user"""
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.asc()).limit(limit).all()

@router.post("/messages")
async def save_message(
    data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """Save chat message (legacy endpoint)"""
    return {"status": "ok"}

@router.delete("/messages")
async def clear_messages(
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """Clear chat history"""
    db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "Chat cleared"}

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """Delete single message"""
    msg = db.query(models.ChatMessage).filter(
        models.ChatMessage.id == message_id,
        models.ChatMessage.user_id == current_user.id
    ).first()
    
    if msg:
        db.delete(msg)
        db.commit()
        return {"message": "Deleted"}
    
    raise HTTPException(status_code=404, detail="Not found")
