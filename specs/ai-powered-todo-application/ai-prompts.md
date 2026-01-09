# AI Code Generation Prompts: AI-Powered Todo Application

## Phase I - Console Application Prompts

### Python CLI Application Structure
```
Generate a Python CLI application for task management with the following structure:
- Use Typer for command-line interface
- Implement in-memory storage initially, with option for file-based storage
- Support add, update, delete, list operations
- Task fields: title (required), description (optional), status (pending/completed)
- Include proper error handling and user feedback
```

### Task Model Implementation
```
Create a Task model class with:
- id: UUID, auto-generated
- title: string, required
- description: string, optional
- status: enum (pending, completed), default pending
- created_at: datetime, auto-set
- updated_at: datetime, auto-updated on change
Include proper validation and string representation
```

### Storage Implementation
```
Create a TaskStorage class that:
- Implements in-memory storage using a dictionary
- Provides methods: add_task, get_task, update_task, delete_task, list_tasks
- Optionally supports loading/saving to JSON file
- Handles task persistence between application runs
```

### CLI Commands Implementation
```
Create CLI commands using Typer:
- todo add "task title" --description "optional description"
- todo list
- todo update task_id --status [pending|completed] --title "new title" --description "new description"
- todo delete task_id
Include proper argument validation and user feedback
```

## Phase II - Web Application Prompts

### FastAPI Backend Structure
```
Generate a FastAPI backend with:
- User authentication system (signup, login)
- JWT token-based authentication
- SQLAlchemy ORM for database operations
- Pydantic models for request/response validation
- Proper error handling and logging
- CORS configuration for frontend integration
```

### Database Models
```
Create SQLAlchemy models:
- User model with email, password hash, name, timestamps
- Task model with title, description, status, user relationship, timestamps, due_date, priority, category
- Proper relationships and constraints
- Alembic migrations setup
```

### API Endpoints
```
Implement RESTful API endpoints:
- POST /api/auth/signup - user registration
- POST /api/auth/login - user authentication
- GET /api/tasks - list user tasks
- POST /api/tasks - create new task
- PUT /api/tasks/{id} - update task
- DELETE /api/tasks/{id} - delete task
Include proper authentication middleware and validation
```

### Next.js Frontend Structure
```
Generate a Next.js frontend with:
- App Router structure
- Authentication pages (login, signup)
- Dashboard with task management
- Responsive UI components
- API integration layer
- State management (React Context or Zustand)
- Clean, minimal design
```

### UI Components
```
Create React components:
- TaskList: displays all tasks with filtering options
- TaskForm: for creating and updating tasks
- TaskItem: individual task display with status toggle
- AuthForm: login/signup forms with validation
- Layout components: header, sidebar, etc.
Use modern UI library like shadcn/ui or Tailwind CSS
```

## Phase III - AI Chatbot Integration Prompts

### Natural Language Processing
```
Create an NLP module that:
- Parses natural language commands for task operations
- Identifies intents: create task, update task, delete task, list tasks, set reminders
- Extracts entities: task title, description, due dates, priority, category
- Uses regex patterns and basic NLP techniques
- Handles ambiguous or incomplete commands gracefully
```

### AI Chatbot Implementation
```
Implement an AI chatbot that:
- Integrates with OpenAI API for advanced NLP
- Uses function calling to execute specific task operations
- Maintains conversation context
- Provides helpful responses when commands are unclear
- Follows security best practices for API calls
- Handles errors and provides fallback responses
```

### Task Operation Tools
```
Create AI tools for task operations:
- create_task_tool: creates tasks based on natural language
- update_task_tool: updates tasks based on natural language
- delete_task_tool: deletes tasks based on natural language
- list_tasks_tool: retrieves tasks with optional filters
- Each tool should validate inputs and handle errors
```

### MCP (Model Context Protocol) Integration
```
Implement MCP-compliant interfaces:
- Standardized way to connect AI models with application functions
- Proper context management between AI and application
- Secure communication protocols
- Error handling and fallback mechanisms
- Logging and monitoring for AI interactions
```

## Phase IV - Local Deployment Prompts

### Docker Configuration
```
Create Dockerfiles for:
- Backend: Python FastAPI application with proper dependencies
- Frontend: Next.js application with build and runtime stages
- Database: PostgreSQL with initial setup
Include multi-stage builds, proper layering, and security best practices
```

### Docker Compose Setup
```
Create docker-compose.yml that:
- Defines services: database, backend, frontend, ai-services
- Sets up proper networking between services
- Configures environment variables
- Defines volumes for data persistence
- Sets up health checks and restart policies
```

### Kubernetes Manifests
```
Generate Kubernetes manifests:
- Deployments for each service with proper resource requests/limits
- Services for internal communication
- Ingress for external access
- ConfigMaps and Secrets for configuration
- PersistentVolumeClaims for data storage
Follow security best practices and proper resource management
```

### Helm Chart
```
Create Helm chart with:
- Templates for all Kubernetes resources
- Values file with configurable parameters
- Proper dependency management
- Testing templates
- Documentation and README
```

## Phase V - Cloud Deployment Prompts

### Infrastructure as Code
```
Generate Terraform configuration for:
- Cloud provider resources (DigitalOcean or GCP)
- Kubernetes cluster setup
- Database cluster configuration
- Load balancer and networking
- Security groups and access controls
- Monitoring and logging setup
Include proper state management and remote backends
```

### Event Streaming with Kafka
```
Implement Kafka integration:
- Producer for task events (created, updated, deleted)
- Consumer for processing task notifications
- Topic configuration for different event types
- Error handling and retry mechanisms
- Monitoring and alerting for event processing
```

### Dapr Service Communication
```
Configure Dapr for:
- Service-to-service communication
- State management for tasks
- Pub/sub messaging for events
- Secret management for API keys
- Observability and tracing
- Proper component configuration
```

### Advanced Task Features
```
Implement advanced features:
- Due dates with reminder system
- Recurring tasks with configurable patterns
- Priority levels (low, medium, high)
- Categories with color coding
- Task filtering and sorting
- Bulk operations
- Export/import functionality
```

## Common Quality Standards for All Phases

### Code Quality
```
All generated code must:
- Follow language-specific best practices and style guides
- Include proper error handling and validation
- Have comprehensive logging
- Include unit and integration tests
- Be properly documented with comments
- Follow security best practices
- Be modular and maintainable
```

### Security
```
Security requirements for all code:
- Input validation and sanitization
- Proper authentication and authorization
- Secure communication (HTTPS/TLS)
- Safe handling of secrets
- Protection against common vulnerabilities (OWASP Top 10)
- Proper session management
- Secure API design
```

### Performance
```
Performance considerations:
- Efficient database queries
- Proper caching strategies
- Optimized API responses
- Asynchronous processing where appropriate
- Resource optimization
- Scalability considerations
- Proper monitoring and metrics
```