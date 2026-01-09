import json
import os
from datetime import datetime
from typing import List, Dict, Optional

class Task:
    """Represents a single todo task"""

    def __init__(self, task_id: int, title: str, description: str = "", status: str = "pending"):
        self.id = task_id
        self.title = title
        self.description = description
        self.status = status  # "pending" or "completed"
        self.created_at = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        """Convert task to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict):
        """Create Task instance from dictionary"""
        task = cls(data["id"], data["title"], data["description"], data["status"])
        task.created_at = data["created_at"]
        return task

class TodoManager:
    """Manages todo tasks with file-based storage"""

    def __init__(self, storage_file: str = "tasks.json"):
        self.storage_file = storage_file
        self.tasks: List[Task] = []
        self.next_id = 1
        self.load_tasks()

    def load_tasks(self):
        """Load tasks from the storage file"""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    self.tasks = [Task.from_dict(task_data) for task_data in data.get("tasks", [])]
                    self.next_id = data.get("next_id", 1)
            except (json.JSONDecodeError, KeyError):
                print("Error loading tasks. Starting with empty task list.")
                self.tasks = []
                self.next_id = 1
        else:
            self.tasks = []
            self.next_id = 1

    def save_tasks(self):
        """Save tasks to the storage file"""
        data = {
            "tasks": [task.to_dict() for task in self.tasks],
            "next_id": self.next_id
        }
        try:
            with open(self.storage_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving tasks: {e}")

    def add_task(self, title: str, description: str = "") -> Task:
        """Add a new task"""
        if not title.strip():
            raise ValueError("Task title cannot be empty")

        task = Task(self.next_id, title.strip(), description.strip())
        self.tasks.append(task)
        self.next_id += 1
        self.save_tasks()
        return task

    def update_task(self, task_id: int, title: Optional[str] = None, description: Optional[str] = None, status: Optional[str] = None):
        """Update an existing task"""
        task = self.get_task_by_id(task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} not found")

        if title is not None:
            task.title = title.strip()
        if description is not None:
            task.description = description.strip()
        if status is not None:
            if status not in ["pending", "completed"]:
                raise ValueError("Status must be 'pending' or 'completed'")
            task.status = status

        self.save_tasks()

    def delete_task(self, task_id: int):
        """Delete a task by ID"""
        task = self.get_task_by_id(task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} not found")

        self.tasks.remove(task)
        self.save_tasks()

    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """Get a task by its ID"""
        for task in self.tasks:
            if task.id == task_id:
                return task
        return None

    def list_tasks(self, status_filter: Optional[str] = None) -> List[Task]:
        """List all tasks, optionally filtered by status"""
        if status_filter:
            return [task for task in self.tasks if task.status == status_filter]
        return self.tasks

    def toggle_task_status(self, task_id: int):
        """Toggle a task's status between pending and completed"""
        task = self.get_task_by_id(task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} not found")

        task.status = "completed" if task.status == "pending" else "pending"
        self.save_tasks()


def display_menu():
    """Display the main menu options"""
    print("\n" + "="*40)
    print("           TODO APPLICATION")
    print("="*40)
    print("1. Add Task")
    print("2. List All Tasks")
    print("3. Update Task")
    print("4. Delete Task")
    print("5. Toggle Task Status")
    print("6. List Pending Tasks")
    print("7. List Completed Tasks")
    print("0. Exit")
    print("-"*40)


def get_user_choice():
    """Get and validate user choice from menu"""
    while True:
        try:
            choice = input("Enter your choice (0-7): ").strip()
            if choice in [str(i) for i in range(8)]:
                return int(choice)
            else:
                print("Invalid choice. Please enter a number between 0 and 7.")
        except KeyboardInterrupt:
            print("\nExiting...")
            return 0


def add_task_ui(todo_manager: TodoManager):
    """UI for adding a task"""
    print("\n--- ADD TASK ---")
    title = input("Enter task title: ").strip()

    if not title:
        print("Task title cannot be empty!")
        return

    description = input("Enter task description (optional): ").strip()

    try:
        task = todo_manager.add_task(title, description)
        print(f"✓ Task added successfully! (ID: {task.id})")
    except ValueError as e:
        print(f"Error: {e}")


def list_tasks_ui(todo_manager: TodoManager, status_filter: Optional[str] = None):
    """UI for listing tasks"""
    if status_filter:
        tasks = todo_manager.list_tasks(status_filter)
        title = f"--- {status_filter.upper()} TASKS ---"
    else:
        tasks = todo_manager.list_tasks()
        title = "--- ALL TASKS ---"

    print(f"\n{title}")

    if not tasks:
        print("No tasks found.")
        return

    for task in tasks:
        status_icon = "✓" if task.status == "completed" else "○"
        print(f"\nID: {task.id}")
        print(f"Title: {task.title}")
        print(f"Status: {status_icon} {task.status}")
        if task.description:
            print(f"Description: {task.description}")
        print("-" * 30)


def update_task_ui(todo_manager: TodoManager):
    """UI for updating a task"""
    print("\n--- UPDATE TASK ---")

    try:
        task_id = int(input("Enter task ID to update: "))
    except ValueError:
        print("Invalid task ID. Please enter a number.")
        return

    # Check if task exists
    task = todo_manager.get_task_by_id(task_id)
    if not task:
        print(f"Task with ID {task_id} not found.")
        return

    print(f"Current task: {task.title}")
    print(f"Current description: {task.description}")
    print(f"Current status: {task.status}")

    new_title = input(f"Enter new title (or press Enter to keep '{task.title}'): ").strip()
    new_description = input(f"Enter new description (or press Enter to keep current): ").strip()
    new_status = input(f"Enter new status (pending/completed or press Enter to keep '{task.status}'): ").strip().lower()

    # Use current values if user didn't provide new ones
    title = new_title if new_title else None
    description = new_description if new_description else None
    status = new_status if new_status in ["pending", "completed"] else None

    try:
        todo_manager.update_task(task_id, title, description, status)
        print("✓ Task updated successfully!")
    except ValueError as e:
        print(f"Error: {e}")


def delete_task_ui(todo_manager: TodoManager):
    """UI for deleting a task"""
    print("\n--- DELETE TASK ---")

    try:
        task_id = int(input("Enter task ID to delete: "))
    except ValueError:
        print("Invalid task ID. Please enter a number.")
        return

    try:
        todo_manager.delete_task(task_id)
        print("✓ Task deleted successfully!")
    except ValueError as e:
        print(f"Error: {e}")


def toggle_task_status_ui(todo_manager: TodoManager):
    """UI for toggling task status"""
    print("\n--- TOGGLE TASK STATUS ---")

    try:
        task_id = int(input("Enter task ID to toggle status: "))
    except ValueError:
        print("Invalid task ID. Please enter a number.")
        return

    try:
        todo_manager.toggle_task_status(task_id)
        task = todo_manager.get_task_by_id(task_id)
        print(f"✓ Task status updated to: {task.status}")
    except ValueError as e:
        print(f"Error: {e}")


def main():
    """Main application loop"""
    print("Welcome to the Console Todo Application!")

    # Initialize the todo manager
    todo_manager = TodoManager()

    while True:
        display_menu()
        choice = get_user_choice()

        if choice == 0:
            print("Thank you for using the Todo Application. Goodbye!")
            break
        elif choice == 1:
            add_task_ui(todo_manager)
        elif choice == 2:
            list_tasks_ui(todo_manager)
        elif choice == 3:
            update_task_ui(todo_manager)
        elif choice == 4:
            delete_task_ui(todo_manager)
        elif choice == 5:
            toggle_task_status_ui(todo_manager)
        elif choice == 6:
            list_tasks_ui(todo_manager, "pending")
        elif choice == 7:
            list_tasks_ui(todo_manager, "completed")

        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()