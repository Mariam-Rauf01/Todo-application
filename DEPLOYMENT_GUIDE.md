# Complete Deployment Guide - Backend + Frontend

## Current Architecture

- **Backend (FastAPI)**: Deployed on HuggingFace Spaces
  - URL: `https://mariam-rauf01-taskmate-todo-app.hf.space`
  - API endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/tasks`, etc.
  
- **Frontend (Next.js)**: Needs to be deployed on Vercel
  - Will have pages: `/signup`, `/login`, `/tasks`
  - Connects to backend via `NEXT_PUBLIC_BACKEND_URL`

## Problem You're Facing

You're accessing `https://mariam-rauf01-taskmate-todo-app.hf.space/signup` which returns 404 because:
- HuggingFace only has the **backend API** (no frontend UI)
- `/signup` is a **frontend route**, not a backend route

## Solution: Deploy Frontend to Vercel

### Step 1: Push Frontend Changes to GitHub

```bash
cd "c:\Users\HAROON TRADERS\OneDrive\Desktop\hackthon 2"
git add .
git commit -m "Fix password hashing and update deployment config"
git push origin main
```

### Step 2: Deploy Frontend on Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Import Project**:
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose: `Mariam-Rauf01/Todo-application`
   
3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (click "Edit" and enter this)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   
4. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_BACKEND_URL = https://mariam-rauf01-taskmate-todo-app.hf.space
   DATABASE_URL = postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

5. **Click "Deploy"**

6. **Wait 2-3 minutes** for deployment

7. **Get Your Frontend URL**:
   - Vercel will give you: `https://todo-application-xxxx.vercel.app`
   - Or use your custom domain if configured

### Step 3: Access Signup Page

After Vercel deployment:
- Frontend URL: `https://todo-application-xxxx.vercel.app`
- Signup page: `https://todo-application-xxxx.vercel.app/signup`
- Login page: `https://todo-application-xxxx.vercel.app/login`

### Step 4: Test Signup

1. Go to your Vercel frontend URL
2. Click "Sign Up"
3. Enter:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `lioness` (7 chars - should work now!)
4. Click "Create Account"
5. Should redirect to login page ✅

## Alternative: Use Existing Frontend URL

If you already have a Vercel deployment:

1. Go to https://vercel.com/dashboard
2. Find your project
3. Click on it
4. Copy the URL (e.g., `https://your-app.vercel.app`)
5. Access: `https://your-app.vercel.app/signup`

## Verify Backend is Working

Test the backend API directly:

```bash
# Test health endpoint
curl https://mariam-rauf01-taskmate-todo-app.hf.space/health

# Test signup via API
curl -X POST https://mariam-rauf01-taskmate-todo-app.hf.space/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"lioness","full_name":"Test User"}'
```

Expected response:
```json
{
  "id": 1,
  "email": "test@example.com",
  "full_name": "Test User",
  ...
}
```

If you get this, backend is working! ✅

## Troubleshooting

### Frontend shows "Unable to connect to server"

1. Check Vercel environment variables
2. Verify `NEXT_PUBLIC_BACKEND_URL` is correct
3. Check browser console (F12) for errors

### Backend still shows password error

1. Go to HuggingFace Space Settings
2. Click "Factory reboot"
3. Wait 3 minutes
4. Test again

### Vercel build fails

1. Check Vercel deployment logs
2. Ensure `frontend` folder exists
3. Verify `frontend/package.json` has correct scripts

## Quick Summary

| Component | Platform | URL | Purpose |
|-----------|----------|-----|---------|
| Backend | HuggingFace | `https://...hf.space` | API only |
| Frontend | Vercel | `https://...vercel.app` | UI pages |

**You need BOTH deployed to use the app!**
