#!/usr/bin/env python
"""
Application startup script that ensures models are properly loaded
before creating database tables.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# Import models FIRST to register them with Base
from app import models
from app import auth, tasks, legacy_routes
from app.database import engine, Base

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("The application will start without database tables.")

app = FastAPI(title="AI-Powered Todo Web Application")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(legacy_routes.router, prefix="/api/tasks", tags=["legacy"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-Powered Todo Web Application"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)