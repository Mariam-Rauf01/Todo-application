'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { isAuthenticated } from '../utils/auth';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  due_date?: string | null;
  priority?: string;
  category?: string;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // For demo purposes, skip authentication check
    // if (!isAuthenticated()) {
    //   router.push('/login');
    //   return;
    // }

    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks...');

      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }

      const response = await fetch('/api/tasks/');
      // headers: {
      //   'Authorization': `Bearer ${token}`,
      // },

      console.log('Fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tasks:', data.length);
        setTasks(data);
      } else {
        console.error('Failed to fetch tasks, status:', response.status);
        setError('Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      console.log('Deleting task with ID:', id);

      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }

      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        // },
      });

      console.log('Delete response status:', response.status);
      const responseText = await response.text();
      console.log('Delete response:', responseText);

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== id));
        console.log('Task deleted successfully from UI');
      } else {
        setError('Failed to delete task');
        console.error('Delete failed with status:', response.status);
      }
    } catch (err) {
      setError('Error deleting task');
      console.error('Delete error:', err);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      console.log('Toggling task status for ID:', task.id);

      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...task,
          status: task.status === 'completed' ? 'pending' : 'completed'
        }),
      });

      console.log('Toggle response status:', response.status);

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
        console.log('Task status updated successfully');
      } else {
        console.error('Failed to update task status, status:', response.status);
        setError('Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Error updating task');
    }
  };

  if (loading) return <div className="text-center py-10">Loading tasks...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <a href="/tasks/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
          <FaPlus className="mr-2" /> Add Task
        </a>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No tasks yet. Create your first task!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => toggleTaskStatus(task)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <p className={`ml-3 text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.priority && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'}`}>
                          {task.priority}
                        </span>
                      )}
                      {task.category && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {task.category}
                        </span>
                      )}
                      <button
                        onClick={() => router.push(`/tasks/${task.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <div className="mt-2 text-sm text-gray-500">
                      {task.description}
                    </div>
                  )}
                  {task.due_date && (
                    <div className="mt-2 text-sm text-gray-500">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-400">
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}