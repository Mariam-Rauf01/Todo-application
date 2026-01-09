# Database Schema: AI-Powered Todo Application

## Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Tasks Table

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(100),
    recurrence_pattern VARCHAR(100)  -- e.g., 'daily', 'weekly', 'monthly'
);
```

## Indexes

```sql
-- Index for user's tasks lookup
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Index for task status filtering
CREATE INDEX idx_tasks_status ON tasks(status);

-- Index for due date sorting
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Index for category filtering
CREATE INDEX idx_tasks_category ON tasks(category);

-- Index for priority sorting
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Composite index for common queries
CREATE INDEX idx_tasks_user_status_priority ON tasks(user_id, status, priority);
```

## Sample Data

```sql
-- Sample user
INSERT INTO users (email, password_hash, name)
VALUES ('user@example.com', '$2b$12$hashed_password_here', 'John Doe');

-- Sample tasks
INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
VALUES
  (
    (SELECT id FROM users WHERE email = 'user@example.com'),
    'Buy groceries',
    'Milk, bread, eggs',
    'pending',
    'medium',
    'personal',
    '2025-12-31T23:59:59Z'::TIMESTAMP WITH TIME ZONE
  ),
  (
    (SELECT id FROM users WHERE email = 'user@example.com'),
    'Complete project',
    'Finish the AI-powered todo app',
    'pending',
    'high',
    'work',
    '2025-01-05T23:59:59Z'::TIMESTAMP WITH TIME ZONE
  );
```