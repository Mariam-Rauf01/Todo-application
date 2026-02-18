---
title: AI Task Manager
emoji: 🤖📋
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: AI-powered task manager with authentication, recurring tasks, real-time notifications, analytics, and GPT assistant.
---

# AI Task Manager - HuggingFace Spaces Deployment

This is a full-stack AI-powered task manager application deployed on HuggingFace Spaces (backend only).

## Features

- ✅ User Authentication (Signup/Login)
- ✅ Task Management (Create, Read, Update, Delete)
- ✅ AI Assistant for task help (powered by OpenAI GPT)
- ✅ Recurring tasks support
- ✅ Analytics dashboard
- ✅ Real-time notifications

## Tech Stack

- **Frontend**: Next.js 14 (deployed separately on Vercel)
- **Backend**: FastAPI (Python 3.11)
- **Database**: SQLite (for demo) or PostgreSQL (Neon)
- **AI**: OpenAI GPT integration
- **Deployment**: Docker (Hugging Face Spaces)

## Deployment to HuggingFace Spaces

### Prerequisites

1. A GitHub account
2. A HuggingFace account

### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add HuggingFace Spaces config"
   git push origin main