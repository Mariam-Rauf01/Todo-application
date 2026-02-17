"""
Create all database tables in Neon PostgreSQL
Run this script to initialize your database
"""
from app.database import engine, Base
from app import models

def create_tables():
    print("Creating database tables in Neon PostgreSQL...")
    print(f"Database URL: {engine.url}")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("SUCCESS: Database tables created!")
        print("\nTables created:")
        print("  - users (for user accounts)")
        print("  - tasks (for todo tasks)")
        print("  - chat_messages (for chat history)")
        print("\nYour Neon database is ready!")
    except Exception as e:
        print(f"ERROR creating tables: {e}")
        print("\nMake sure:")
        print("  1. Your DATABASE_URL is correct in .env file")
        print("  2. You have internet connection")
        print("  3. Neon database is accessible")
        raise

if __name__ == "__main__":
    create_tables()
