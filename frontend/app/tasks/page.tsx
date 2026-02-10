'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FloatingChatbot from '../components/FloatingChatbot';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  created_at: string;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
  category?: string | null;
}

const categoryIcons: Record<string, string> = {
  'Work': '💼',
  'Personal': '🏠',
  'Shopping': '🛒',
  'Health': '🏃',
  'Education': '📚',
  'Finance': '💰',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: ''
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium', category: '', due_date: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [categories, setCategories] = useState<string[]>(['Work', 'Personal', 'Shopping', 'Health']);
  const [newCategory, setNewCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
    setIsLoaded(true);

    const handleRefresh = () => fetchTasks();
    window.addEventListener('refresh-tasks', handleRefresh);
    return () => window.removeEventListener('refresh-tasks', handleRefresh);
  }, []);

  useEffect(() => {
    if (showAddForm && taskInputRef.current) taskInputRef.current.focus();
  }, [showAddForm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      if (!userId) {
        setError('Please login to view tasks');
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/tasks?user_id=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Fetch tasks failed', res.status, text);
        setError(`Failed to fetch tasks: ${res.status}`);
        return;
      }

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch exception:', err);
      setError('Network error: ' + String(err).slice(0, 100));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    if (newTask.title.trim().length > 255) {
      setError('Task title must be less than 255 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          status: 'pending',
          user_id: parseInt(localStorage.getItem('user_id') || '1')
        })
      });

      if (!res.ok) throw new Error('Failed to add task');

      const created = await res.json();
      setTasks(prev => [...prev, created]);
      setNewTask({ title: '', description: '', due_date: '', priority: 'medium', category: '' });
      setShowAddForm(false);
      triggerConfetti();
    } catch (err) {
      setError('Failed to add task: ' + String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (id: number, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      if (updates.status === 'completed') triggerConfetti();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const filteredTasks = tasks.filter(t => (filter === 'all' ? true : t.status === filter));

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-gradient-to-r from-red-400 to-red-500', text: 'text-white', icon: '🔥', label: 'High' };
      case 'medium': return { bg: 'bg-gradient-to-r from-amber-400 to-orange-400', text: 'text-white', icon: '⚡', label: 'Medium' };
      case 'low': return { bg: 'bg-gradient-to-r from-emerald-400 to-green-500', text: 'text-white', icon: '🌿', label: 'Low' };
      default: return { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-white', icon: '📌', label: 'Normal' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { icon: '🎉', label: 'Done!', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'in-progress': return { icon: '🚀', label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'pending': return { icon: '💤', label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
      default: return { icon: '📋', label: 'Todo', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const getProgressPercentage = () => tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
  const progress = getProgressPercentage();
  const stats = { 
    total: tasks.length, 
    completed: tasks.filter(t => t.status === 'completed').length, 
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-purple-500/30 animate-pulse">
              📝
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full flex items-center justify-center animate-bounce text-white text-sm">✨</div>
          </div>
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-violet-200 rounded-full mx-auto mb-4"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading your tasks...</p>
          <p className="text-gray-400 text-sm mt-2">Getting things ready for you ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-transform">
                📝
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  TaskMate
                </h1>
                <p className="text-sm text-gray-500">Organize, Focus, Deliver ✨</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-full border border-violet-100">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white shadow-md">
                  {typeof window !== 'undefined' ? (localStorage.getItem('user_name')?.charAt(0).toUpperCase() || 'U') : 'U'}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-800">
                    {typeof window !== 'undefined' ? (localStorage.getItem('user_name') || localStorage.getItem('user_email')?.split('@')[0] || 'User') : 'User'}
                  </div>
                  <div className="text-gray-400 text-xs">Pro Member</div>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('user_id');
                  localStorage.removeItem('user_email');
                  localStorage.removeItem('user_name');
                  document.cookie = 'auth-token=; Max-Age=0; path=/;';
                  router.push('/login');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>Sign out</span>
                <span className="text-lg">👋</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Progress Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/30">
                📊
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Your Progress</h2>
                <p className="text-sm text-gray-500">Keep going, you're doing great!</p>
              </div>
            </div>
            <div className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              {progress}%
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">🎯</span> {stats.completed} completed
            </span>
            <span className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">📋</span> {stats.total - stats.completed} remaining
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">📁</div>
              <span className="text-3xl font-bold text-gray-800 group-hover:scale-110 transition-transform">{stats.total}</span>
            </div>
            <p className="text-gray-500 font-medium">Total Tasks</p>
          </div>
          
          <div 
            onClick={() => setFilter('in-progress')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">🚀</div>
              <span className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">{stats.inProgress}</span>
            </div>
            <p className="text-gray-500 font-medium">In Progress</p>
          </div>
          
          <div 
            onClick={() => setFilter('pending')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">💤</div>
              <span className="text-3xl font-bold text-amber-600 group-hover:scale-110 transition-transform">{stats.pending}</span>
            </div>
            <p className="text-gray-500 font-medium">Pending</p>
          </div>
          
          <div 
            onClick={() => setFilter('completed')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">🎉</div>
              <span className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">{stats.completed}</span>
            </div>
            <p className="text-gray-500 font-medium">Completed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tasks Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl">📋</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Your Tasks</h3>
                      <p className="text-white/70 text-sm">{filteredTasks.length} tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="pl-10 pr-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer"
                      >
                        <option value="all" className="text-gray-800">All</option>
                        <option value="pending" className="text-gray-800">Pending</option>
                        <option value="in-progress" className="text-gray-800">In Progress</option>
                        <option value="completed" className="text-gray-800">Completed</option>
                      </select>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">🔽</span>
                    </div>
                    <button
                      onClick={() => setShowAddForm(s => !s)}
                      className="px-5 py-2.5 bg-white text-violet-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                      <span className="text-lg">{showAddForm ? '✕' : '+'}</span>
                      <span>{showAddForm ? 'Close' : 'Add Task'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    {error}
                  </div>
                )}

                {/* Add Task Form */}
                {showAddForm && (
                  <div className="mb-6 p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100 animate-slide-down">
                    <form onSubmit={handleAddTask} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span>📌</span> Task Title
                        </label>
                        <input
                          ref={taskInputRef}
                          value={newTask.title}
                          onChange={e => setNewTask({...newTask, title: e.target.value})}
                          placeholder="What needs to be done?"
                          className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span>📝</span> Description (optional)
                        </label>
                        <textarea
                          value={newTask.description}
                          onChange={e => setNewTask({...newTask, description: e.target.value})}
                          placeholder="Add more details..."
                          rows={2}
                          className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>📅</span> Due Date
                          </label>
                          <input
                            type="date"
                            value={newTask.due_date}
                            onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>🔥</span> Priority
                          </label>
                          <select
                            value={newTask.priority}
                            onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                            className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                          >
                            <option value="low">🌿 Low</option>
                            <option value="medium">⚡ Medium</option>
                            <option value="high">🔥 High</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>📁</span> Category
                          </label>
                          <input
                            value={newTask.category}
                            onChange={e => setNewTask({...newTask, category: e.target.value})}
                            placeholder="e.g., Work"
                            className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <span>✨</span>
                              <span>Add Task</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tasks List */}
                <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-8xl mb-4 animate-pulse">📭</div>
                      <h4 className="text-xl font-semibold text-gray-600 mb-2">No tasks yet!</h4>
                      <p className="text-gray-400 mb-6">Create your first task to get started</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
                      >
                        <span>➕</span>
                        <span>Create Task</span>
                      </button>
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const priority = getPriorityConfig(task.priority || 'medium');
                      const statusCfg = getStatusConfig(task.status);
                      return (
                        <div
                          key={task.id}
                          className={`group relative p-5 bg-white rounded-2xl border-2 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ${
                            task.status === 'completed' 
                              ? 'border-green-200 bg-gradient-to-r from-white to-green-50/50' 
                              : 'border-transparent hover:border-violet-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleUpdateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
                                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    task.status === 'completed'
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                  }`}
                                >
                                  {task.status === 'completed' && <span className="text-sm">✓</span>}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-lg font-semibold text-gray-800 truncate ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                    {task.title}
                                  </h4>
                                  {(task.description || task.category) && (
                                    <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                      {task.description || 'No description'}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
                                      {priority.icon} {priority.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                                      {statusCfg.icon} {statusCfg.label}
                                    </span>
                                    {task.category && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700">
                                        📁 {task.category}
                                      </span>
                                    )}
                                    {task.due_date && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        📅 {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:flex-col sm:gap-2">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setEditForm({
                                    title: task.title,
                                    description: task.description || '',
                                    priority: task.priority || 'medium',
                                    category: task.category || '',
                                    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
                                  });
                                }}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                              >
                                <span>✏️</span>
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                              >
                                <span>🗑️</span>
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Categories Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 p-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📂</span> Categories
                </h4>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewTask(n => ({...n, category: c}))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        newTask.category === c
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="mr-1">{categoryIcons[c] || '📁'}</span>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="New category..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
                    onKeyPress={e => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚡</span> Quick Stats
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span>📊</span> Completion Rate
                  </span>
                  <span className="font-bold text-violet-600">{progress}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span>✅</span> Done
                  </span>
                  <span className="font-bold text-green-600">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span>⏳</span> Remaining
                  </span>
                  <span className="font-bold text-amber-600">{stats.total - stats.completed}</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl shadow-xl p-6 text-white">
              <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span>💡</span> Pro Tip
              </h4>
              <p className="text-white/80 text-sm">
                Use the AI chatbot to create tasks with natural language! Just type what you need to do.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>✏️</span> Edit Task
                </h3>
                <button
                  onClick={() => setEditingTask(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white text-xl transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span>📌</span> Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span>📝</span> Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span>🔥</span> Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  >
                    <option value="low">🌿 Low</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="high">🔥 High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span>📅</span> Due Date
                  </label>
                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span>📁</span> Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  placeholder="e.g., Work, Personal"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const updates: any = {};
                    if (editForm.title !== editingTask.title) updates.title = editForm.title;
                    if (editForm.description !== (editingTask.description || '')) updates.description = editForm.description;
                    if (editForm.priority !== (editingTask.priority || 'medium')) updates.priority = editForm.priority;
                    if (editForm.category !== (editingTask.category || '')) updates.category = editForm.category;
                    if (editForm.due_date) {
                      const isoDate = new Date(editForm.due_date).toISOString();
                      if (isoDate !== editingTask.due_date) updates.due_date = isoDate;
                    } else if (editingTask.due_date) {
                      updates.due_date = null;
                    }
                    if (Object.keys(updates).length > 0) await handleUpdateTask(editingTask.id, updates);
                    setEditingTask(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot */}
      <FloatingChatbot />

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
