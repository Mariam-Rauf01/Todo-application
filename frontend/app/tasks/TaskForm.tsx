
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

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>🔥</span> Priority
            </label>
            <div className="relative group">
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all cursor-pointer font-medium text-gray-700 appearance-none"
              >
                <option value="low" className="text-green-600">🌿 Low</option>
                <option value="medium" className="text-yellow-600">⚡ Medium</option>
                <option value="high" className="text-red-600">🔥 High</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
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
