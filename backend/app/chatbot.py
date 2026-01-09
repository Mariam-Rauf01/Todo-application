from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import re
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import openai
import json

from . import models, schemas, database, auth

load_dotenv()

router = APIRouter()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    action: Optional[Dict[str, Any]] = None

def parse_natural_language_command(message: str) -> Dict[str, Any]:
    """
    Parse natural language command to identify intent and extract entities
    """
    message_lower = message.lower().strip()

    # Define patterns for different intents
    create_patterns = [
        r"create.*task.*to\s+(.+?)(?:\s+with\s+description\s+(.+?))?(?:\s+due\s+(.+?))?(?:\s+with\s+priority\s+(.+?))?(?:\s+in\s+category\s+(.+?))?(?=\s|$)",
        r"add.*task.*to\s+(.+?)(?:\s+with\s+description\s+(.+?))?(?:\s+due\s+(.+?))?(?:\s+with\s+priority\s+(.+?))?(?:\s+in\s+category\s+(.+?))?(?=\s|$)",
        r"make.*task.*to\s+(.+?)(?:\s+with\s+description\s+(.+?))?(?:\s+due\s+(.+?))?(?:\s+with\s+priority\s+(.+?))?(?:\s+in\s+category\s+(.+?))?(?=\s|$)",
    ]

    update_patterns = [
        r"update.*task.*(.+?)\s+to\s+(.+)",
        r"change.*task.*(.+?)\s+to\s+(.+)",
        r"mark.*task.*(.+?)\s+as\s+(.+)",
        r"set.*priority.*of.*task.*(.+?)\s+to\s+(.+)",
        r"update.*due\s+date.*of.*task.*(.+?)\s+to\s+(.+)",
    ]

    delete_patterns = [
        r"delete.*task.*(.+)",
        r"remove.*task.*(.+)",
        r"cancel.*task.*(.+)",
        r"complete.*task.*(.+)",
    ]

    list_patterns = [
        r"show.*tasks?",
        r"list.*tasks?",
        r"what.*tasks?",
        r"view.*tasks?",
        r"show.*my.*tasks",
        r"what.*do.*i.*have.*to.*do",
    ]

    # Priority patterns
    priority_patterns = {
        "high": [r"high", r"urgent", r"asap", r"important"],
        "medium": [r"medium", r"normal"],
        "low": [r"low", r"not.*urgent", r"whenever"]
    }

    # Check for create intent
    for pattern in create_patterns:
        match = re.search(pattern, message_lower)
        if match:
            title = match.group(1).strip()
            description = match.group(2).strip() if match.group(2) else None
            due_date_str = match.group(3).strip() if match.group(3) else None
            priority_str = match.group(4).strip() if match.group(4) else None
            category = match.group(5).strip() if match.group(5) else None

            # Parse due date if provided
            due_date = None
            if due_date_str:
                # Simple date parsing (could be enhanced)
                if "tomorrow" in due_date_str:
                    due_date = datetime.utcnow() + timedelta(days=1)
                elif "today" in due_date_str or "now" in due_date_str:
                    due_date = datetime.utcnow()
                elif "next week" in due_date_str:
                    due_date = datetime.utcnow() + timedelta(weeks=1)
                elif "next month" in due_date_str:
                    due_date = datetime.utcnow() + timedelta(days=30)
                else:
                    # Try to parse as YYYY-MM-DD format
                    try:
                        due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
                    except ValueError:
                        # Try other common formats
                        for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y"):
                            try:
                                due_date = datetime.strptime(due_date_str, fmt)
                                break
                            except ValueError:
                                continue

            # Determine priority
            priority = "medium"  # default
            if priority_str:
                priority = priority_str
            else:
                # Try to infer priority from the message
                for p, patterns in priority_patterns.items():
                    for ptn in patterns:
                        if re.search(ptn, message_lower):
                            priority = p
                            break
                    if priority != "medium":
                        break

            return {
                "intent": "create_task",
                "params": {
                    "title": title,
                    "description": description,
                    "due_date": due_date,
                    "priority": priority,
                    "category": category
                }
            }

    # Check for update intent
    for pattern in update_patterns:
        match = re.search(pattern, message_lower)
        if match:
            task_identifier = match.group(1).strip()
            new_value = match.group(2).strip() if len(match.groups()) > 1 else None

            # Determine update type based on the pattern
            if "priority" in message_lower:
                update_type = "priority"
            elif "due" in message_lower:
                update_type = "due_date"
            elif "as completed" in message_lower or "complete" in message_lower:
                update_type = "status"
                new_value = "completed"
            else:
                update_type = "other"

            return {
                "intent": "update_task",
                "params": {
                    "task_identifier": task_identifier,
                    "new_value": new_value,
                    "update_type": update_type
                }
            }

    # Check for delete intent
    for pattern in delete_patterns:
        match = re.search(pattern, message_lower)
        if match:
            task_identifier = match.group(1).strip()
            return {
                "intent": "delete_task",
                "params": {
                    "task_identifier": task_identifier
                }
            }

    # Check for list intent
    for pattern in list_patterns:
        if re.search(pattern, message_lower):
            # Check if user wants to filter by status, priority, or category
            status_filter = None
            priority_filter = None
            category_filter = None

            if "completed" in message_lower:
                status_filter = "completed"
            elif "pending" in message_lower or "incomplete" in message_lower:
                status_filter = "pending"

            if "high" in message_lower:
                priority_filter = "high"
            elif "low" in message_lower:
                priority_filter = "low"

            # Extract category if mentioned
            category_match = re.search(r"in category (.+?)(?:\s|$)", message_lower)
            if category_match:
                category_filter = category_match.group(1).strip()

            return {
                "intent": "list_tasks",
                "params": {
                    "status_filter": status_filter,
                    "priority_filter": priority_filter,
                    "category_filter": category_filter
                }
            }

    # Check for summary intent
    summary_patterns = [
        r"summarize.*tasks?",
        r"how.*many.*tasks?",
        r"task.*summary",
        r"what.*is.*my.*progress",
    ]
    for pattern in summary_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "summary",
                "params": {}
            }

    # If no pattern matches, return unknown intent
    return {
        "intent": "unknown",
        "params": {"message": message}
    }

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    chat_request: ChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """
    Handle chat requests and process natural language commands
    """
    try:
        # Parse the natural language command
        parsed_command = parse_natural_language_command(chat_request.message)
        intent = parsed_command["intent"]

        response_text = ""
        action = None

        if intent == "create_task":
            params = parsed_command["params"]
            response_text = f"I'll create a task for you: '{params['title']}'"
            action = {
                "type": "create_task",
                "data": params
            }
        elif intent == "list_tasks":
            params = parsed_command["params"]
            filters = []
            if params.get("status_filter"):
                filters.append(f"status: {params['status_filter']}")
            if params.get("priority_filter"):
                filters.append(f"priority: {params['priority_filter']}")
            if params.get("category_filter"):
                filters.append(f"category: {params['category_filter']}")

            if filters:
                response_text = f"I'll fetch your tasks with filters: {', '.join(filters)}"
            else:
                response_text = "I'll fetch all your tasks for you."

            action = {
                "type": "list_tasks",
                "data": params
            }
        elif intent == "update_task":
            params = parsed_command["params"]
            response_text = f"I'll update the task '{params['task_identifier']}'"
            action = {
                "type": "update_task",
                "data": params
            }
        elif intent == "delete_task":
            params = parsed_command["params"]
            response_text = f"I'll handle the task '{params['task_identifier']}'"
            action = {
                "type": "delete_task",
                "data": params
            }
        elif intent == "summary":
            # Fetch task summary from database
            all_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
            total_tasks = len(all_tasks)
            completed_tasks = len([t for t in all_tasks if t.status == "completed"])
            pending_tasks = total_tasks - completed_tasks

            response_text = f"You have {total_tasks} total tasks, with {completed_tasks} completed and {pending_tasks} pending."
        elif intent == "unknown":
            # Use OpenAI to generate a helpful response
            try:
                # Get user's tasks to provide context
                user_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).limit(5).all()
                tasks_context = "User tasks: " + json.dumps([
                    {"id": t.id, "title": t.title, "status": t.status, "priority": t.priority, "due_date": str(t.due_date)}
                    for t in user_tasks
                ], default=str)

                completion = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": f"You are a helpful assistant for a task management application. Help users manage their tasks using natural language. Be concise and helpful. {tasks_context}"},
                        {"role": "user", "content": chat_request.message}
                    ],
                    max_tokens=150
                )
                response_text = completion.choices[0].message.content
            except Exception as e:
                response_text = "I didn't understand that. You can ask me to create, list, update, delete tasks, or get a summary."
        else:
            response_text = "I'm not sure how to handle that request. You can ask me to create, list, update, delete tasks, or get a summary."

        return ChatResponse(response=response_text, action=action)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )