// Demo tasks storage for development
// In a real app, this would be replaced with a database

export interface DemoTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  priority?: string;
  category?: string | null;
}

// Shared demo tasks storage
let demoTasks: DemoTask[] = [
  {
    id: 1,
    title: "Welcome to AI-Powered Todo App!",
    description: "This is a demo task to show how the interface works.",
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Create your first task",
    description: "Click the 'Add Task' button to create your own tasks.",
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Explore AI features",
    description: "Try the chatbot to get AI-powered task suggestions.",
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const getDemoTasks = (): DemoTask[] => {
  return [...demoTasks];
};

export const addDemoTask = (task: Omit<DemoTask, 'id' | 'created_at' | 'updated_at'>): DemoTask => {
  const newTask: DemoTask = {
    ...task,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  demoTasks.push(newTask);
  return newTask;
};

export const updateDemoTask = (id: number, updates: Partial<DemoTask>): DemoTask | null => {
  const index = demoTasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  demoTasks[index] = {
    ...demoTasks[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return demoTasks[index];
};

export const deleteDemoTask = (id: number): boolean => {
  const index = demoTasks.findIndex(t => t.id === id);
  if (index === -1) return false;

  demoTasks.splice(index, 1);
  return true;
};

export const getDemoTask = (id: number): DemoTask | null => {
  return demoTasks.find(t => t.id === id) || null;
};