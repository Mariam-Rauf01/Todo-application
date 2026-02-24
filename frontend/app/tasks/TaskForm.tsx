
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TaskFormProps {
  taskId?: number;
  initialData?: {
    title: string;
    description: string | null;
    due_date?: string | null;
    priority?: string;
    category?: string;
  };
}

export default function TaskForm({ taskId, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [category, setCategory] = useState(initialData?.category || '');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For demo purposes, skip authentication check
    // const token = localStorage.getItem('access_token');
    // if (!token) {
    //   router.push('/login');
    //   return;
    // }

    try {
      const userId = localStorage.getItem('user_id');
      
      const taskData = {
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        category: category || null,
        user_id: userId ? parseInt(userId) : null,
      };

      let response;
      if (taskId) {
        // Update existing task
        response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });
      } else {
        // Create new task
        response = await fetch('/api/tasks/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });
      }

      if (response.ok) {
        const created = await response.json();
        // Dispatch event to update chatbot
        window.dispatchEvent(new CustomEvent('task-action', {
          detail: { action: 'created', taskTitle: created.title || title }
        }));
        router.push('/tasks');
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save task');
      }
    } catch (err) {
      setError('Error saving task');
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {taskId ? 'Edit Task' : 'Create New Task'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-none focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-none focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-none focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

  <div className="space-y-2">
  <label
    htmlFor="priority"
    className="block text-sm font-semibold text-gray-800"
  >
    Priority
  </label>

  <div className="relative">
    <select
      id="priority"
      value={priority}
      onChange={(e) => setPriority(e.target.value)}
      className="appearance-none w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 shadow-sm transition duration-200 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 hover:border-gray-400 cursor-pointer"
    >
      <option value="low">🟢 Low</option>
      <option value="medium">🟡 Medium</option>
      <option value="high">🔴 High</option>
    </select>

    {/* Custom Chevron */}
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  </div>
</div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Shopping"
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-none focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            {category && (
              <button
                type="button"
                onClick={() => setCategory('')}
                className="mt-1 px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
                title="Clear category"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/tasks')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            {taskId ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}