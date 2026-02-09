"""
Example application demonstrating how to use the PostgreSQL database connection
"""

from db_utils import execute_query
import json


def create_users_and_tasks_tables():
    """Create users and tasks tables if they don't exist"""
    # Create users table
    users_query = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    execute_query(users_query)
    print("Users table created or already exists.")
    
    # Create tasks table
    tasks_query = """
    CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        user_id INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP,
        priority VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(255),
        recurrence_pattern VARCHAR(50),
        recurrence_end_date TIMESTAMP,
        recurrence_interval INTEGER DEFAULT 1,
        parent_task_id INTEGER,
        next_occurrence TIMESTAMP
    );
    """
    execute_query(tasks_query)
    print("Tasks table created or already exists.")


def get_or_create_user(email, hashed_password, full_name):
    """Get existing user or create a new one if not exists"""
    # Try to get existing user
    query = "SELECT id FROM users WHERE email = %s;"
    result = execute_query(query, (email,), fetch=True)
    
    if result:
        user_id = result[0][0]
        print(f"Using existing user with ID: {user_id}")
        return user_id
    else:
        # Create new user
        query = """
        INSERT INTO users (email, hashed_password, full_name)
        VALUES (%s, %s, %s)
        RETURNING id;
        """
        result = execute_query(query, (email, hashed_password, full_name))
        print(f"New user added with ID: {result}")
        return result

def add_task(title, user_id, description="", due_date=None, status="pending"):
    """Add a new task to the database"""
    query = """
    INSERT INTO tasks (title, description, status, user_id, due_date)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING id;
    """
    result = execute_query(query, (title, description, status, user_id, due_date))
    print(f"New task added with ID: {result}")
    return result


def get_all_tasks():
    """Retrieve all tasks from the database"""
    query = "SELECT id, title, description, status, user_id, created_at, due_date, priority, category FROM tasks ORDER BY created_at DESC;"
    results = execute_query(query, fetch=True)
    
    tasks = []
    for row in results:
        task = {
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'status': row[3],
            'user_id': row[4],
            'created_at': str(row[5]),
            'due_date': str(row[6]) if row[6] else None,
            'priority': row[7],
            'category': row[8]
        }
        tasks.append(task)
    
    return tasks


def update_task(task_id, title=None, description=None, status=None):
    """Update an existing task"""
    updates = []
    params = []
    
    if title is not None:
        updates.append("title = %s")
        params.append(title)
    
    if description is not None:
        updates.append("description = %s")
        params.append(description)
    
    if status is not None:
        updates.append("status = %s")
        params.append(status)
    
    if not updates:
        print("No updates provided")
        return
    
    params.append(task_id)
    query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s;"
    result = execute_query(query, tuple(params))
    print(f"Task {task_id} updated. Rows affected: {result}")


def delete_task(task_id):
    """Delete a task from the database"""
    query = "DELETE FROM tasks WHERE id = %s;"
    result = execute_query(query, (task_id,))
    print(f"Task {task_id} deleted. Rows affected: {result}")


def main():
    """Main function demonstrating database operations"""
    print("Setting up users and tasks tables...")
    create_users_and_tasks_tables()
    
    print("\nGetting or creating a sample user...")
    user_id = get_or_create_user("example@test.com", "hashed_password_123", "Test User")
    
    print("\nAdding sample tasks...")
    add_task("Complete project proposal", user_id, "Write and submit the project proposal to stakeholders", "2026-02-15")
    add_task("Review code changes", user_id, "Review pull requests for the upcoming release", "2026-02-12")
    add_task("Schedule team meeting", user_id, "Organize a team sync for next week", "2026-02-10")
    
    print("\nRetrieving all tasks...")
    tasks = get_all_tasks()
    
    print(f"\nFound {len(tasks)} tasks:")
    for task in tasks:
        status_symbol = "[X]" if task['status'] == 'completed' else "[ ]"
        print(f"{status_symbol} [{task['id']}] {task['title']}")
        if task['description']:
            print(f"    Description: {task['description']}")
        if task['due_date']:
            print(f"    Due: {task['due_date']}")
        print(f"    Status: {task['status']}")
        print()
    
    print("Updating task #1 to mark as completed...")
    update_task(1, status="completed")
    
    print("\nRetrieving tasks after update...")
    tasks = get_all_tasks()
    for task in tasks[:1]:  # Just show the first task
        status_symbol = "[X]" if task['status'] == 'completed' else "[ ]"
        print(f"{status_symbol} [{task['id']}] {task['title']} - Status: {task['status']}")


if __name__ == "__main__":
    main()