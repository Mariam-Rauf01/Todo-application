"""
HuggingFace Spaces Entry Point
This file is required by HuggingFace Spaces configuration.
The actual app runs via Docker (see Dockerfile).
"""

import os
import sys

def main():
    print("=" * 50)
    print("AI Task Manager - HuggingFace Spaces")
    print("=" * 50)
    print("This Space uses Docker for deployment.")
    print("The application is configured in Dockerfile.")
    print("")
    print("Environment variables:")
    for key in ['SECRET_KEY', 'DATABASE_URL', 'OPENAI_API_KEY']:
        value = os.getenv(key, '(not set)')
        if key == 'OPENAI_API_KEY' and value != '(not set)':
            value = value[:10] + '...'
        print(f"  {key}: {value}")
    print("")
    print("Access the app at: https://<your-space>.hf.space")
    print("=" * 50)

if __name__ == "__main__":
    main()
