---
title: AI Task Manager
emoji: ✅
colorFrom: blue
colorTo: green
sdk: docker
sdk_version: ""
app_file: app.py
pinned: false
---

# AI Task Manager

A full-stack AI-powered task manager application.

## Features

- ✅ User Authentication (Signup/Login)
- ✅ Task Management (Create, Read, Update, Delete)
- ✅ AI Assistant for task help
- ✅ Recurring tasks support
- ✅ Analytics dashboard
- ✅ Real-time notifications

## Tech Stack

- **Frontend**: Next.js 14
- **Backend**: FastAPI (Python 3.11)
- **Database**: SQLite (for demo) or PostgreSQL (Neon)
- **AI**: OpenAI GPT integration
- **Deployment**: Docker

## Quick Deploy to HuggingFace Spaces

[![Deploy to HuggingFace Spaces](https://huggingface.co/datasets/huggingface/badges/resolve/main/deploy-to-spaces-lg.svg)](https://huggingface.co/new-space?template=https://github.com/<your-username>/<your-repo>)

### Prerequisites

1. A GitHub account
2. A HuggingFace account

### Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add HuggingFace Spaces config"
   git push origin main
   ```

2. **Create Space on HuggingFace**
   - Go to https://huggingface.co/spaces
   - Click "Create new Space"
   - Fill in:
     - Owner: Your username
     - Space name: ai-task-manager
     - SDK: Docker
     - Visibility: Public or Private
   - Under "Link to your GitHub repository", connect your repo

3. **Environment Variables**
   Go to Space Settings → Repository secrets and add:
   - `SECRET_KEY`: Generate a secure key
   - `DATABASE_URL`: (Optional) PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key (for AI features)

4. **Build & Deploy**
   HuggingFace will automatically build your Docker container and deploy it.

## Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd <repo-name>

# Build and run with Docker
docker build -t ai-task-manager .
docker run -p 7860:7860 ai-task-manager
```

Or run individually:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |

## Troubleshooting

### Build fails
- Make sure your Dockerfile is at the root
- Check that all paths in Dockerfile are correct

### Database errors
- Ensure DATABASE_URL is set in Space secrets
- For local dev, a SQLite database will be created automatically

### API errors
- Check Space logs in HuggingFace dashboard
- Verify all required environment variables are set

## License

MIT
