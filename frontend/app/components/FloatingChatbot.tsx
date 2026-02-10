'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Task Assistant.\n\nCommands:\n- add: task name\n- update: old name -> new name\n- delete: task name\n- done: task name\n- list\n\nType 'help' for more info.",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTasks = async (): Promise<Task[]> => {
    if (!userId) return [];
    const response = await fetch(`/api/tasks/?user_id=${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  };

  const createTask = async (title: string): Promise<Task | null> => {
    if (!userId) return null;
    const response = await fetch('/api/tasks/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: null,
        status: 'pending',
        priority: 'medium',
        category: null,
        due_date: null,
        user_id: parseInt(userId),
      }),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  };

  const deleteTask = async (title: string): Promise<boolean> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      return response.ok;
    }
    return false;
  };

  const updateTask = async (oldTitle: string, newTitle: string): Promise<Task | null> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(oldTitle.toLowerCase()));
    if (task) {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (response.ok) {
        return await response.json();
      }
    }
    return null;
  };

  const completeTask = async (title: string): Promise<Task | null> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (response.ok) {
        return await response.json();
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const lower = text.toLowerCase();
      let response = '';
      let refresh = false;

      // Help command
      if (lower === 'help') {
        response = `COMMANDS:\n\n1. Add task:\n   add: Buy milk\n   add: Pay bills\n\n2. Update task:\n   update: old -> new\n   update: milk -> bread\n\n3. Delete task:\n   delete: Buy milk\n\n4. Mark done:\n   done: Buy milk\n   complete: Buy milk\n\n5. List tasks:\n   list\n   show\n   tasks\n\nExamples:\nadd: Meeting at 3\ndelete: Meeting\nupdate: Meeting -> Call\ndone: Call`;
      }
      // Add task
      else if (lower.startsWith('add:') || lower.startsWith('create:') || lower.startsWith('new:')) {
        const title = text.substring(text.indexOf(':') + 1).trim();
        if (title) {
          const task = await createTask(title);
          if (task) {
            response = `Added: "${task.title}"`;
            refresh = true;
          } else {
            response = 'Error: Could not add task';
          }
        } else {
          response = 'Usage: add: Task name';
        }
      }
      // Update task
      else if (lower.startsWith('update:') || lower.startsWith('edit:') || lower.startsWith('change:')) {
        const content = text.substring(text.indexOf(':') + 1).trim();
        const arrowIndex = content.indexOf('->');
        if (arrowIndex !== -1) {
          const oldTitle = content.substring(0, arrowIndex).trim();
          const newTitle = content.substring(arrowIndex + 2).trim();
          if (oldTitle && newTitle) {
            const task = await updateTask(oldTitle, newTitle);
            if (task) {
              response = `Updated: "${oldTitle}" -> "${task.title}"`;
              refresh = true;
            } else {
              response = `Could not find task: "${oldTitle}"`;
            }
          } else {
            response = 'Usage: update: old name -> new name';
          }
        } else {
          response = 'Use arrow: update: old -> new\nexample: update: milk -> bread';
        }
      }
      // Delete task
      else if (lower.startsWith('delete:') || lower.startsWith('remove:') || lower.startsWith('cancel:')) {
        const title = text.substring(text.indexOf(':') + 1).trim();
        if (title) {
          const deleted = await deleteTask(title);
          if (deleted) {
            response = `Deleted: "${title}"`;
            refresh = true;
          } else {
            response = `Could not find task: "${title}"`;
          }
        } else {
          response = 'Usage: delete: Task name';
        }
      }
      // Complete task
      else if (lower.startsWith('done:') || lower.startsWith('complete:') || lower.startsWith('finish:')) {
        const title = text.substring(text.indexOf(':') + 1).trim();
        if (title) {
          const task = await completeTask(title);
          if (task) {
            response = `Done! "${task.title}" marked complete`;
            refresh = true;
          } else {
            response = `Could not find task: "${title}"`;
          }
        } else {
          response = 'Usage: done: Task name';
        }
      }
      // List tasks
      else if (lower === 'list' || lower === 'show' || lower === 'tasks' || lower === 'show tasks') {
        const tasks = await fetchTasks();
        if (tasks.length === 0) {
          response = 'No tasks yet.\n\nAdd one: add: Task name';
        } else {
          const pending = tasks.filter(t => t.status !== 'completed');
          const completed = tasks.filter(t => t.status === 'completed');
          
          response = 'TASKS:\n\n';
          if (pending.length > 0) {
            response += '[ ] Pending:\n';
            pending.forEach((t, i) => {
              response += `${i + 1}. ${t.title}\n`;
            });
          }
          if (completed.length > 0) {
            if (pending.length > 0) response += '\n';
            response += '[X] Completed:\n';
            completed.forEach((t, i) => {
              response += `${i + 1}. ${t.title}\n`;
            });
          }
          response += `\nTotal: ${pending.length} pending, ${completed.length} done`;
        }
      }
      // Unknown command
      else {
        response = `I don't understand: "${text}"\n\nType "help" for commands.`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (refresh) {
        window.dispatchEvent(new Event("refresh-tasks"));
      }
      
    } catch (error) {
      console.error("Chatbot error:", error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Error: Something went wrong',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${isOpen ? 'bg-gray-700 rotate-90' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} floating-btn`}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 z-50 w-80 max-w-[calc(100vw-2rem)] animate-scale-in">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">✨ Task Assistant</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="bg-purple-50 px-2 py-2 border-b border-purple-100">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setInputText('add: ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">+ Add</button>
                <button onClick={() => setInputText('update: -> ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">~ Edit</button>
                <button onClick={() => setInputText('delete: ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">- Delete</button>
                <button onClick={() => setInputText('done: ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">✓ Done</button>
                <button onClick={() => setInputText('list')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">📋 List</button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-72 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-purple-50 to-blue-50">
              {messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className={`max-w-[90%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${message.sender === 'user' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-purple-500 text-xs">Typing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 border-t border-purple-100">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type command..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm hover:shadow-lg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .floating-btn { animation: float 3s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in 0.25s ease-out; }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
      `}</style>
    </>
  );
}
