from db_utils import test_connection, execute_query
import psycopg2


def setup_sample_table():
    """
    Create a sample table to test the database connection
    """
    try:
        # Create a sample table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS sample_users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        rows_affected = execute_query(create_table_query)
        print(f"Table creation executed. Rows affected: {rows_affected}")
        
        # Insert sample data
        insert_query = """
        INSERT INTO sample_users (name, email) 
        VALUES (%s, %s) 
        ON CONFLICT (email) DO NOTHING;
        """
        sample_data = [
            ("John Doe", "john@example.com"),
            ("Jane Smith", "jane@example.com"),
            ("Bob Johnson", "bob@example.com")
        ]
        
        for name, email in sample_data:
            execute_query(insert_query, (name, email))
            print(f"Inserted user: {name}")
        
        # Query the data
        select_query = "SELECT * FROM sample_users;"
        results = execute_query(select_query, fetch=True)
        
        print("\nSample Users:")
        for row in results:
            print(f"ID: {row[0]}, Name: {row[1]}, Email: {row[2]}, Created: {row[3]}")
            
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    print("Testing database connection...")
    
    # Test the connection
    if test_connection():
        print("Connection successful!")
        
        # Setup and test with sample data
        setup_sample_table()
    else:
        print("Connection failed!")