# AI Chatbot Feature Specification

## Overview
- **Feature Name**: AI-Powered Natural Language Task Assistant
- **Version**: 1.0.0
- **Status**: Implemented
- **Target Users**: Task management application users who want voice/text-based task management

---

## User Stories

### 1. Natural Language Task Management
**As a** user,  
**I want to** create, read, update, and delete tasks using natural language,  
**So that** I can manage my tasks quickly without navigating UI

### 2. Identity Query
**As a** user,  
**I want to** ask "Who am I?" and get my account email,  
**So that** I can verify my logged-in identity

### 3. Confirmation for Destructive Actions
**As a** user,  
**I want to** confirm before deleting or updating tasks,  
**So that** I don't accidentally modify tasks

### 4. Chained Commands
**As a** user,  
**I want to** chain multiple actions in one command,  
**So that** I can perform complex operations efficiently

---

## Functional Requirements

### FR-1: Natural Language Task Operations
- [x] FR-1.1: Create task using "create task: X" or "add task: X"
- [x] FR-1.2: List tasks using "show tasks" or "list tasks"
- [x] FR-1.3: Delete task using "delete task: X"
- [x] FR-1.4: Update task using "update task: X to Y"
- [x] FR-1.5: Complete task using "done: X" or "complete: X"

### FR-2: Identity Query
- [x] FR-2.1: Respond to "Who am I?" with user's email
- [x] FR-2.2: Support variations: "my email", "tell me about me"

### FR-3: Confirmation System
- [x] FR-3.1: Ask for confirmation before delete operations
- [x] FR-3.2: Ask for confirmation before update operations
- [x] FR-3.3: Support yes/no confirmation in multiple languages

### FR-4: Command Chaining
- [x] FR-4.1: Parse commands joined by "and", "then", ","
- [x] FR-4.2: Execute multiple commands sequentially
- [x] FR-4.3: Return combined results to user

### FR-5: Multilingual Support
- [x] FR-5.1: Support English
- [x] FR-5.2: Support Urdu (native script)
- [x] FR-5.3: Support Hindi
- [x] FR-5.4: Support Roman Urdu

---

## Technical Implementation

### Backend
- **File**: `backend/app/chatbot.py`
- **Framework**: FastAPI
- **Database**: SQLite (development) / PostgreSQL (production)
- **NLP**: Regex-based pattern matching + OpenAI fallback

### Frontend
- **File**: `frontend/app/components/FloatingChatbot.tsx`
- **Framework**: Next.js + React
- **Styling**: Tailwind CSS
- **State**: React useState/useEffect

---

## API Endpoints

### POST /api/chatbot/chat
```json
Request:
{
  "message": "create task: Buy groceries"
}

Response:
{
  "response": "✅ Task created: 'Buy groceries'",
  "action": {
    "type": "create_task",
    "data": { "id": 1, "title": "Buy groceries" }
  }
}
```

---

## Acceptance Criteria

- [x] User can create tasks using natural language
- [x] User can list tasks using natural language
- [x] User can delete tasks with confirmation
- [x] User can update tasks with confirmation
- [x] User can ask "Who am I?" and receive email
- [x] User can chain commands like "list tasks and delete first"
- [x] Chatbot responds in user's language (EN/UR/HI/RU)
- [x] Error handling for failed operations
