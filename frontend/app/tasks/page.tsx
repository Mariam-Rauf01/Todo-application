'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FloatingChatbot from '../components/FloatingChatbot';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  created_at: string;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [categories, setCategories] = useState<string[]>(['Work', 'Personal', 'Shopping', 'Health']);
  const [newCategory, setNewCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // TEMP: Allow all users for demo
    // const token = localStorage.getItem('access_token');
    // if (!token) {
    //   router.push('/login');
    //   return;
    // }
    fetchTasks();
    
    // Listen for chatbot task refresh events
    const handleRefresh = () => {
      fetchTasks();
    };
    window.addEventListener('refresh-tasks', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-tasks', handleRefresh);
    };
  }, []);

  // Focus on task input when form opens
  useEffect(() => {
    if (showAddForm && taskInputRef.current) {
      taskInputRef.current.focus();
    }
  }, [showAddForm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }
      
      const response = await fetch('/api/tasks/', {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch {
      setError('An error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }
      
      const taskPayload: any = {
        title: newTask.title,
        description: newTask.description,
        status: 'pending',
        priority: newTask.priority,
        category: newTask.category || null
      };

      if (newTask.due_date) {
        const date = new Date(newTask.due_date);
        taskPayload.due_date = date.toISOString();
      }

      const response = await fetch('/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskPayload),
      });

      if (response.ok) {
        const createdTask = await response.json();
        setTasks([...tasks, createdTask]);
        setNewTask({ 
          title: '', 
          description: '',
          due_date: '',
          priority: 'medium',
          category: ''
        });
        setShowAddForm(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add task');
      }
    } catch {
      setError('An error occurred while adding task');
    }
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }
      
      const updatesPayload: any = { ...updates };

      if (updates.due_date) {
        const date = new Date(updates.due_date);
        updatesPayload.due_date = date.toISOString();
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatesPayload),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        setEditingTask(null);
        setError(null);
        
        // Celebrate completion!
        if (updates.status === 'completed') {
          triggerConfetti();
        }
      }
    } catch {
      setError('An error occurred while updating task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task? 😢')) return;
    
    try {
      // For demo purposes, skip authentication
      // const token = localStorage.getItem('access_token');
      // if (!token) {
      //   router.push('/login');
      //   return;
      // }
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId));
        setError(null);
      }
    } catch {
      setError('An error occurred while deleting task');
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-gradient-to-r from-red-400 to-red-500', text: 'text-white', icon: '🔥', label: 'High' };
      case 'medium': return { bg: 'bg-gradient-to-r from-yellow-400 to-orange-400', text: 'text-white', icon: '⚡', label: 'Medium' };
      case 'low': return { bg: 'bg-gradient-to-r from-green-400 to-emerald-500', text: 'text-white', icon: '🌿', label: 'Low' };
      default: return { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-white', icon: '📌', label: 'Normal' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { icon: '🎉', label: 'Done!', color: 'text-green-600', bg: 'bg-green-100' };
      case 'in-progress': return { icon: '🚀', label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'pending': return { icon: '💤', label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100' };
      default: return { icon: '📋', label: 'Todo', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getProgressPercentage = () => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
  };

  const progress = getProgressPercentage();

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📦</div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/30 animate-bounce-soft">
                📝
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  TaskMate
                </h1>
                <p className="text-xs text-gray-500">Get things done! ✨</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full">
                <span className="text-sm">👤</span>
                <span className="text-sm text-gray-600 font-medium">Ready to work!</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('access_token');
                  document.cookie = 'auth-token=; Max-Age=0; path=/;';
                  router.push('/login');
                }}
                className="px-4 py-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all font-medium"
              >
                Bye! 👋
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-violet-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">📊 Your Progress</h2>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {progress}%
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-sm text-gray-500">
            <span>🎯 {stats.completed} completed</span>
            <span>📋 {stats.total - stats.completed} remaining</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-4 border border-violet-100 hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500 font-medium">Total Tasks</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 border border-blue-100 hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer"
               onClick={() => setFilter('in-progress')}>
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500 font-medium">In Progress</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 border border-yellow-100 hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer"
               onClick={() => setFilter('pending')}>
            <div className="text-3xl mb-2">💤</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500 font-medium">Pending</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 border border-green-100 hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer"
               onClick={() => setFilter('completed')}>
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500 font-medium">Completed</div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-72">
            <div className="bg-white rounded-2xl shadow-md p-5 border border-violet-100 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">📂 Categories</h2>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-9 h-9 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition flex items-center justify-center shadow-lg shadow-purple-500/30"
                >
                  +
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                {categories.map((category, index) => (
                  <div 
                    key={index}
                    onClick={() => setFilter('all')}
                    className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-violet-50 hover:to-purple-50 transition cursor-pointer border border-transparent hover:border-violet-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📁</span>
                      <span className="font-medium text-gray-700">{category}</span>
                    </div>
                    <span className="text-sm bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                      {tasks.filter(t => t.category === category).length}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  onClick={addCategory}
                  className="px-3 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"
                >
                  ✓
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">🔍 Quick Filter</h3>
                <div className="space-y-2">
                  {[
                    { key: 'all', icon: '📋', label: 'All Tasks', count: stats.total },
                    { key: 'in-progress', icon: '🚀', label: 'In Progress', count: stats.inProgress },
                    { key: 'pending', icon: '💤', label: 'Pending', count: stats.pending },
                    { key: 'completed', icon: '🎉', label: 'Completed', count: stats.completed },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilter(item.key as any)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center justify-between ${
                        filter === item.key
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <span className={`text-sm ${
                        filter === item.key ? 'bg-white/20' : 'bg-gray-200'
                      } px-2 py-0.5 rounded-full`}>
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Add Task Form */}
            {showAddForm && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-violet-100 animate-slide-down">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>✨</span> Add New Task
                  </h2>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="w-8 h-8 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📌 Task Title *</label>
                    <input
                      ref={taskInputRef}
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      placeholder="What needs to be done?"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📝 Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      placeholder="Add more details..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📅 Due Date</label>
                      <input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🔥 Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      >
                        <option value="low">🌿 Low</option>
                        <option value="medium">⚡ Medium</option>
                        <option value="high">🔥 High</option>
                      </select>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">📁 Category</label>
                      <select
                        value={newTask.category}
                        onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      >
                        <option value="">Choose...</option>
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      🎯 Add Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 flex items-center gap-2 animate-shake">
                <span>⚠️</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Tasks List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {filter === 'all' ? '📋 All Tasks' : `📋 ${filter.replace('-', ' ')} Tasks`}
                  <span className="text-sm font-normal bg-violet-100 text-violet-700 px-3 py-1 rounded-full">
                    {filteredTasks.length}
                  </span>
                </h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="md:hidden px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition shadow-lg shadow-purple-500/30 flex items-center gap-2 font-medium"
                >
                  <span>+</span> Add Task
                </button>
              </div>
              
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-violet-100">
                  <div className="text-7xl mb-4 animate-bounce">🎈</div>
                  <p className="text-gray-500 text-lg font-medium">No tasks yet!</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Add Task" to create your first task!</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition shadow-lg"
                  >
                    Create Task 🎯
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task, index) => {
                    const priorityConfig = getPriorityConfig(task.priority || 'medium');
                    const statusConfig = getStatusConfig(task.status);
                    
                    return (
                      <div 
                        key={task.id}
                        className={`bg-white rounded-2xl shadow-md p-4 border-l-4 transition-all hover:shadow-lg hover:scale-[1.01] ${
                          task.status === 'completed' 
                            ? 'border-green-400 bg-gradient-to-r from-white to-green-50' 
                            : task.status === 'in-progress'
                            ? 'border-blue-400 bg-gradient-to-r from-white to-blue-50'
                            : 'border-violet-400 bg-gradient-to-r from-white to-violet-50'
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {editingTask?.id === task.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingTask.title}
                              onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                              required
                            />
                            <textarea
                              value={editingTask.description}
                              onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateTask(task.id, editingTask)}
                                className="flex-1 bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition font-medium"
                              >
                                💾 Save
                              </button>
                              <button
                                onClick={() => setEditingTask(null)}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-xl hover:bg-gray-600 transition font-medium"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4">
                            {/* Complete Button */}
                            <button
                              onClick={() => {
                                const newStatus = task.status === 'completed' ? 'pending' : 
                                  task.status === 'pending' ? 'in-progress' : 'completed';
                                handleUpdateTask(task.id, { status: newStatus });
                              }}
                              className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                task.status === 'completed' 
                                  ? 'bg-green-500 border-green-500 text-white scale-110' 
                                  : task.status === 'in-progress'
                                  ? 'border-blue-400 hover:border-blue-500'
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {task.status === 'completed' && '✓'}
                              {task.status === 'in-progress' && '◐'}
                              {task.status === 'pending' && '○'}
                            </button>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-bold text-gray-800 truncate ${
                                  task.status === 'completed' ? 'line-through text-gray-400' : ''
                                }`}>
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              
                              {task.description && (
                                <p className={`text-sm mt-1 ${
                                  task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-600'
                                }`}>
                                  {task.description}
                                </p>
                              )}

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                                  {statusConfig.icon} {statusConfig.label}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityConfig.bg} ${priorityConfig.text}`}>
                                  {priorityConfig.icon} {priorityConfig.label}
                                </span>
                                {task.category && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                    📁 {task.category}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    new Date(task.due_date) < new Date() 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    📅 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <FloatingChatbot />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
