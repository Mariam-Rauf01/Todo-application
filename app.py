"""
TaskMate Todo App - Main Entry Point
This file serves as the entry point for HuggingFace Spaces deployment.
"""

import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=7860,
        reload=False
    )
