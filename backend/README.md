---
title: TaskMate Todo App
emoji: 📝
colorFrom: blue
colorTo: green
sdk: docker
python_version: "3.11"
pinned: false
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# TaskMate Todo App

A full-featured todo application built with FastAPI and PostgreSQL.

## Features

- User authentication (signup/login)
- Task management (create, read, update, delete)
- Task recurrence patterns
- Real-time notifications
- Analytics dashboard
- Chatbot integration

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **Deployment**: Docker

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload

# Or use the simple server
python simple_server.py
```

## API Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /tasks` - Get all tasks
- `POST /tasks` - Create a task
- `PUT /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
