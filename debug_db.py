import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

print("Environment loaded")

# Import database components
from app.database import engine
from app import models
import sqlalchemy.exc

print("Modules imported")

try:
    # Test basic connection
    with engine.connect() as conn:
        print("Basic connection successful")
        result = conn.execute(sqlalchemy.text("SELECT version();"))
        version = result.scalar()
        print(f"Database version: {version}")
        
    # Test table creation
    print("Attempting to create tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Tables created successfully")
    
    # Test session creation
    from app.database import SessionLocal
    db = SessionLocal()
    print("Session created successfully")
    
    # Test user query
    from app import models
    users = db.query(models.User).limit(1).all()
    print(f"Query successful, found {len(users)} users")
    
    db.close()
    print("Database test completed successfully")
    
except Exception as e:
    print(f"Database test failed: {e}")
    import traceback
    traceback.print_exc()