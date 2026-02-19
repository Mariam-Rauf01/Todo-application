import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app import models, schemas, utils
from app.database import SessionLocal

def test_signup():
    print("Testing signup process...")
    
    # Create a database session
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == 'testuser@example.com').first()
        print(f"Existing user check: {existing_user}")
        
        if existing_user:
            print("User already exists, skipping creation")
            return
        
        # Create user data
        user_data = schemas.UserCreate(
            email="testuser@example.com",
            full_name="Test User",
            password="testpassword"
        )
        
        print(f"User data created: {user_data}")
        
        # Hash the password
        hashed_password = utils.get_password_hash(user_data.password)
        print(f"Password hashed: {hashed_password[:20]}...")
        
        # Create new user
        db_user = models.User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password
        )
        
        print(f"User object created: {db_user.email}, {db_user.full_name}")
        
        db.add(db_user)
        print("Added user to session")
        
        db.commit()
        print("Transaction committed")
        
        db.refresh(db_user)
        print(f"User created successfully with ID: {db_user.id}")
        
        # Verify the user was created
        verified_user = db.query(models.User).filter(models.User.email == 'testuser@example.com').first()
        print(f"Verified user exists: {verified_user is not None}")
        if verified_user:
            print(f"Verified user ID: {verified_user.id}, Email: {verified_user.email}")
        
    except Exception as e:
        print(f"Error during signup test: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
        print("Session closed")

if __name__ == "__main__":
    test_signup()