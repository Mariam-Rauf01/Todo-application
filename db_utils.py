import psycopg2
from psycopg2 import pool
from config import DATABASE_URL
from urllib.parse import urlparse
import threading


class DatabaseConnectionPool:
    """
    A thread-safe database connection pool for PostgreSQL
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'pool'):
            self.pool = self._create_pool()

    def _create_pool(self):
        """
        Creates a connection pool based on the DATABASE_URL
        """
        try:
            parsed_url = urlparse(DATABASE_URL)
            
            connection_params = {
                'minconn': 1,
                'maxconn': 10,
                'host': parsed_url.hostname,
                'database': parsed_url.path[1:],  # Remove leading '/'
                'user': parsed_url.username,
                'password': parsed_url.password,
                'port': parsed_url.port,
            }
            
            # Create connection pool
            p = psycopg2.pool.ThreadedConnectionPool(**connection_params)
            print("PostgreSQL connection pool created successfully")
            return p
        except Exception as e:
            print(f"Error creating connection pool: {e}")
            raise

    def get_connection(self):
        """
        Get a connection from the pool
        """
        return self.pool.getconn()

    def put_connection(self, conn):
        """
        Return a connection to the pool
        """
        self.pool.putconn(conn)

    def close_all_connections(self):
        """
        Close all connections in the pool
        """
        self.pool.closeall()


def get_db_connection():
    """
    Get a database connection from the connection pool
    """
    db_pool = DatabaseConnectionPool()
    return db_pool.get_connection()


def release_db_connection(conn):
    """
    Release a database connection back to the pool
    """
    db_pool = DatabaseConnectionPool()
    db_pool.put_connection(conn)


def execute_query(query, params=None, fetch=False):
    """
    Execute a query using a connection from the pool
    
    Args:
        query (str): SQL query to execute
        params (tuple, optional): Query parameters
        fetch (bool): Whether to fetch results
    
    Returns:
        Query results if fetch=True, otherwise None
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        if fetch:
            result = cursor.fetchall()
            conn.commit()
            return result
        else:
            conn.commit()
            return cursor.rowcount
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn:
            release_db_connection(conn)


def test_connection():
    """
    Test the database connection pool
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        db_version = cursor.fetchone()
        print(f"Connected to PostgreSQL database using connection pool. Version: {db_version[0]}")
        cursor.close()
        release_db_connection(conn)
        return True
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return False


if __name__ == "__main__":
    test_connection()