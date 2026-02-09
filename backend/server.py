import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from functools import wraps

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# Database configuration
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
)

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            # Create users table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # Create tasks table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(200) NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {e}")
        finally:
            conn.close()

def token_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    """Register a new user (for Next.js frontend)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'detail': 'Invalid data'}), 400
    
    # Support both email and username
    username = data.get('email') or data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'detail': 'Username/email and password are required'}), 400
    
    if len(password) < 6:
        return jsonify({'detail': 'Password must be at least 6 characters'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'detail': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user already exists
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            return jsonify({'detail': 'Username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id',
            (username, password_hash)
        )
        user_id = cur.fetchone()['id']
        conn.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'detail': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user already exists
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id',
            (username, password_hash)
        )
        user_id = cur.fetchone()['id']
        conn.commit()
        
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user_id': user_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Authenticate user and return token (for Next.js frontend)"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        # Try form data
        data = request.form
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'detail': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'detail': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cur.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'detail': 'Invalid username or password'}), 401
        
        # Generate token
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'access_token': token,
            'token_type': 'bearer',
            'user_id': user['id'],
            'username': user['username']
        }), 200
        
    except Exception as e:
        return jsonify({'detail': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Register a new user (for Next.js frontend)"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'detail': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    if len(password) < 6:
        return jsonify({'detail': 'Password must be at least 6 characters'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'detail': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user already exists
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            return jsonify({'detail': 'Username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id',
            (username, password_hash)
        )
        user_id = cur.fetchone()['id']
        conn.commit()
        
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': token,
            'token_type': 'bearer',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'detail': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return token"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cur.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Generate token
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user_id': user['id'],
            'username': user['username']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user_id):
    """Get all tasks for the current user"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT id, title, completed, created_at FROM tasks WHERE user_id = %s ORDER BY created_at DESC',
            (current_user_id,)
        )
        tasks = cur.fetchall()
        
        # Convert to list of dicts with string ids
        tasks_list = []
        for task in tasks:
            task_dict = dict(task)
            task_dict['id'] = str(task_dict['id'])  # Convert id to string
            tasks_list.append(task_dict)
        
        return jsonify(tasks_list), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user_id):
    """Create a new task"""
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Task title is required'}), 400
    
    title = data['title'].strip()
    
    if not title:
        return jsonify({'error': 'Task title cannot be empty'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO tasks (user_id, title) VALUES (%s, %s) RETURNING id, title, completed, created_at',
            (current_user_id, title)
        )
        task = cur.fetchone()
        conn.commit()
        
        # Convert id to string
        task_dict = dict(task)
        task_dict['id'] = str(task_dict['id'])
        
        return jsonify(task_dict), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/tasks/<task_id>', methods=['PUT'])
@token_required
def update_task(current_user_id, task_id):
    """Update an existing task"""
    data = request.get_json()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if task exists and belongs to user
        cur.execute('SELECT * FROM tasks WHERE id = %s AND user_id = %s', (task_id, current_user_id))
        task = cur.fetchone()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Update fields
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({'error': 'Task title cannot be empty'}), 400
            cur.execute('UPDATE tasks SET title = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s', (title, task_id))
        
        if 'completed' in data:
            cur.execute('UPDATE tasks SET completed = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s', (data['completed'], task_id))
        
        conn.commit()
        
        # Fetch updated task
        cur.execute('SELECT id, title, completed, created_at FROM tasks WHERE id = %s', (task_id,))
        updated_task = cur.fetchone()
        
        # Convert id to string
        task_dict = dict(updated_task)
        task_dict['id'] = str(task_dict['id'])
        
        return jsonify(task_dict), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user_id, task_id):
    """Delete a task"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if task exists and belongs to user
        cur.execute('SELECT id FROM tasks WHERE id = %s AND user_id = %s', (task_id, current_user_id))
        task = cur.fetchone()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Delete task
        cur.execute('DELETE FROM tasks WHERE id = %s AND user_id = %s', (task_id, current_user_id))
        conn.commit()
        
        return jsonify({'message': 'Task deleted successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=8000, debug=True)
