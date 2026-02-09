import psycopg2
from config import DATABASE_URL
from urllib.parse import urlparse


def get_db_connection():
    """
    Creates and returns a PostgreSQL database connection using the configured DATABASE_URL
    """
    try:
        # Parse the database URL
        parsed_url = urlparse(DATABASE_URL)
        
        # Extract connection parameters
        connection_params = {
            'host': parsed_url.hostname,
            'database': parsed_url.path[1:],  # Remove leading '/'
            'user': parsed_url.username,
            'password': parsed_url.password,
            'port': parsed_url.port,
        }
        
        # Establish connection
        conn = psycopg2.connect(**connection_params)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise


def test_connection():
    """
    Test the database connection
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        db_version = cursor.fetchone()
        print(f"Connected to PostgreSQL database. Version: {db_version[0]}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return False


if __name__ == "__main__":
    test_connection()