"""
AI Chatbot for TaskMate - Fresh Implementation
Simple, clean, and reliable task management via chat
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import re
from datetime import datetime
import os
from dotenv import load_dotenv
import requests

from . import models, database, auth

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    action: Optional[Dict[str, Any]] = None

def is_gemini_configured() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))

async def call_gemini_api(prompt: str) -> Optional[str]:
    """Call Gemini API for AI responses"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000}
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

def parse_intent(message: str) -> Dict[str, Any]:
    """Parse user message to identify intent"""
    msg = message.lower().strip()
    
    # Create task patterns
    create_keywords = ['add task', 'create task', 'new task', 'task banao', 'add karo', 'banao']
    if any(kw in msg for kw in create_keywords):
        # Extract task title
        title = re.sub(r'(add|create|new|task|banao|karo|mera|ek|to)\s*', '', msg, flags=re.IGNORECASE).strip()
        title = re.sub(r'^[:\-]\s*', '', title).strip()
        return {"intent": "create", "title": title if len(title) > 2 else None}
    
    # List tasks patterns
    list_keywords = ['show tasks', 'list tasks', 'my tasks', 'tasks dikhao', 'mere tasks', 'kya tasks']
    if any(kw in msg for kw in list_keywords):
        return {"intent": "list"}
    
    # Complete task patterns
    complete_keywords = ['complete', 'mark done', 'done', 'pura', 'ho gaya']
    if any(kw in msg for kw in complete_keywords):
        task_name = re.sub(r'(complete|mark|done|task)\s*', '', msg, flags=re.IGNORECASE).strip()
        return {"intent": "complete", "task_name": task_name if len(task_name) > 2 else None}
    
    # Delete task patterns
    delete_keywords = ['delete', 'remove', 'hatao', 'mita']
    if any(kw in msg for kw in delete_keywords):
        task_name = re.sub(r'(delete|remove|task)\s*', '', msg, flags=re.IGNORECASE).strip()
        return {"intent": "delete", "task_name": task_name if len(task_name) > 2 else None}
    
    return {"intent": "chat"}

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """Main chat endpoint"""
    try:
        message = request.message.strip()
        parsed = parse_intent(message)
        intent = parsed.get("intent", "chat")
        
        response_text = ""
        action_data = None
        
        if intent == "create":
            title = parsed.get("title")
            if title:
                try:
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
                    
                    if any(w in message.lower() for w in ['karo', 'banao', 'hai', 'mera']):
                        response_text = f"✅ Ho gaya! '{title}' task add kar diya!"
                    else:
                        response_text = f"✅ Done! Added '{title}' to your tasks!"
                    
                    action_data = {"action": "add", "task_id": new_task.id}
                except Exception as e:
                    db.rollback()
                    response_text = "❌ Error creating task. Please try again."
            else:
                response_text = "Please provide a task name. Example: 'Add task to buy groceries'"
        
        elif intent == "list":
            tasks = db.query(models.Task).filter(
                models.Task.user_id == current_user.id
            ).order_by(models.Task.created_at.desc()).limit(10).all()
            
            if tasks:
                task_list = "\n".join([
                    f"{'✅' if t.status == 'completed' else '⬜'} {t.title}" 
                    for t in tasks
                ])
                if any(w in message.lower() for w in ['dikhao', 'mera', 'mere']):
                    response_text = f"📋 Yeh rahe aapke tasks:\n\n{task_list}"
                else:
                    response_text = f"📋 Your tasks:\n\n{task_list}"
            else:
                response_text = "🎉 No tasks yet! Create your first task."
        
        elif intent == "complete":
            task_name = parsed.get("task_name")
            if task_name:
                task = db.query(models.Task).filter(
                    models.Task.user_id == current_user.id,
                    models.Task.title.ilike(f"%{task_name}%")
                ).first()
                
                if task:
                    task.status = "completed"
                    db.commit()
                    response_text = f"✅ Task '{task.title}' marked as completed!"
                    action_data = {"action": "complete", "task_id": task.id}
                else:
                    response_text = f"❌ Task '{task_name}' not found."
            else:
                task = db.query(models.Task).filter(
                    models.Task.user_id == current_user.id,
                    models.Task.status == "pending"
                ).order_by(models.Task.created_at.desc()).first()
                
                if task:
                    task.status = "completed"
                    db.commit()
                    response_text = f"✅ Task '{task.title}' marked as completed!"
                    action_data = {"action": "complete", "task_id": task.id}
                else:
                    response_text = "🎉 No pending tasks!"
        
        elif intent == "delete":
            task_name = parsed.get("task_name")
            if task_name:
                task = db.query(models.Task).filter(
                    models.Task.user_id == current_user.id,
                    models.Task.title.ilike(f"%{task_name}%")
                ).first()
                
                if task:
                    db.delete(task)
                    db.commit()
                    response_text = f"🗑️ Task '{task.title}' deleted!"
                    action_data = {"action": "delete", "task_id": task.id}
                else:
                    response_text = f"❌ Task '{task_name}' not found."
            else:
                task = db.query(models.Task).filter(
                    models.Task.user_id == current_user.id
                ).order_by(models.Task.created_at.desc()).first()
                
                if task:
                    db.delete(task)
                    db.commit()
                    response_text = f"🗑️ Task '{task.title}' deleted!"
                    action_data = {"action": "delete", "task_id": task.id}
                else:
                    response_text = "🎉 No tasks to delete!"
        
        else:
            # AI conversation
            if is_gemini_configured():
                ai_response = await call_gemini_api(
                    f"You are TodoBot, a friendly task management assistant. User said: {message}. Respond naturally in English or Roman Urdu."
                )
                response_text = ai_response if ai_response else "Hey! I can help with tasks. Try: 'Add task to buy groceries' 😊"
            else:
                response_text = "Hey! I can help with tasks. Try: 'Add task to buy groceries' or 'Show my tasks' 😊"
        
        # Save chat history
        try:
            db.add(models.ChatMessage(user_id=current_user.id, message=message, sender="user"))
            db.add(models.ChatMessage(user_id=current_user.id, message=response_text, sender="bot"))
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
    """Get chat history"""
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.asc()).limit(limit).all()

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
