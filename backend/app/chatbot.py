from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import re
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import json
import requests

from . import models, schemas, database, auth

load_dotenv()

router = APIRouter()

# Check if Gemini is configured
def is_gemini_configured():
    return bool(os.getenv("GEMINI_API_KEY"))

# Gemini API call function
async def call_gemini_api(prompt: str, system_prompt: str = None) -> str:
    """Call Gemini API to get a response"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    
    # Use the correct API endpoint for Gemini 2.0
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    # Build the contents with system instruction
    contents = []
    
    # Add system instruction as first user message if provided
    if system_prompt:
        # For Gemini, we use systemInstruction field
        system_instruction = system_prompt
    else:
        system_instruction = "You are a helpful AI assistant."
    
    # Add the user's message
    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })
    
    payload = {
        "systemInstruction": {
            "role": "system",
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000,
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Gemini API response status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('candidates'):
                return result['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"Gemini API error: {response.text}")
        return None
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None

# System prompt for the AI assistant
SYSTEM_PROMPT = """You are TodoBot, a friendly, conversational To-Do List chatbot for a mobile/web app.

IMPORTANT: You must respond in NATURAL HUMAN LANGUAGE like a friendly friend/buddy. NO robotic responses!

LANGUAGE STYLE:
- User jis language mein baat kare, usi mein jawab do (English ya Roman Urdu)
- Roman Urdu examples: "Theek hai bhai!", "Ho gaya!", "Koi baat nahi!", "Bas itna hi tha?"
- Friendly emojis use karo: 😊 ✅ 🎉 👍 🙏 ✨
- Short, sweet, conversational responses

CORE RULES:
1. Hamesha friendly aur natural baat karo (jaise dost se baat hoti hai)
2. Task actions ke baad JSON block END mein zaroor dena
3. Kabhi bhi tasks mat gharana (hallucinate) - sirf DB se dekho

CURRENT TASKS CONTEXT (provided by backend):
[Current Tasks]
ID | Description | Status | Due Date | Priority
1 | Office jana | pending | 2026-02-18 | high
2 | Gym | completed | null | medium

Is context ko use kar ke accurate jawab do.

ACTION JSON FORMATS (ye sirf tab dena jab task action ho):

Create task ke baad:
```json
{
  "action": "add",
  "description": "task description",
  "due_date": "2026-02-20 or null",
  "priority": "low or medium or high or null"
}
```

Update task ke baad:
```json
{
  "action": "update",
  "task_id": 1,
  "updates": {"status": "completed", "priority": "high"}
}
```

Delete task ke baad:
```json
{
  "action": "delete",
  "task_id": 1
}
```

Complete task ke baad:
```json
{
  "action": "complete",
  "task_id": 1
}
```

List tasks ke baad:
```json
{
  "action": "list"
}
```

EXAMPLE CONVERSATIONS:

User: "task add karo eating"
You: "Ho gaya! 'Eating' task add kar diya ✅ Kal se shuru karte hain! 😊
```json
{"action": "add", "description": "eating", "due_date": null, "priority": "medium"}
```"

User: "mere tasks dikhao"
You: "Yeh rahe aapke tasks 📋:
• Office jana (pending) - High priority
• Gym (completed)
Aur kuch chahiye? 😊
```json
{"action": "list"}
```"

User: "hi"
You: "Hey! 👋 Kya haal hai? Aaj kya kaam karna hai? 😊"

User: "kal biryani khani hai"
You: "Waah! Biryani! 😋 Main 'Kal biryani khani hai' task bana doon? Ya kuch aur bhi karna hai? 🍛"

User: "task delete karo wala meeting"
You: "Ho gaya! 'Meeting' task delete kar diya ✅ Koi aur kaam? 😊
```json
{"action": "delete", "task_id": 5}
```"

User: "bhai boring ho raha hai"
You: "Arre yaar! 😅 Chalo koi task complete karte hain, mood theek ho jayega! Kya karna hai aaj? 💪"

User: "thanks"
You: "Koi baat nahi bhai! 😊 Mazay ka kaam kiya! Aur kuch chahiye to bolna! 🙏"

User: "bye"
You: "Alvida! 👋 Phir milenge! Khush raho! 😊✨"

REMEMBER:
- Natural baat karo, robotic nahi!
- Emojis use karo lekin zyada nahi
- Roman Urdu mein friendly tone ("bhai", "yaar", "mast", "ho gaya")
- JSON block sirf tab jab DB action ho
- JSON block ke baad KUCH MAT LIKHNA!"""

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

    # Check for chained commands first (e.g., "list pending tasks and delete first")
    chain_keywords = [' and ', ' then ', ', ', ' after that ', ' afterwards ']
    has_chain = any(keyword in message_lower for keyword in chain_keywords)
    
    if has_chain:
        # Split the message into separate commands
        commands = [message]
        for keyword in chain_keywords:
            new_commands = []
            for cmd in commands:
                new_commands.extend(cmd.split(keyword))
            commands = [cmd.strip() for cmd in new_commands if cmd.strip()]
        
        # Return a chain intent
        parsed_commands = []
        for cmd in commands:
            parsed_commands.append(parse_single_command(cmd))
        
        return {
            "intent": "chain",
            "params": {
                "commands": parsed_commands
            }
        }
    
    # Single command parsing
    return parse_single_command(message)

def parse_single_command(message: str) -> Dict[str, Any]:
    """
    Parse a single natural language command to identify intent and extract entities
    Supports English, Urdu, Hindi, and Roman Urdu
    """
    message_lower = message.lower().strip()
    original_message = message

    # Roman Urdu to English mappings for common task commands
    roman_urdu_patterns = [
        # Task creation - MUST come first
        (r"task\s+add\s+karo", "create task"),
        (r"task\s+add\s+kro", "create task"),
        (r"task\s+banao", "create task"),
        (r"task\s+create\s+karo", "create task"),
        (r"task\s+ban\s+do", "create task"),
        (r"naya\s+task", "create task"),
        (r"add\s+task", "create task"),
        (r"ek\s+task\s+bana\s+do", "create task"),
        (r"new\s+task", "create task"),
        (r"task\s+add", "create task"),
        (r"bana\s+do", "create task"),
        (r"ban\s+do", "create task"),
        (r"add\s+karo", "create task"),
        (r"add\s+kro", "create task"),
        (r"add\s+karo", "create task"),
        # List tasks
        (r"tasks\s+dikhao", "show tasks"),
        (r"tasks\s+list", "show tasks"),
        (r"meray\s+tasks", "show tasks"),
        (r"mere\s+tasks", "show tasks"),
        (r"sab\s+tasks", "show tasks"),
        (r"tasks\s+dikhai", "show tasks"),
        (r"list\s+dikhao", "show tasks"),
        (r"show\s+karo", "show tasks"),
        (r"dikhao", "show tasks"),
        # Delete tasks
        (r"task\s+hatao", "delete task"),
        (r"task\s+delete\s+karo", "delete task"),
        (r"task\s+delete", "delete task"),
        (r"delete\s+my\s+task", "delete task"),
        (r"delete\s+my", "delete task"),
        (r"task\s+remove\s+karo", "delete task"),
        (r"task\s+khatam\s+karo", "delete task"),
        (r"delete\s+karo", "delete task"),
        (r"delete\s+kro", "delete task"),
        (r"delete\s+task", "delete task"),
        (r"hata\s+do", "delete task"),
        # Complete tasks
        (r"task\s+complete\s+karo", "complete task"),
        (r"task\s+done\s+karo", "complete task"),
        (r"complete\s+ho\s+gaya", "complete task"),
        (r"done\s+ho\s+gaya", "complete task"),
        (r"mark\s+karo", "complete task"),
        # Update tasks
        (r"task\s+update\s+karo", "update task"),
        (r"task\s+update", "update task"),
        (r"update\s+task", "update task"),
        (r"update\s+karo", "update task"),
        (r"task\s+badlo", "update task"),
        (r"change\s+task", "update task"),
        # Priority
        (r"zyada\s+important", "high priority"),
        (r"urgent", "high priority"),
        (r"jaldi", "high priority"),
        (r"bahut\s+zyada", "high priority"),
    ]

    # Apply Roman Urdu pattern replacements
    for pattern, replacement in roman_urdu_patterns:
        if re.search(pattern, message_lower):
            message_lower = re.sub(pattern, replacement, message_lower)
            break

    # Define patterns for different intents
    create_patterns = [
        r"create\s+task\s+(?:to\s+)?(.+?)(?:\s+with\s+description\s+(.+?))?(?:\s+due\s+(.+?))?(?:\s+with\s+priority\s+(.+?))?(?:\s+in\s+category\s+(.+?))?(?=\s*$)",
        r"add\s+task\s+(?:to\s+)?(.+?)(?:\s+with\s+description\s+(.+?))?(?:\s+due\s+(.+?))?(?:\s+with\s+priority\s+(.+?))?(?:\s+in\s+category\s+(.+?))?(?=\s*$)",
        r"make\s+task\s+(?:to\s+)?(.+?)(?:\s+with\s+description\s+(.+?))?(?:\s+due\s+(.+?))?(?:\s+with\s+priority\s+(.+?))?(?:\s+in\s+category\s+(.+?))?(?=\s*$)",
        r"create\s+(?:a\s+)?task\s*(?::\s*)?(.+)",
        r"add\s+(?:a\s+)?task\s*(?::\s*)?(.+)",
        r"new\s+task\s*(?::\s*)?(.+)",
        # Roman Urdu: "home add karo", "khana banao"
        r"(.+?)\s+add\s+karo",
        r"(.+?)\s+add\s+kro",
        r"(.+?)\s+add",
        r"(.+?)\s+banao",
        r"(.+?)\s+ban\s+do",
        r"create\s+(.+)",
        r"add\s+(.+)",
    ]

    update_patterns = [
        # Pattern: "update task X to Y" or "update task X to Y time"
        r"update\s+task\s+(.+?)\s+to\s+(.+)",
        # Pattern: "change task X to Y"
        r"change\s+task\s+(.+?)\s+to\s+(.+)",
        # Pattern: "mark task X as Y"
        r"mark\s+task\s+(.+?)\s+as\s+(.+)",
        # Pattern: "set priority of task X to Y"
        r"set\s+priority\s+of\s+task\s+(.+?)\s+to\s+(.+)",
        # Pattern: "update due date of task X to Y"
        r"update\s+due\s+date\s+of\s+task\s+(.+?)\s+to\s+(.+)",
        # Pattern: "task X complete karo" or "complete task X"
        r"complete\s+task\s+(.+)",
        r"done\s+task\s+(.+)",
        r"task\s+complete\s+(.+)",
        r"task\s+done\s+(.+)",
        # Pattern: "mark as done" or "mark as complete"
        r"mark\s+as\s+done",
        r"mark\s+as\s+complete",
        # Pattern: "task update karo X to Y" (Roman Urdu)
        r"task\s+update\s+karo\s+(.+?)\s+to\s+(.+)",
        r"task\s+update\s+(.+?)\s+to\s+(.+)",
        # Pattern: "update my task X to Y"
        r"update\s+my\s+task\s+(.+?)\s+to\s+(.+)",
    ]

    delete_patterns = [
        r"delete\s+task\s+(.+)",
        r"remove\s+task\s+(.+)",
        r"cancel\s+task\s+(.+)",
        r"task\s+delete\s+(.+)",
        r"task\s+remove\s+(.+)",
        r"delete\s+(.+)",
        r"remove\s+(.+)",
    ]

    list_patterns = [
        r"show\s+tasks?",
        r"list\s+tasks?",
        r"what\s+tasks?",
        r"view\s+tasks?",
        r"show\s+my\s+tasks",
        r"what\s+do\s+i\s+have\s+to\s+do",
        r"mere\s+tasks\s+kya\s+hain",
        r"meri\s+tasks\s*kya\s*hain",
        r"tasks\s+kya\s*hain",
        r"sab\s+tasks\s+dikhao",
        r"sab\s+tasks\s+batao",
        r"mere\s+tasks\s+dikhao",
        r"tasks\s+dikhao",
        r"list\s+dikhao",
        r"kya\s+tasks\s+hain",
        r"kon\s+si\s+tasks\s+hain",
        r"ajj\s+kya\s+kya\s+hai",
        r"pending\s+tasks",
        r"completed\s+tasks",
        r"incomplete\s+tasks",
    ]

    # Check for create intent FIRST
    for pattern in create_patterns:
        match = re.search(pattern, message_lower)
        if match:
            title = match.group(1).strip() if match.group(1) else ""
            
            # Clean up title - remove common filler words
            title = re.sub(r'\s+(to|for|me|mera|meri|karna|hai)\s*$', '', title)
            title = title.strip()
            
            if not title:
                continue
                
            description = match.group(2).strip() if len(match.groups()) > 1 and match.group(2) else None
            due_date_str = match.group(3).strip() if len(match.groups()) > 2 and match.group(3) else None
            priority_str = match.group(4).strip() if len(match.groups()) > 3 and match.group(4) else None
            category = match.group(5).strip() if len(match.groups()) > 4 and match.group(5) else None

            # Parse due date if provided
            due_date = None
            if due_date_str:
                if "tomorrow" in due_date_str or "kal" in due_date_str:
                    due_date = datetime.utcnow() + timedelta(days=1)
                elif "today" in due_date_str or "aaj" in due_date_str or "now" in due_date_str:
                    due_date = datetime.utcnow()
                elif "next week" in due_date_str:
                    due_date = datetime.utcnow() + timedelta(weeks=1)
                elif "next month" in due_date_str:
                    due_date = datetime.utcnow() + timedelta(days=30)
                else:
                    try:
                        due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
                    except ValueError:
                        for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y"):
                            try:
                                due_date = datetime.strptime(due_date_str, fmt)
                                break
                            except ValueError:
                                continue

            # Determine priority
            priority = "medium"
            if priority_str:
                priority = priority_str
            else:
                priority_patterns = {
                    "high": [r"high", r"urgent", r"asap", r"important"],
                    "medium": [r"medium", r"normal"],
                    "low": [r"low", r"not\s+urgent", r"whenever"]
                }
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
            task_identifier = match.group(1).strip() if match.group(1) else ""
            new_value = match.group(2).strip() if len(match.groups()) > 1 and match.group(2) else None

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
            task_identifier = match.group(1).strip() if match.group(1) else ""
            return {
                "intent": "delete_task",
                "params": {
                    "task_identifier": task_identifier
                }
            }

    # Check for list intent
    for pattern in list_patterns:
        if re.search(pattern, message_lower):
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
        r"summarize\s+tasks?",
        r"how\s+many\s+tasks?",
        r"task\s+summary",
        r"what\s+is\s+my\s+progress",
    ]
    for pattern in summary_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "summary",
                "params": {}
            }

    # Check for "Who am I" intent
    who_am_i_patterns = [
        r"who am i",
        r"what\s+my\s+name",
        r"my\s+email",
        r"tell\s+about\s+me",
        r"identify\s+me",
    ]
    for pattern in who_am_i_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "who_am_i",
                "params": {}
            }

    # Check for greeting intent
    greeting_patterns = [
        r"^hello$",
        r"^hi$",
        r"^hey$",
        r"^hi there$",
        r"^hey there$",
        r"good morning",
        r"good afternoon",
        r"good evening",
        r"good night",
        r"^namaste$",
        r"assalamualaikum",
        r"asalamualaikum",
        r"salam",
        r"kia haal hai",
        r"kaise hain",
        r"kesi ho",
        r"suno$",
        r"kiya hal hai",
        r"what's up",
        r"sup",
    ]
    for pattern in greeting_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "greeting",
                "params": {}
            }

    # Check for farewell intent
    farewell_patterns = [
        r"^bye$",
        r"^goodbye$",
        r"see you",
        r"take care",
        r"later$",
        r"mein chhati hun",
        r"mein jaa raha hun",
        r"mein jaa rahi hun",
        r"mujhe jana hai",
        r"alvida",
        r"phir milenge",
        r"bye bye",
    ]
    for pattern in farewell_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "farewell",
                "params": {}
            }

    # Check for casual chat
    how_are_you_patterns = [
        r"how are you",
        r"how r you",
        r"hows\s+you",
        r"kaisa hai",
        r"kaisi ho",
        r"kaise hain",
    ]
    for pattern in how_are_you_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "how_are_you",
                "params": {}
            }

    # Check for thanks
    thanks_patterns = [
        r"thank you",
        r"thanks",
        r"thx",
        r"thankyou",
        r"shukriya",
        r"shukria",
        r"dhanyavad",
        r"mashallah",
    ]
    for pattern in thanks_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "thanks",
                "params": {}
            }

    # Check for help intent
    help_patterns = [
        r"help",
        r"can you help",
        r"what can you do",
        r"tell me what you can do",
        r"commands",
        r"how does this work",
        r"mujhe help chahiye",
        r"madad chahiye",
        r"help karo",
        r"kya kar sakte ho",
        r"aisi kya abilities hain",
    ]
    for pattern in help_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "help",
                "params": {}
            }

    # Check for about/app info intent
    about_patterns = [
        r"about this app",
        r"what is this",
        r"tell me about",
        r"app info",
        r"who are you",
        r"what are you",
        r"ye kya hai",
        r"kya ye app hai",
    ]
    for pattern in about_patterns:
        if re.search(pattern, message_lower):
            return {
                "intent": "about",
                "params": {}
            }

    # If no pattern matches, return unknown intent
    return {
        "intent": "unknown",
        "params": {"message": message}
    }

def format_json_block(action_data: dict) -> str:
    """Format action data as a JSON block at the end of response"""
    import json
    return f"\n```json\n{json.dumps(action_data, indent=2)}\n```"

def get_current_tasks_context(db, user_id: int, limit: int = 10) -> str:
    """Get current tasks in the specified format for context"""
    tasks = db.query(models.Task).filter(
        models.Task.user_id == user_id
    ).order_by(models.Task.created_at.desc()).limit(limit).all()
    
    if not tasks:
        return "[Current Tasks]\nNo tasks yet.\n"
    
    lines = ["[Current Tasks]", "ID | Description | Status | Due Date | Priority"]
    for task in tasks:
        due_date_str = task.due_date.strftime("%Y-%m-%d") if task.due_date else "null"
        lines.append(f"{task.id} | {task.title} | {task.status} | {due_date_str} | {task.priority}")
    
    return "\n".join(lines)

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
        # Get current tasks for context
        current_tasks_context = get_current_tasks_context(db, current_user.id)
        
        # Parse the natural language command
        parsed_command = parse_natural_language_command(chat_request.message)
        intent = parsed_command["intent"]

        response_text = ""
        json_action = None  # Will be formatted as JSON block at the end

        if intent == "create_task":
            params = parsed_command["params"]

            # Create the task in the database
            new_task = models.Task(
                title=params['title'],
                description=params.get('description') or '',
                status='pending',
                priority=params.get('priority', 'medium'),
                category=params.get('category'),
                due_date=params.get('due_date'),
                user_id=current_user.id
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)

            # Friendly response in user's language style
            if any(word in chat_request.message.lower() for word in ['karo', 'karna', 'hai', 'mera', 'mere', 'banao', 'dalo']):
                response_text = f"Theek hai bhai, '{params['title']}' task add kar diya! ✅"
            else:
                response_text = f"Done! Added '{params['title']}' to your list! ✨"
            
            # JSON block for DB action
            json_action = {
                "action": "add",
                "description": params['title'],
                "due_date": params['due_date'].strftime("%Y-%m-%d") if params.get('due_date') else None,
                "priority": params.get('priority', 'medium')
            }
            response_text += format_json_block(json_action)
            json_action = None  # Clear since we already added to response
        elif intent == "list_tasks":
            params = parsed_command["params"]
            
            # Build query with filters
            query = db.query(models.Task).filter(models.Task.user_id == current_user.id)

            if params.get("status_filter"):
                query = query.filter(models.Task.status == params['status_filter'])
            if params.get("priority_filter"):
                query = query.filter(models.Task.priority == params['priority_filter'])
            if params.get("category_filter"):
                query = query.filter(models.Task.category == params['category_filter'])

            tasks = query.order_by(models.Task.created_at.desc()).all()

            if tasks:
                task_list = "\n".join([f"• {t.title} ({t.status}) - Priority: {t.priority}" for t in tasks[:10]])
                more = f"\n...and {len(tasks) - 10} more tasks" if len(tasks) > 10 else ""
                
                # Check language style
                if any(word in chat_request.message.lower() for word in ['dikhao', 'mera', 'mere', 'sab', 'kya', 'hai']):
                    response_text = f"📋 Yeh rahe aapke tasks:\n{task_list}{more}"
                else:
                    response_text = f"📋 Your tasks:\n{task_list}{more}"
            else:
                if any(word in chat_request.message.lower() for word in ['dikhao', 'mera', 'mere', 'sab', 'kya', 'hai']):
                    response_text = "Koi tasks nahi hain abhi! 🎉"
                else:
                    response_text = "You have no tasks matching your criteria. 🎉"

            # JSON block for list action
            json_action = {"action": "list"}
            response_text += format_json_block(json_action)
            json_action = None
            
        elif intent == "update_task":
            params = parsed_command["params"]
            task_identifier = params['task_identifier'].lower()
            update_type = params.get('update_type', 'other')
            new_value = params.get('new_value')

            # Find the task by title (case insensitive partial match)
            task = db.query(models.Task).filter(
                models.Task.user_id == current_user.id,
                models.Task.title.ilike(f"%{task_identifier}%")
            ).first()

            if task:
                updates = {}
                
                # Determine what to update based on the message
                if update_type == 'status':
                    task.status = new_value or 'completed'
                    updates['status'] = new_value or 'completed'
                elif update_type == 'priority':
                    task.priority = new_value or 'medium'
                    updates['priority'] = new_value or 'medium'
                elif update_type == 'due_date' and new_value:
                    if isinstance(new_value, str):
                        try:
                            task.due_date = datetime.strptime(new_value, "%Y-%m-%d")
                            updates['due_date'] = new_value
                        except ValueError:
                            updates['due_date'] = new_value
                    else:
                        task.due_date = new_value
                        updates['due_date'] = new_value.strftime("%Y-%m-%d") if hasattr(new_value, 'strftime') else str(new_value)
                elif update_type == 'other' and new_value:
                    # Default: update the title
                    task.title = new_value
                    updates['title'] = new_value
                else:
                    # Default: mark as completed
                    task.status = 'completed'
                    updates['status'] = 'completed'

                db.commit()
                db.refresh(task)

                # Friendly response
                if any(word in chat_request.message.lower() for word in ['karo', 'karna', 'hai', 'mera', 'mere', 'ho gaya']):
                    response_text = f"✅ Task '{task.title}' update ho gaya!"
                else:
                    response_text = f"✅ Task '{task.title}' has been updated!"

                # JSON block for update action
                json_action = {
                    "action": "update",
                    "task_id": task.id,
                    "updates": updates
                }
                response_text += format_json_block(json_action)
                json_action = None
            else:
                if any(word in chat_request.message.lower() for word in ['karo', 'karna', 'hai', 'mera', 'mere']):
                    response_text = f"❌ '{task_identifier}' jaisa koi task nahi mila."
                else:
                    response_text = f"❌ I couldn't find a task matching '{task_identifier}'."

        elif intent == "delete_task":
            params = parsed_command["params"]
            task_identifier = params['task_identifier'].lower()

            # Find the task by title (case insensitive partial match)
            task = db.query(models.Task).filter(
                models.Task.user_id == current_user.id,
                models.Task.title.ilike(f"%{task_identifier}%")
            ).first()

            if task:
                task_title = task.title
                task_id = task.id
                db.delete(task)
                db.commit()
                
                # Friendly response
                if any(word in chat_request.message.lower() for word in ['karo', 'karna', 'hai', 'mera', 'mere', 'hatao']):
                    response_text = f"✅ Task '{task_title}' delete ho gaya!"
                else:
                    response_text = f"✅ Task '{task_title}' has been deleted!"
                
                # JSON block for delete action
                json_action = {
                    "action": "delete",
                    "task_id": task_id
                }
                response_text += format_json_block(json_action)
                json_action = None
            else:
                if any(word in chat_request.message.lower() for word in ['karo', 'karna', 'hai', 'mera', 'mere', 'hatao']):
                    response_text = f"❌ '{task_identifier}' jaisa koi task nahi mila."
                else:
                    response_text = f"❌ I couldn't find a task matching '{task_identifier}'."
        elif intent == "summary":
            # Fetch task summary from database
            all_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
            total_tasks = len(all_tasks)
            completed_tasks = len([t for t in all_tasks if t.status == "completed"])
            pending_tasks = total_tasks - completed_tasks
            high_priority = len([t for t in all_tasks if t.priority == "high" and t.status != "completed"])
            
            response_text = f"📊 Your Task Summary:\n• Total: {total_tasks}\n• Completed: {completed_tasks}\n• Pending: {pending_tasks}\n• High Priority: {high_priority}"
            # No JSON action needed for summary (read-only)
            
        elif intent == "who_am_i":
            # Return all user information
            from datetime import datetime
            created_date = current_user.created_at.strftime('%Y-%m-%d %H:%M') if current_user.created_at else 'N/A'
            is_active = "✅ Active" if current_user.is_active else "❌ Inactive"

            response_text = f"""👤 YOUR PROFILE INFO:

📧 Email: {current_user.email}
👨‍💼 Name: {current_user.full_name}
🆔 User ID: {current_user.id}
📊 Status: {is_active}
📅 Joined: {created_date}

You have full access to your account!"""
            # No JSON action needed for who_am_i (read-only)
            
        elif intent == "greeting":
            # Friendly greeting response - Pakistani Islamic style
            import random
            greetings_en = [
                "Hello! 👋 How can I help you with your tasks today?",
                "Hey there! 😊 What can I do for you?",
                "Hi! Welcome back! How can I assist you?",
                "Assalamualaikum! 🌟 How can I assist you?",
                "Salam! 😊 I'm here to help you manage your tasks!"
            ]
            greetings_urdu = [
                "Assalamualaikum! 🙏 Main aapki tasks manage karne mein madad kar sakta hun!",
                "Salam! 😊 Kya aap apni tasks dekhna chahte hain?",
                "Hey bhai! 😄 Kya haal hai? Tasks manage karne hain?",
                "Yo! 🎉 Kya karna hai? Tasks bana den?",
                "Wassup! 😄 Chalo kya kaam hai?"
            ]
            # Check if message is ONLY a greeting (not a sentence with task commands)
            msg_lower = chat_request.message.lower().strip()

            # Pure greeting patterns (exact matches only)
            pure_greetings = ['hi', 'hello', 'hey', 'salam', 'assalamualaikum',
                             'hi there', 'hey there', 'good morning', 'good afternoon',
                             'good evening', 'kia haal hai', 'kaise ho', 'kesi ho']
            
            if msg_lower in pure_greetings or msg_lower.replace('!', '') in pure_greetings or msg_lower.replace('?', '') in pure_greetings:
                # Only respond with greeting if it's JUST a greeting
                if any(word in msg_lower for word in ['salam', 'assalamualaikum', 'namaste']):
                    response_text = random.choice(greetings_urdu)
                else:
                    response_text = random.choice(greetings_en)
            else:
                # It's a sentence with greeting + command, treat as regular command
                intent = "unknown"  # Fall through to unknown handler
                response_text = ""
            
            # No JSON action needed for greeting
            
        elif intent == "farewell":
            # Friendly farewell response - Pakistani style
            import random
            farewells = [
                "Goodbye! Take care! 👋",
                "Bye! See you later! 😊",
                "Take care! Allah hafiz! 🙏",
                "Alvida! Phir milenge! 👋",
                "Bye bye! Jaldi wapis aana! 😊",
                "Okay, goodbye! Thanks for chatting! 👋"
            ]
            # Check for Roman Urdu
            if any(word in chat_request.message.lower() for word in ['chhati', 'jaa', 'jana', 'alvida', 'phir', 'chal', 'bao']):
                farewells_urdu = [
                    "Alvida! Allah hafiz! 🙏",
                    "Phir milenge! 👋",
                    "Okay, goodbye! Jaldi wapis aana! 😊",
                    "Chalo bye! Phir milte hain! 👋",
                    "Bye bhai! 😄 Phir chat karte hain!",
                    "Alvida! Take care! 🙏💙"
                ]
                response_text = random.choice(farewells_urdu)
            else:
                response_text = random.choice(farewells)
            # No JSON action needed for farewell
            
        elif intent == "how_are_you":
            # Respond to "how are you" in natural way - Pakistani style
            import random
            responses_en = [
                "I'm doing great, thanks for asking! 😊 How can I help you today?",
                "I'm good! Ready to help you with your tasks! What do you need?",
                "I'm fine! How are you? Need help with anything?",
                "All good bhai! 😄 Tell me, kya kaam hai?",
                "100% ready! 🎯 What do you need?"
            ]
            responses_urdu = [
                "Main theek hun, shukriya! 🙏 Aapki kya madad chahiye?",
                "Main 100% ready hun! Aapke tasks ke liye! 😊",
                "Theek hun! Aap batao, kya kaam hai?",
                "Bas theek! 😄 Aapki kya madad chahiye?",
                "Maja ao raha hai! 🎉 Batao, kya karna hai?"
            ]
            if any(word in message.lower() for word in ['kaisa', 'kaise', 'kesi', 'kaisi', 'kya']):
                response_text = random.choice(responses_urdu)
            else:
                response_text = random.choice(responses_en)
            action = {"type": "how_are_you", "data": {}}
        elif intent == "thanks":
            # Respond to thanks
            import random
            responses = [
                "You're welcome! 😊 Happy to help!",
                "No problem! Let me know if you need anything else!",
                "You're welcome! Anything else I can help with?",
                "Shukriya! 😊 Koi aur kaam hai?"
            ]
            if any(word in message.lower() for word in ['shukriya', 'shukria', 'dhanyavad']):
                responses_urdu = [
                    "Shukriya! 🙏 Koi aur madad chahiye?",
                    "Aap welcome hain! 😊 Koi aur kaam?"
                ]
                response_text = random.choice(responses_urdu)
            else:
                response_text = random.choice(responses)
            action = {"type": "thanks", "data": {}}
        elif intent == "help":
            # Help response with all available commands
            import random
            help_en = [
                "🎯 Here's what I can do:\n\n• Create task: 'create task to buy groceries'\n• List tasks: 'show my tasks' or 'list pending tasks'\n• Complete task: 'mark shopping as done'\n• Delete task: 'delete meeting task'\n• Task summary: 'show my task summary'\n\nI also understand Urdu/Roman Urdu! Try: 'meray tasks dikhao' or 'naya task banao' 😊",
                "🤖 I'm your Task Buddy! Here's my commands:\n\n✓ 'add new task: [name]'\n✓ 'show my tasks'\n✓ 'list completed tasks'\n✓ 'delete [task name]'\n✓ 'mark [task] as done'\n✓ 'task summary'\n\nTry me out! 😄",
                "📝 Sure! I can help you with:\n\n1. Creating tasks: 'create task to call doctor tomorrow'\n2. Viewing tasks: 'show my pending tasks'\n3. Completing: 'mark meeting as complete'\n4. Deleting: 'delete old tasks'\n5. Summary: 'how many tasks do I have?'\n\nJust type naturally! 😊"
            ]
            help_urdu = [
                "🎯 Main aapki kya madad kar sakta hun:\n\n• Task bana do: 'naya task: groceries khareedna'\n• Tasks dikhao: 'mere sab tasks dikhao'\n• Complete: 'shopping task complete karo'\n• Delete: 'old task delete karo'\n• Summary: 'meri tasks ka summary batao'\n\nBolao, kya karna hai? 😊",
                "🤖 Bhai, main Task Manager hoon! Commands:\n\n✓ 'naya task: gym jana'\n✓ 'mere tasks dikhao'\n✓ 'pending tasks list karo'\n✓ '[task name] delete karo'\n✓ '[task] complete karo'\n\nTry karo bhai! 😄",
                "📝 Theek hai, suno:\n\n1. Task bana do: 'naya task: doctor se milna'\n2. Tasks dekho: 'mere pending tasks'\n3. Complete: 'meeting complete ho gaya'\n4. Delete: 'shopping task hatao'\n5. Summary: 'kitne tasks hain?'\n\nBas itna easy hai! 😊"
            ]
            
            # Detect language
            if any(word in message.lower() for word in ['kya', 'bhai', 'sab', 'kaisa', 'kaise', 'chalo', 'batao', 'mujhe', 'meri', 'apni', 'hai', 'ho', 'salam', 'madad', 'karo', 'bana', 'dikhao']):
                response_text = random.choice(help_urdu)
            else:
                response_text = random.choice(help_en)
            action = {"type": "help", "data": {}}
        elif intent == "about":
            # About the app
            import random
            about_en = [
                "🤖 I'm 'Todo Buddy' - your friendly AI task manager! \n\nI help you manage tasks using natural language. Just tell me what you need in plain English or Urdu/Roman Urdu!\n\nCreated with 💙 for productive people!",
                "📱 I'm an AI-powered task manager assistant! \n\nI can understand both English and Urdu (Roman Urdu). Just tell me what to do and I'll handle your tasks!\n\nLet's get organized! 🚀"
            ]
            about_urdu = [
                "🤖 Main 'Todo Buddy' hoon - aapka AI task manager! \n\nMain English aur Urdu/Roman Urdu dono samajh sakta hun. Bas batao kya karna hai, main handle karunga! \n\n💙 se banaya gaya productive logon ke liye!",
                "📱 Main AI-powered task manager hoon! \n\nEnglish aur Urdu dono main kaam kar sakta hun. Bas kaho: 'tasks dikhao' ya 'naya task banao' - bas itna easy! \n\nChalo, organize karte hain! 🚀"
            ]
            
            if any(word in message.lower() for word in ['kya', 'ye', 'kaisa', 'kaise', 'kaun', 'konsa']):
                response_text = random.choice(about_urdu)
            else:
                response_text = random.choice(about_en)
            action = {"type": "about", "data": {}}
        elif intent == "chain":
            # Handle multiple chained commands
            commands = parsed_command["params"]["commands"]
            results = []
            
            for cmd in commands:
                cmd_intent = cmd["intent"]
                cmd_params = cmd["params"]
                
                if cmd_intent == "list_tasks":
                    # Execute list command and store results
                    query = db.query(models.Task).filter(models.Task.user_id == current_user.id)
                    if cmd_params.get("status_filter"):
                        query = query.filter(models.Task.status == cmd_params['status_filter'])
                    if cmd_params.get("priority_filter"):
                        query = query.filter(models.Task.priority == cmd_params['priority_filter'])
                    
                    tasks = query.order_by(models.Task.created_at.desc()).all()
                    results.append({
                        "intent": "list_tasks",
                        "tasks": [({"id": t.id, "title": t.title, "status": t.status}) for t in tasks]
                    })
                elif cmd_intent == "delete_task":
                    # Delete the first task from previous list or by identifier
                    task_identifier = cmd_params.get('task_identifier', '').lower()
                    
                    # Try to find task from previous list results or by name
                    task_to_delete = None
                    if "first" in task_identifier and results and results[-1].get("tasks"):
                        # Delete the first task from the list
                        task_to_delete = results[-1]["tasks"][0] if results[-1]["tasks"] else None
                    else:
                        # Find by name
                        task_to_delete = db.query(models.Task).filter(
                            models.Task.user_id == current_user.id,
                            models.Task.title.ilike(f"%{task_identifier}%")
                        ).first()
                    
                    if task_to_delete:
                        task_title = task_to_delete.title if hasattr(task_to_delete, 'title') else task_to_delete.get('title')
                        db.delete(task_to_delete)
                        db.commit()
                        results.append({"intent": "delete_task", "success": True, "title": task_title})
                    else:
                        results.append({"intent": "delete_task", "success": False, "title": task_identifier})
                elif cmd_intent == "create_task":
                    new_task = models.Task(
                        title=cmd_params['title'],
                        description=cmd_params.get('description') or '',
                        status='pending',
                        priority=cmd_params.get('priority', 'medium'),
                        category=cmd_params.get('category'),
                        due_date=cmd_params.get('due_date'),
                        user_id=current_user.id
                    )
                    db.add(new_task)
                    db.commit()
                    db.refresh(new_task)
                    results.append({"intent": "create_task", "success": True, "title": new_task.title})
                elif cmd_intent == "update_task":
                    task_identifier = cmd_params.get('task_identifier', '').lower()
                    task = db.query(models.Task).filter(
                        models.Task.user_id == current_user.id,
                        models.Task.title.ilike(f"%{task_identifier}%")
                    ).first()
                    
                    if task:
                        update_type = cmd_params.get('update_type', 'other')
                        new_value = cmd_params.get('new_value')
                        
                        if update_type == 'status':
                            task.status = new_value or 'completed'
                        elif update_type == 'priority':
                            task.priority = new_value or 'medium'
                        
                        db.commit()
                        results.append({"intent": "update_task", "success": True, "title": task.title})
                    else:
                        results.append({"intent": "update_task", "success": False, "title": task_identifier})
            
            # Generate response for chain
            response_parts = []
            for r in results:
                if r.get("intent") == "list_tasks" and r.get("tasks"):
                    task_list = "\n".join([f"• {t['title']} ({t['status']})" for t in r["tasks"][:10]])
                    response_parts.append(f"📋 Tasks found:\n{task_list}")
                elif r.get("intent") == "delete_task":
                    if r.get("success"):
                        response_parts.append(f"✅ Deleted: {r.get('title')}")
                    else:
                        response_parts.append(f"❌ Could not delete: {r.get('title')}")
                elif r.get("intent") == "create_task":
                    if r.get("success"):
                        response_parts.append(f"✅ Created: {r.get('title')}")
                elif r.get("intent") == "update_task":
                    if r.get("success"):
                        response_parts.append(f"✅ Updated: {r.get('title')}")
                    else:
                        response_parts.append(f"❌ Could not update: {r.get('title')}")
            
            response_text = " | ".join(response_parts)
            action = {"type": "chain", "results": results}
        elif intent == "unknown":
            # Use Gemini API to generate a helpful response for casual conversation
            try:
                # Get user's info for personalization
                user_name = current_user.full_name.split()[0] if current_user.full_name else "User"

                # Get user's tasks to provide context
                user_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).limit(5).all()
                tasks_context = "User tasks: " + json.dumps([
                    {"id": t.id, "title": t.title, "status": t.status, "priority": t.priority, "due_date": str(t.due_date)}
                    for t in user_tasks
                ], default=str)

                # Use Gemini API with natural conversation prompt
                if is_gemini_configured():
                    gemini_prompt = f"""User said: {chat_request.message}

You are TodoBot - a FRIENDLY, CONVERSATIONAL AI buddy who helps manage tasks.

IMPORTANT:
- Respond in NATURAL HUMAN LANGUAGE like a friendly friend
- Use Roman Urdu if user used Roman Urdu (words like "hai", "karo", "mera", "kya")
- Use emojis but not too many: 😊 ✅ 🎉 👍 🙏 ✨
- Be warm, friendly, conversational - NOT robotic!
- If user mentions a task, offer to create it
- Tasks context: {tasks_context}

Examples of GOOD responses:
- "Hey! 👋 Kya haal hai? Koi task add karna hai?"
- "Waah! Biryani! 😋 Main task bana doon 'Kal biryani khani hai'?"
- "Ho gaya bhai! ✅ Kuch aur chahiye?"
- "Arre yaar! 😅 Chalo koi task complete karte hain!"

Respond naturally and include ```json ``` block ONLY if you're creating/updating/deleting a task."""

                    try:
                        gemini_response = await call_gemini_api(gemini_prompt, SYSTEM_PROMPT)
                        if gemini_response:
                            response_text = gemini_response
                        else:
                            raise Exception("Gemini returned empty response")
                    except Exception as gemini_error:
                        print(f"Gemini error: {gemini_error}")
                        raise Exception("Gemini API failed")
                else:
                    raise Exception("Gemini API key not configured")

            except Exception as e:
                # Natural fallback responses when Gemini fails - friendly Roman Urdu
                import random
                fallbacks = [
                    "Arre yaar! 😅 Main samajh nahi aya, lekin help zaroor kar sakta hoon! Koi task add karna hai? 🤔",
                    "Hmm, thoda clear nahi hua! 😅 Par main tasks manage karne mein expert hoon! Kya karna hai? 💪",
                    "Bhai, main abhi seekh raha hoon! 😊 Try karo: 'task banao', 'tasks dikhao', ya 'meeting delete karo'! 📝",
                    "Oops! 😅 Dimagh kaam nahi kar raha! Par main ready hoon help ke liye! Kya kaam hai? 🚀",
                ]
                response_text = random.choice(fallbacks)
                print(f"Gemini error in chatbot: {e}")
        else:
            # Natural response for unmatched intents
            response_text = "Arre yaar! 😅 Main samajh nahi aya, lekin help zaroor kar sakta hoon! ✨\n\nKuch bhi karna ho - task banana, dekhna, delete karna - bas bolo! 😊"

        # Return response (JSON blocks are already embedded in response_text for DB actions)
        return ChatResponse(response=response_text, action=json_action)
    except Exception as e:
        print(f"Error in chat_with_bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to save chat messages to database
@router.post("/messages", response_model=schemas.ChatMessage)
async def save_chat_message(
    message_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """
    Save a chat message to the database
    Saves both user message and bot response as separate entries
    """
    try:
        message = message_data.get('message', '')
        response = message_data.get('response', '')
        sender = message_data.get('sender', 'user')

        print(f"💬 Saving chat message: user_id={current_user.id}, message='{message[:50]}...', sender={sender}")

        # Save user message
        user_chat_message = models.ChatMessage(
            user_id=current_user.id,
            message=message,
            response=None,
            sender='user'
        )
        db.add(user_chat_message)

        # Save bot response
        bot_chat_message = models.ChatMessage(
            user_id=current_user.id,
            message=response,
            response=None,
            sender='bot'
        )
        db.add(bot_chat_message)

        db.commit()
        db.refresh(user_chat_message)
        db.refresh(bot_chat_message)

        print(f"✅ Messages saved successfully! IDs: user={user_chat_message.id}, bot={bot_chat_message.id}")

        return user_chat_message
    except Exception as e:
        print(f"❌ ERROR saving chat message: {e}")
        raise

# Endpoint to get chat history
@router.get("/messages", response_model=list[schemas.ChatMessage])
async def get_chat_history(
    limit: int = 50,
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """
    Get chat history for the current user
    """
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.desc()).limit(limit).all()
    return messages

# Endpoint to clear chat history
@router.delete("/messages")
async def clear_chat_history(
    current_user: models.User = Depends(auth.get_current_user),
    db = Depends(database.get_db)
):
    """
    Clear chat history for the current user
    """
    db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "Chat history cleared"}
