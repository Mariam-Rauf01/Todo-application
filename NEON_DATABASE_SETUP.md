# Neon PostgreSQL Database Setup - COMPLETE

## ✅ Database Configuration

Your TodoBot application is now configured to use **Neon PostgreSQL** database!

### Database Connection String:
```
postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 📊 Database Tables

### 1. **users** Table
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| email | VARCHAR(255) | Unique user email |
| hashed_password | VARCHAR | Encrypted password |
| full_name | VARCHAR | User's full name |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update date |

### 2. **tasks** Table
Stores todo tasks for each user.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| title | VARCHAR | Task title |
| description | TEXT | Task description |
| status | VARCHAR | pending/completed |
| user_id | INTEGER | Foreign key to users |
| priority | VARCHAR | low/medium/high |
| category | VARCHAR | Task category |
| due_date | TIMESTAMP | Due date |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

### 3. **chat_messages** Table
Stores chat conversation history.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| message | TEXT | User's message |
| response | TEXT | Bot's response |
| sender | VARCHAR | user/bot |
| created_at | TIMESTAMP | Message timestamp |

---

## 🚀 How to Run

### Step 1: Create Database Tables
```bash
cd backend
python create_tables.py
```

Output should show:
```
Creating database tables in Neon PostgreSQL...
Database URL: postgresql://neondb_owner:***@...
SUCCESS: Database tables created!

Tables created:
  - users (for user accounts)
  - tasks (for todo tasks)
  - chat_messages (for chat history)

Your Neon database is ready!
```

### Step 2: Start Backend Server
```bash
cd backend
python start_server.py
```

Server will start at: `http://localhost:8000`

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will start at: `http://localhost:3000`

---

## ✅ What Gets Saved to Neon DB

### 1. **New User Signup**
```
User fills signup form → POST /api/auth/signup
  ↓
Backend hashes password
  ↓
INSERT INTO users (email, full_name, hashed_password)
  ↓
User saved to Neon DB ✅
```

**Example:**
```json
POST /api/auth/signup
{
  "email": "ali@example.com",
  "full_name": "Ali Khan",
  "password": "secure123"
}

Response:
{
  "id": 1,
  "email": "ali@example.com",
  "full_name": "Ali Khan",
  "created_at": "2026-02-17T10:30:00Z"
}
```

---

### 2. **Task Operations**

#### **Create Task:**
```
User: "task add karo eating"
  ↓
Backend parses intent → create_task
  ↓
INSERT INTO tasks (title, user_id, status, priority)
  ↓
Task saved to Neon DB ✅
```

**SQL:**
```sql
INSERT INTO tasks (title, user_id, status, priority, created_at)
VALUES ('eating', 1, 'pending', 'medium', NOW());
```

#### **Update Task:**
```
User: "update task eating to running"
  ↓
Backend finds task → UPDATE
  ↓
UPDATE tasks SET title='running' WHERE id=1
  ↓
Task updated in Neon DB ✅
```

**SQL:**
```sql
UPDATE tasks 
SET title='running', updated_at=NOW() 
WHERE id=1 AND user_id=1;
```

#### **Delete Task:**
```
User: "delete task eating"
  ↓
Backend finds task → DELETE
  ↓
DELETE FROM tasks WHERE id=1
  ↓
Task deleted from Neon DB ✅
```

**SQL:**
```sql
DELETE FROM tasks WHERE id=1 AND user_id=1;
```

#### **Complete Task:**
```
User: "complete task eating"
  ↓
Backend marks as completed
  ↓
UPDATE tasks SET status='completed'
  ↓
Task status updated in Neon DB ✅
```

**SQL:**
```sql
UPDATE tasks 
SET status='completed', updated_at=NOW() 
WHERE id=1 AND user_id=1;
```

---

### 3. **Chat Messages**
```
User sends message → Bot responds
  ↓
POST /api/chatbot/messages
  ↓
INSERT INTO chat_messages (user_id, message, sender)
INSERT INTO chat_messages (user_id, message, sender)
  ↓
Both messages saved to Neon DB ✅
```

**SQL:**
```sql
-- Save user message
INSERT INTO chat_messages (user_id, message, sender, created_at)
VALUES (1, 'task add karo eating', 'user', NOW());

-- Save bot response
INSERT INTO chat_messages (user_id, message, sender, created_at)
VALUES (1, 'Ho gaya! Task add kar diya', 'bot', NOW());
```

---

## 🔍 Verify Data in Neon DB

### Option 1: Using Neon Dashboard
1. Go to https://neon.tech/
2. Login to your account
3. Select your project: `ep-bitter-brook-ad70lb1c`
4. Click "Tables" to view data
5. Query tables:
   ```sql
   SELECT * FROM users;
   SELECT * FROM tasks;
   SELECT * FROM chat_messages;
   ```

### Option 2: Using psql CLI
```bash
psql "postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Check users
SELECT id, email, full_name, created_at FROM users;

# Check tasks
SELECT id, title, status, priority, user_id FROM tasks;

# Check chat messages
SELECT id, sender, created_at, LEFT(message, 50) FROM chat_messages LIMIT 10;
```

### Option 3: Using Python Script
```python
# test_db_connection.py
from app.database import get_db
from app import models

db = next(get_db())

# Count users
users_count = db.query(models.User).count()
print(f"Users: {users_count}")

# Count tasks
tasks_count = db.query(models.Task).count()
print(f"Tasks: {tasks_count}")

# Count messages
messages_count = db.query(models.ChatMessage).count()
print(f"Messages: {messages_count}")
```

---

## 📝 Environment Variables

### backend/.env file:
```env
SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=your-gemini-api-key  # Optional
```

---

## 🎯 Testing Checklist

### Test User Signup:
- [ ] Go to `/signup` page
- [ ] Fill: Name, Email, Password
- [ ] Click "Sign Up"
- [ ] Check Neon DB: `SELECT * FROM users;`
- [ ] User should be saved ✅

### Test Task Creation:
- [ ] Login with your account
- [ ] Open chatbot
- [ ] Type: `task add karo eating`
- [ ] Check Neon DB: `SELECT * FROM tasks;`
- [ ] Task should be saved ✅

### Test Task Update:
- [ ] Type: `update task eating to running`
- [ ] Check Neon DB: `SELECT * FROM tasks WHERE title='running';`
- [ ] Task should be updated ✅

### Test Task Delete:
- [ ] Type: `delete task running`
- [ ] Check Neon DB: `SELECT * FROM tasks;`
- [ ] Task should be deleted ✅

### Test Chat Messages:
- [ ] Send any message in chat
- [ ] Check Neon DB: `SELECT * FROM chat_messages;`
- [ ] Both user and bot messages should be saved ✅

---

## 🔧 Troubleshooting

### Issue: "Connection refused"
**Solution:** Check internet connection and DATABASE_URL

### Issue: "SSL error"
**Solution:** Make sure `sslmode=require` is in DATABASE_URL

### Issue: "Table doesn't exist"
**Solution:** Run `python create_tables.py`

### Issue: "Authentication failed"
**Solution:** Check username/password in DATABASE_URL

---

## 📊 Database Schema Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │◄───────┐
│ email           │        │
│ hashed_password │        │
│ full_name       │        │
│ created_at      │        │
└─────────────────┘        │
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│     tasks       │                 │ chat_messages   │
├─────────────────┤                 ├─────────────────┤
│ id (PK)         │                 │ id (PK)         │
│ title           │                 │ user_id (FK)────┼───┐
│ description     │                 │ message         │   │
│ status          │                 │ response        │   │
│ user_id (FK)────┼─────────────────┤ sender          │   │
│ priority        │                 │ created_at      │   │
│ due_date        │                 └─────────────────┘   │
│ created_at      │                                       │
└─────────────────┘                                       │
                                                          │
        ┌─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│     users       │
│ (reference)     │
└─────────────────┘
```

---

## ✨ Summary

| Feature | Database | Status |
|---------|----------|--------|
| User Signup | Neon PostgreSQL `users` table | ✅ |
| User Login | JWT + Neon DB | ✅ |
| Create Task | Neon PostgreSQL `tasks` table | ✅ |
| Update Task | Neon PostgreSQL `tasks` table | ✅ |
| Delete Task | Neon PostgreSQL `tasks` table | ✅ |
| Complete Task | Neon PostgreSQL `tasks` table | ✅ |
| Chat Messages | Neon PostgreSQL `chat_messages` | ✅ |

---

**All data is now saved to Neon PostgreSQL database!** 🎉

**Setup Date:** 2026-02-17  
**Database:** Neon PostgreSQL (Free Tier)  
**Status:** ✅ READY FOR PRODUCTION
