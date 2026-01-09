from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from . import auth, tasks
from .database import engine, Base

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-Powered Todo Web Application"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}