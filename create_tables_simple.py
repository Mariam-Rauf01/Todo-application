#!/usr/bin/env python
"""
Simple script to create database tables in Neon PostgreSQL
"""
import os

# Set the DATABASE_URL directly
DATABASE_URL = "postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

os.environ['DATABASE_URL'] = DATABASE_URL

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Create engine
engine = create_engine(DATABASE_URL)

# Create tables using raw SQL
with engine.connect() as conn:
    # Create users table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR NOT NULL UNIQUE,
            hashed_password VARCHAR NOT NULL,
            full_name VARCHAR NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    # Create tasks table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR NOT NULL,
            description TEXT,
            status VARCHAR DEFAULT 'pending',
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            due_date TIMESTAMP WITH TIME ZONE,
            priority VARCHAR DEFAULT 'medium',
            category VARCHAR,
            recurrence_pattern VARCHAR,
            recurrence_end_date TIMESTAMP WITH TIME ZONE,
            recurrence_interval INTEGER DEFAULT 1,
            parent_task_id INTEGER REFERENCES tasks(id),
            next_occurrence TIMESTAMP WITH TIME ZONE
        )
    """))
    
    # Create chat_messages table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            response TEXT,
            sender VARCHAR DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    conn.commit()

print("SUCCESS: All database tables created!")
print("- users table")
print("- tasks table")
print("- chat_messages table")
