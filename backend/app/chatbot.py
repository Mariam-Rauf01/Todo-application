"""
Chatbot routes for AI Task Assistant
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging
import httpx
import os

from . import models, schemas, database, auth

router = APIRouter()
logger = logging.getLogger(__name__)

# TodoMaster System Prompt - for floating chatbot
TODOMASTER_SYSTEM_PROMPT = """
You are TodoMaster – your friendly task manager buddy! 😊

Bas ek simple sa mission hai: Help users manage their tasks naturally, just like a friend would help another friend. 

IMPORTANT: Behave like a REAL HUMAN, not a robot! 

Rules - READ CAREFULLY:

1. TALK NATURALLY - Like you're chatting with a friend on WhatsApp. Short sentences, casual tone.
   - DO: "Acha, main add kar deta hu! 🎉" 
   - DON'T: "Task has been successfully created."

2. Use mix of English and Roman Urdu naturally:
   - "Bhai, kya task add karna chahte ho?"
   - "Yaar, list to dekho, sab change ho gaya!"
   - "Done! Ab taklifein nahi hongi 😊"

3. When user adds a task, respond like a helpful friend:
   - "Haan bhai, add kar diya! Ab yaad rakhne ki zaroorat nahi! 😎"
   - "Sure! Task bana diya, ab relax raho 👍"

4. Show task list as a SIMPLE list, not a complex table:
   Use this friendly format:
   📋 Tasks:
   1. Buy groceries - Pending 🔴
   2. Finish homework - Completed ✅

5. For responses, keep it SHORT and CONVERSATIONAL:
   - 1-2 lines max for chat
   - Then show tasks if relevant
   - Add 1-2 emojis max

6. If confused, ask simply:
   - "Kya karna chahte ho? Task add karna hai ya dekhna? 🤔"

7. Handle everything in Roman Urdu + English mix:
   - "Kitne tasks bache hain?" 
   - "Sab complete ho gaye! Great job! 🎊"
   - "Koi pending nahi, clean! ✨"

8. IMPORTANT: Never show code, JSON, or technical stuff!
   - Never say "database updated" or "CRUD operation successful"
   - Always speak like a human friend

Start now! Reply naturally like a friendly WhatsApp buddy would 😊
"""

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/messages")
def get_chat_messages(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all chat messages for the current user
    """
    try:
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == current_user.id
        ).order_by(models.ChatMessage.created_at.asc()).all()

        return [
            {
                "id": msg.id,
                "message": msg.message,
                "response": msg.response,
                "sender": msg.sender,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in messages
        ]
    except Exception as e:
        logger.error(f"Error fetching chat messages: {e}")
        return []


@router.delete("/messages")
def delete_chat_messages(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete all chat messages for the current user (clear chat history)
    """
    try:
        db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == current_user.id
        ).delete()
        db.commit()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.error(f"Error deleting chat messages: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear chat history"
        )


@router.post("/chat")
def chat_with_bot(
    request_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI chatbot and get a response
    """
    user_message = request_data.get("message", "").strip()
    
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    try:
        # Default bot response
        bot_response = "I'm sorry, I couldn't process your request at the moment."
        
        # Call Gemini API for AI response
        if GEMINI_API_KEY:
            try:
                # Get recent conversation context (last 10 messages)
                recent_messages = db.query(models.ChatMessage).filter(
                    models.ChatMessage.user_id == current_user.id
                ).order_by(models.ChatMessage.created_at.desc()).limit(10).all()
                
                # Build conversation history for context
                conversation_history = []
                for msg in reversed(recent_messages):
                    if msg.message:
                        conversation_history.append(f"User: {msg.message}")
                    if msg.response:
                        conversation_history.append(f"Assistant: {msg.response}")
                
                # Add current message
                conversation_history.append(f"User: {user_message}")
                
                # Create prompt with context
                prompt = "\n".join(conversation_history)
                
                payload = {
                    "contents": [{
                        "parts": [{
                            "text": f"""{TODOMASTER_SYSTEM_PROMPT}

---
Current conversation history:
{prompt}

---
Remember: Always respond as TodoMaster following the system prompt above. Save all messages to database."""
                        }]
                    }]
                }
                
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(GEMINI_API_URL, json=payload)
                    response.raise_for_status()
                    result = response.json()
                    
                    if "candidates" in result and len(result["candidates"]) > 0:
                        content_parts = result["candidates"][0]["content"]["parts"]
                        if content_parts and len(content_parts) > 0:
                            bot_response = content_parts[0]["text"]
                        else:
                            bot_response = "I'm here to help you with your tasks!"
                    else:
                        bot_response = "I'm here to help you with your tasks!"
            except httpx.TimeoutException:
                logger.error("Gemini API timeout")
                bot_response = "The AI service is taking too long to respond. Please try again."
            except httpx.RequestError as req_err:
                logger.error(f"Gemini API request error: {req_err}")
                bot_response = "I'm having trouble connecting to the AI service. Please try again later."
            except Exception as api_error:
                logger.error(f"Gemini API error: {api_error}")
                bot_response = "I'm having trouble connecting to the AI service. Please try again later."
        else:
            # Fallback response if no API key
            bot_response = f"I received your message: '{user_message}'. How can I help you with your tasks today?"

        # Save both user message and bot response to database in a single transaction
        user_msg = models.ChatMessage(
            user_id=current_user.id,
            message=user_message,
            sender="user"
        )
        db.add(user_msg)
        
        bot_msg = models.ChatMessage(
            user_id=current_user.id,
            message=user_message,
            response=bot_response,
            sender="bot"
        )
        db.add(bot_msg)
        db.commit()

        return {
            "user_message": user_message,
            "bot_response": bot_response,
            "response": bot_response,  # For frontend compatibility
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@router.get("/history")
def get_chat_history(
    limit: int = 50,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat history with pagination
    """
    try:
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.user_id == current_user.id
        ).order_by(
            models.ChatMessage.created_at.desc()
        ).limit(limit).all()

        return [
            {
                "id": msg.id,
                "message": msg.message,
                "response": msg.response,
                "sender": msg.sender,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in messages
        ]
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        return []
