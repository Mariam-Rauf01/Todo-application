# AI-Powered Todo Application — Phase 2 (Web Foundation)

A full-stack web-based Todo application with user authentication, persistent database storage, and a modern UI built with Next.js and FastAPI.

## 🏗️ Project Structure

```
ai-todo-app/
├─ backend/
│  ├─ app/
│  │  ├─ main.py                # FastAPI entry point
│  │  ├─ auth.py                # Authentication routes
│  │  ├─ tasks.py               # Task CRUD APIs
│  │  ├─ models.py              # SQLAlchemy models (Users, Tasks)
│  │  ├─ database.py            # Database connection
│  │  ├─ chatbot.py             # AI chatbot logic
│  │  ├─ schemas.py             # Pydantic schemas
│  │  └─ utils.py               # Helpers / JWT / Validation
│  ├─ requirements.txt          # Backend dependencies
│  └─ Dockerfile                # Container for backend
│
├─ frontend/
│  ├─ app/
│  │  ├─ layout.tsx             # Root layout (Header + Footer)
│  │  ├─ page.tsx               # Dashboard or main page
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  ├─ signup/
│  │  │  └─ page.tsx
│  │  ├─ tasks/
│  │  │  ├─ TaskList.tsx
│  │  │  └─ TaskForm.tsx
│  │  └─ chatbot/
│  │     └─ Chatbot.tsx
│  ├─ components/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ next.config.js
│  ├─ tailwind.config.js
│  └─ Dockerfile
│
├─ helm/                        # Helm charts for Kubernetes
│  ├─ Chart.yaml
│  ├─ values.yaml
│  └─ templates/
│
├─ cloud/
│  ├─ kafka/                    # Kafka configuration
│  └─ dapr/                     # Dapr configuration
│
├─ docker-compose.yml          # Docker Compose for local development
└─ README.md
```

## Features

- **User Authentication**: Secure signup and login
- **Task Management**: Create, read, update, delete tasks
- **AI Chatbot**: Natural language task management
- **Advanced Features**: Due dates, priorities, categories
- **Modern UI**: Clean and responsive design
- **Event-Driven Architecture**: Kafka and Dapr integration

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- Tailwind CSS
- React Server Components
- Client-side JavaScript for interactivity

### Backend
- FastAPI
- SQLAlchemy
- Pydantic schemas
- JWT authentication middleware

### Database
- PostgreSQL (Neon - Free Tier)
- SSL mode: required for Neon connections

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- PostgreSQL (or Neon PostgreSQL account)
- Git

## 🚀 Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
Create a `.env` file in the `backend` directory:
```env
SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=postgresql://username:password@localhost:5432/todo_app
```

6. Run database migrations:
```bash
alembic upgrade head
```

7. Create the test user (optional):
```bash
python create_test_user.py
```

8. Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new user
  - Request body: `{"email": "user@example.com", "full_name": "User Name", "password": "secure_password"}`
  - Response: User object with JWT token
  - Error responses:
    - 400: "Email already exists" or "All fields (email, password, full_name) are required"
    - 500: "Database connection failed"

- `POST /api/auth/login` - Login and get JWT token
  - Request body: `{"username": "user@example.com", "password": "secure_password"}`
  - Response: `{"access_token": "jwt_token", "token_type": "bearer"}`
  - Error responses:
    - 401: "Invalid credentials"
    - 500: "Database connection failed"

### Todo Management
- `GET /api/tasks/` - Get user's tasks
- `POST /api/tasks/` - Create a new task
- `GET /api/tasks/{task_id}` - Get a specific task
- `PUT /api/tasks/{task_id}` - Update a specific task
- `DELETE /api/tasks/{task_id}` - Delete a specific task

### Test User
A test user is created automatically with the following credentials:
- Email: `test@todo.com`
- Password: `test1234`

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## 🌐 Environment Variables

### Backend (.env)
```
SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=postgresql+psycopg2://username:password@hostname/database?sslmode=require
```

For Neon PostgreSQL, the DATABASE_URL format should be:
```
DATABASE_URL=postgresql+psycopg2://neondb_owner:your_neon_password@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Neon PostgreSQL Setup
1. Create a free Neon account at https://neon.tech/
2. Create a new project
3. Get the connection string from the Neon dashboard
4. Update your .env file with the connection string
5. The application will automatically handle SSL configuration for Neon

## 🚀 Production Deployment

### Backend
1. Update `DATABASE_URL` to point to your production database
2. Set a strong `SECRET_KEY`
3. Run with a production ASGI server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
1. Build for production:
```bash
npm run build
```
2. Serve the build output with a static file server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please open an issue in the repository.

## Database Configuration with Neon PostgreSQL

This project is configured to connect to a PostgreSQL database hosted on Neon with the following connection string:

```
postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

The database connection is configured in:

- `config.py` - Contains the database connection string
- `db_connection.py` - Basic database connection implementation
- `db_utils.py` - Advanced database utilities with connection pooling
- `test_db_connection.py` - Test script to verify the database connection

To test the database connection, run:

```
python test_db_connection.py
```
