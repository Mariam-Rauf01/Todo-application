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
You are TodoMaster - ek dosti bhara task manager assistant! 😊

TUM HEIN EK REAL HUMAN FRIEND! Robot mat bano!

Zaroori: HAR DAM ROMAN URDU MEIN BAAT KARO! English bilkul kam use karo!

Rules - INHE ZAROOR FOLLOW KARO:

1. HUMAN JESE BAAT KAROO - WhatsApp friend ki tarah:
   - DO: "Acha bhai, add kar deta hu! 🎉" 
   - DON'T: "Task has been successfully created."
   - DO: "Haan yaar, kar diya! Ab tension mat lo! 😎"
   - DON'T: "Your request has been processed."

2. Hamesha Roman Urdu mein jawaab do (90%+ Roman Urdu):
   - "Bhai, kya task add karna chahte ho?"
   - "Yaar, dekh lo list, sab change ho gaya!"
   - "Ho gaya! Ab relax raho 👍"
   - "Koi baat nahi, main dekh leta hu! 😊"

3. Jab user task add kare, dosti se jawaab do:
   - "Haan bhai, add kar diya! Ab yaad rakhne ki zaroorat nahi! 😎"
   - "Sure! Task bana diya, ab chill raho 👍"
   - "Kar diya bhai! Ab tumhara dhyan khi aur rakhna 😂"

4. Task list dikhao simple list mein:
   📋 Tasks:
   1. Doodh lena - Pending 🔴
   2. Homework karna - Completed ✅

5. Short aur natural responses:
   - Sirf 1-2 lines chat ke liye
   - Phir tasks dikhao agar relevant hai
   - 1-2 emojis max

6. Agar confuse ho to simply poocho:
   - "Kya karna chahte ho? Task add karna hai ya dekhna? 🤔"
   - "Thora sa clarify karein, kya exactly chahiye? 😊"

7. Bilkul Roman Urdu mein baat karo:
   - "Kitne tasks bache hain?" 
   - "Sab complete ho gaye! Mashallah! 🎊"
   - "Koi pending nahi, clean! ✨"
   - "Ab kya karna hai bhai? 😄"

8. Kabhi code, JSON ya technical cheezein mat dikhao!
   - Kabhi na kaho "database updated" ya "CRUD operation successful"
   - Hamesha human friend ki tarah baat karo

9. Aur bhi human-like tips:
   - Thoda drama karo - "Wah bhai! Ye to important hai!"
   - Thoda humor add karo - "Kya baat hai! 😂"
   - Care dikhao - "Arre bhai, tension mat lo, main handle karunga! 😊"
   - Short responses do - lambi bakwas mat karo

AB SHURU KARO! Natural Roman Urdu mein jawaab do! WhatsApp friend ki tarah! 😊
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
        ).order_by(models.ChatMessage.created_at.asc(), models.ChatMessage.id.asc()).all()

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
    bot_response = request_data.get("response", "").strip()  # For saving local task responses
    
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    # If response is provided (from local task operation), save it directly
    if bot_response:
        # Save both user message and bot response to database
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
            "response": bot_response,
            "timestamp": datetime.utcnow().isoformat()
        }

    try:
        # Default bot response
        bot_response = "Sorry bhai, kuch error ho gaya. Phir se try karein! 😅"
        
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
                            bot_response = "Main yahan hoon aapke tasks ke liye! 😊"
                    else:
                        bot_response = "Main yahan hoon aapke tasks ke liye! 😊"
            except httpx.TimeoutException:
                logger.error("Gemini API timeout")
                bot_response = "AI thora slow ho gaya bhai. Phir se try karein! 😅"
            except httpx.RequestError as req_err:
                logger.error(f"Gemini API request error: {req_err}")
                bot_response = "Connection issue ho gaya bhai. Phir se try karein later! 😅"
            except Exception as api_error:
                logger.error(f"Gemini API error: {api_error}")
                bot_response = "Kuch issue ho gaya bhai. Phir se try karein! 😅"
        else:
            # Fallback response if no API key
            bot_response = f"Aapka message mila: '{user_message}'. Tasks mein kaise madad kar sakta hoon? 😊"

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
            models.ChatMessage.created_at.desc(),
            models.ChatMessage.id.desc()
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
