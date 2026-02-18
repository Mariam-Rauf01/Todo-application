import psycopg2
from urllib.parse import urlparse
import sys

# Use the database URL you provided
DATABASE_URL = 'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

def test_connection():
    try:
        print("Attempting to connect to the database...")
        print(f"Database URL: {DATABASE_URL}")
        
        # Parse the database URL
        parsed_url = urlparse(DATABASE_URL)
        print(f"Hostname: {parsed_url.hostname}")
        print(f"Port: {parsed_url.port}")
        print(f"Database: {parsed_url.path[1:]}")  # Remove leading slash
        print(f"Username: {parsed_url.username}")
        
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Test the connection with a simple query
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        print(f"Connected successfully! Database version: {db_version[0]}")
        
        # Test if our expected tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = cursor.fetchall()
        print(f"Tables in database: {[table[0] for table in tables]}")
        
        cursor.close()
        conn.close()
        print("Connection closed.")
        
        return True
        
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if success:
        print("\nDatabase connection test PASSED!")
    else:
        print("\nDatabase connection test FAILED!")
        sys.exit(1)