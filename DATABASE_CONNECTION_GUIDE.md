# PostgreSQL Database Connection Guide

## Connection Details

Your application is connected to a PostgreSQL database hosted on Neon with the following connection string:

```
postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Files Created

1. **config.py** - Contains the database connection string
2. **db_connection.py** - Basic database connection implementation
3. **db_utils.py** - Advanced database utilities with connection pooling
4. **test_db_connection.py** - Test script to verify the database connection
5. **example_usage.py** - Practical example showing how to use the database

## Key Features

- Thread-safe connection pooling for optimal performance
- Proper error handling and connection management
- SSL encryption enabled for secure connections
- Ready-to-use functions for common database operations

## How to Use

### Basic Connection
```python
from db_utils import get_db_connection, release_db_connection

# Get a connection from the pool
conn = get_db_connection()

# Use the connection
cursor = conn.cursor()
cursor.execute("SELECT * FROM users;")
results = cursor.fetchall()

# Return the connection to the pool
release_db_connection(conn)
```

### Execute Queries
```python
from db_utils import execute_query

# Execute a SELECT query
results = execute_query("SELECT * FROM tasks;", fetch=True)

# Execute an INSERT/UPDATE/DELETE query
execute_query("INSERT INTO tasks (title, user_id) VALUES (%s, %s);", (title, user_id))
```

### Test the Connection
```bash
python test_db_connection.py
```

### Example Usage
```bash
python example_usage.py
```

## Database Schema

The database includes two main tables that match your existing backend:

### users table
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE NOT NULL)
- hashed_password (VARCHAR NOT NULL)
- full_name (VARCHAR NOT NULL)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### tasks table
- id (SERIAL PRIMARY KEY)
- title (VARCHAR NOT NULL)
- description (TEXT)
- status (VARCHAR DEFAULT 'pending')
- user_id (INTEGER REFERENCES users.id NOT NULL)
- created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- due_date (TIMESTAMP)
- priority (VARCHAR DEFAULT 'medium')
- category (VARCHAR)
- recurrence_pattern (VARCHAR)
- recurrence_end_date (TIMESTAMP)
- recurrence_interval (INTEGER DEFAULT 1)
- parent_task_id (INTEGER)
- next_occurrence (TIMESTAMP)

## Troubleshooting

If you encounter connection issues:
1. Verify your internet connection
2. Check that the database URL in config.py is correct
3. Ensure the required packages are installed: `pip install psycopg2-binary`
4. Confirm that SSL settings are properly configured for Neon

## Security Notes

- The connection uses SSL encryption as required by Neon
- Connection pooling helps manage resources efficiently
- Always return connections to the pool after use
- Use parameterized queries to prevent SQL injection