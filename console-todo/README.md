# Console Todo Application

A simple, command-line based todo application built with Python. This application allows you to manage your tasks directly from the terminal.

## Features

- Add, update, delete, and list tasks
- Mark tasks as completed/pending
- Filter tasks by status
- Persistent storage using JSON files
- Simple menu-based interface

## Requirements

- Python 3.6 or higher

## Installation and Setup

1. Clone or download this repository
2. Navigate to the console-todo directory
3. Run the application using Python:

```bash
python todo_app.py
```

## Usage

The application provides a menu-driven interface:

```
========================================
           TODO APPLICATION
========================================
1. Add Task
2. List All Tasks
3. Update Task
4. Delete Task
5. Toggle Task Status
6. List Pending Tasks
7. List Completed Tasks
0. Exit
----------------------------------------
```

### Adding a Task
1. Select option 1 from the menu
2. Enter the task title (required)
3. Optionally enter a description
4. The task will be saved with a unique ID

### Listing Tasks
- Option 2: List all tasks
- Option 6: List only pending tasks
- Option 7: List only completed tasks

### Updating a Task
1. Select option 3 from the menu
2. Enter the task ID you want to update
3. Enter new values or press Enter to keep current values

### Deleting a Task
1. Select option 4 from the menu
2. Enter the task ID you want to delete
3. Confirm the deletion

### Toggling Task Status
1. Select option 5 from the menu
2. Enter the task ID
3. The task status will toggle between "pending" and "completed"

## Data Storage

Tasks are stored in a `tasks.json` file in the same directory as the application. The file is automatically created when you add your first task and updated whenever you make changes.

## Example CLI Usage

```bash
# Run the application
python todo_app.py

# The application will display a menu where you can:
# - Add a task: Enter "1", then provide title and description
# - List tasks: Enter "2" to see all tasks
# - Update a task: Enter "3", then the task ID and new information
# - Delete a task: Enter "4", then the task ID
# - Toggle status: Enter "5", then the task ID
```

## File Structure

```
console-todo/
├── todo_app.py     # Main application code
├── requirements.txt # Dependencies (none required)
├── tasks.json      # Task storage (created automatically)
└── README.md       # This file
```

## Task Fields

Each task contains:
- `id`: Unique identifier (auto-generated)
- `title`: Task title (required)
- `description`: Task description (optional)
- `status`: Task status ("pending" or "completed")
- `created_at`: Timestamp when the task was created

## Extending the Application

This application is designed to be easily extensible for Phase II (web application) with:
- Clean separation of data models and business logic
- File-based storage that can be replaced with a database
- Well-structured code following object-oriented principles