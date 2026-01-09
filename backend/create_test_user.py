#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User
from app.utils import get_password_hash

def create_test_user():
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created")

    db = SessionLocal()
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("Test user already exists!")
            return

        # Create test user
        hashed_password = get_password_hash("password123")
        test_user = User(
            email="test@example.com",
            full_name="Test User",
            hashed_password=hashed_password
        )

        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        print("✅ Test user created successfully!")
        print("Email: test@example.com")
        print("Password: password123")

    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()