'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch task data when editing
  useEffect(() => {
    if (taskId) {
      fetchTaskData();
    }
  }, [taskId]);

  const fetchTaskData = async () => {
    setLoading(true);
    try {
      console.log('Fetching task data for ID:', taskId);

      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }

      const response = await fetch(`/api/tasks/${taskId}`);
      // headers: {
      //   'Authorization': `Bearer ${token}`,
      // },

      console.log('Fetch task response status:', response.status);

      if (response.ok) {
        const taskData = await response.json();
        console.log('Fetched task data:', taskData);
        setTitle(taskData.title || '');
        setDescription(taskData.description || '');
        setDueDate(taskData.due_date ? taskData.due_date.split('T')[0] : ''); // Format for date input
        setPriority(taskData.priority || 'medium');
        setCategory(taskData.category || '');
      } else {
        console.error('Failed to load task data, status:', response.status);
        setError('Failed to load task data');
      }
    } catch (err) {
      console.error('Error loading task data:', err);
      setError('Error loading task data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Submitting task form, taskId:', taskId);

      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }

      const taskData = {
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        category: category || null,
        recurrence_pattern: null,
      };

      console.log('Task data to submit:', taskData);

      let response;
      if (taskId) {
        // Update existing task
        response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        });
      } else {
        // Create new task
        response = await fetch('/api/tasks/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        });
      }

      console.log('Submit response status:', response.status);

      if (response.ok) {
        console.log('Task saved successfully');
        router.push('/tasks');
        router.refresh();
      } else {
        const errorData = await response.json();
        console.error('Failed to save task:', errorData);
        setError(errorData.detail || 'Failed to save task');
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Error saving task');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading task data...</div>
      </div>
    );
  }

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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <a
            href="/tasks"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
          >
            Cancel
          </a>
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