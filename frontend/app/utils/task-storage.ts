import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'tasks-data.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Initialize storage file if it doesn't exist
function ensureStorage() {
  ensureDataDir();
  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData: Task[] = [
      {
        id: 1,
        title: "Welcome to AI-Powered Todo App!",
        description: "This is a demo task to show how the interface works.",
        status: "pending",
        priority: "medium",
        category: "Demo",
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Create your first task",
        description: "Click the 'Add Task' button to create your own tasks.",
        status: "pending",
        priority: "medium",
        category: "Demo",
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Explore AI features",
        description: "Try the chatbot to get AI-powered task suggestions.",
        status: "completed",
        priority: "medium",
        category: "Demo",
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readTasks(): Task[] {
  ensureStorage();
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(tasks, null, 2));
}

export function getTasks(): Task[] {
  return readTasks().sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getTask(id: number): Task | undefined {
  return readTasks().find(t => t.id === id);
}

export function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
  const tasks = readTasks();
  const newTask: Task = {
    ...data,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  tasks.push(newTask);
  writeTasks(tasks);
  return newTask;
}

export function updateTask(id: number, updates: Partial<Task>): Task | null {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  writeTasks(tasks);
  return tasks[index];
}

export function deleteTask(id: number): boolean {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  writeTasks(tasks);
  return true;
}
