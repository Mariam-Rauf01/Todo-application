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

interface Command {
  action: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  newTitle?: string;
  newPriority?: string;
  newStatus?: string;
}

const quickActions = [
  { icon: '➕', label: 'Create Task', prompt: 'create task' },
  { icon: '📋', label: 'Show Tasks', prompt: 'show tasks' },
  { icon: '⏳', label: 'Pending', prompt: 'show pending tasks' },
  { icon: '✅', label: 'Completed', prompt: 'show completed tasks' },
];

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I am your AI Task Assistant. You can:\n\n• Say 'create task: Buy milk'\n• Say 'delete task: Buy milk'\n• Say 'update task: Buy milk to: Call doctor'\n• Say 'show tasks'\n• Say 'show pending tasks'\n• Say 'find task: milk'\n\nHow can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to fetch all tasks
  const fetchTasks = async (statusFilter?: string): Promise<Task[]> => {
    const response = await fetch('/api/tasks/');
    if (response.ok) {
      const tasks: Task[] = await response.json();
      if (statusFilter) {
        return tasks.filter(t => t.status === statusFilter);
      }
      return tasks;
    }
    return [];
  };

  // Helper function to create a task
  const createTask = async (title: string, description?: string, priority: string = 'medium'): Promise<Task | null> => {
    const response = await fetch('/api/tasks/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || null,
        status: 'pending',
        priority,
        category: null,
        due_date: null,
      }),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  };

  // Helper function to delete a task by title
  const deleteTaskByTitle = async (title: string): Promise<boolean> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      return response.ok;
    }
    return false;
  };

  // Helper function to update task
  const updateTaskByTitle = async (title: string, newTitle?: string, newStatus?: string, newPriority?: string): Promise<Task | null> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      const updates: any = {};
      if (newTitle) updates.title = newTitle;
      if (newStatus) updates.status = newStatus;
      if (newPriority) updates.priority = newPriority;
      
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        return await response.json();
      }
    }
    return null;
  };

  // Parse natural language commands
  const parseCommand = (text: string): Command | null => {
    const lower = text.toLowerCase().trim();
    
    // Create task patterns
    if (lower.startsWith('create task') || lower.startsWith('add task') || lower.startsWith('new task')) {
      const match = text.match(/(?:create task|add task|new task)[:\s]+(.+)/i);
      if (match) {
        let title = match[1].trim();
        let description: string | undefined;
        let priority: string | undefined;
        
        // Extract description
        const descMatch = title.match(/with description[:\s]+(.+)/i);
        if (descMatch) {
          description = descMatch[1].trim();
          title = title.replace(/with description[:\s]+.+ /i, '');
        }
        
        // Extract priority
        if (title.toLowerCase().includes('high priority') || title.includes('🔥')) {
          priority = 'high';
        } else if (title.toLowerCase().includes('low priority') || title.includes('🌿')) {
          priority = 'low';
        }
        
        // Clean up title
        title = title.replace(/with (?:high|low) priority/gi, '').replace(/🔥|🌿/g, '').trim();
        
        return { action: 'create', title, description, priority };
      }
    }
    
    // Delete task patterns
    if (lower.startsWith('delete task') || lower.startsWith('remove task') || lower.startsWith('cancel task')) {
      const match = text.match(/(?:delete task|remove task|cancel task)[:\s]+(.+)/i);
      if (match) {
        return { action: 'delete', title: match[1].trim() };
      }
    }
    
    // Update task patterns
    if (lower.startsWith('update task') || lower.startsWith('edit task') || lower.startsWith('change task')) {
      const match = text.match(/(?:update task|edit task|change task)[:\s]+(.+)/i);
      if (match) {
        const content = match[1].trim();
        // Parse: "old title to: new title" or "old title status: completed"
        const toMatch = content.match(/^(.+?)\s+to[:\s]+(.+)$/i);
        if (toMatch) {
          const oldTitle = toMatch[1].trim();
          const newValue = toMatch[2].trim();
          
          if (newValue.toLowerCase().startsWith('status:')) {
            const newStatus = newValue.replace(/status[:\s]+/i, '').trim();
            return { action: 'update', title: oldTitle, newStatus };
          } else if (newValue.toLowerCase().startsWith('priority:')) {
            const newPriority = newValue.replace(/priority[:\s]+/i, '').trim();
            return { action: 'update', title: oldTitle, newPriority };
          } else {
            return { action: 'update', title: oldTitle, newTitle: newValue };
          }
        }
        return { action: 'update', title: content };
      }
    }
    
    // Update status patterns
    if (lower.startsWith('complete task') || lower.includes('mark as complete')) {
      const match = text.match(/(?:complete task|mark as complete)[:\s]+(.+)/i);
      if (match) {
        return { action: 'complete', title: match[1].trim() };
      }
    }
    
    // Show tasks patterns
    if (lower === 'show tasks' || lower === 'show all tasks' || lower === 'list all tasks' || lower === 'list tasks' || lower === 'show my tasks') {
      return { action: 'show', status: 'all' };
    }
    if (lower === 'show pending tasks' || lower === 'pending tasks' || lower === 'show incomplete tasks' || lower === 'pending') {
      return { action: 'show', status: 'pending' };
    }
    if (lower === 'show completed tasks' || lower === 'completed tasks' || lower === 'completed') {
      return { action: 'show', status: 'completed' };
    }
    if (lower === 'show in progress tasks' || lower === 'in progress tasks' || lower === 'in progress' || lower === 'show progress') {
      return { action: 'show', status: 'in-progress' };
    }
    
    // Find task patterns
    if (lower.startsWith('find task') || lower.startsWith('search task') || lower.startsWith('look for task') || lower.startsWith('where is')) {
      const match = text.match(/(?:find task|search task|look for task|where is)[:\s]+(.+)/i);
      if (match) {
        return { action: 'find', title: match[1].trim() };
      }
    }
    
    return null;
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Parse command
      const command = parseCommand(textToSend);
      
      let response = "";
      let action: "none" | "refresh" = "none";

      if (command) {
        switch (command.action) {
          case "create":
            if (command.title) {
              const newTask = await createTask(command.title, command.description, command.priority);
              if (newTask) {
                response = "✅ Task created successfully!\n\n📝 " + newTask.title + "\nPriority: " + newTask.priority + "\nStatus: " + newTask.status;
                action = "refresh";
              } else {
                response = "❌ Sorry, I could not create the task. Please try again.";
              }
            } else {
              response = "Please specify a task title. For example: Create task: Buy milk";
            }
            break;
            
          case "delete":
            if (command.title) {
              const deleted = await deleteTaskByTitle(command.title);
              if (deleted) {
                response = "✅ Task \"" + command.title + "\" has been deleted!";
                action = "refresh";
              } else {
                response = "❌ I could not find a task matching \"" + command.title + "\". Try \"find task: " + command.title + "\" to search.";
              }
            } else {
              response = "Please specify which task to delete. For example: Delete task: Buy milk";
            }
            break;
            
          case "update":
            if (command.title) {
              if (command.newTitle || command.newStatus || command.newPriority) {
                const updated = await updateTaskByTitle(command.title, command.newTitle, command.newStatus, command.newPriority);
                if (updated) {
                  response = "✅ Task updated successfully!\n\n📝 " + updated.title + "\nStatus: " + updated.status + "\nPriority: " + updated.priority;
                  action = "refresh";
                } else {
                  response = "❌ I could not find a task matching \"" + command.title + "\".";
                }
              } else {
                response = "What do you want to update?\n\nExamples:\n• Update task: Buy milk to: Call doctor (change title)\n• Update task: Buy milk to: status: completed (change status)\n• Update task: Buy milk to: priority: high (change priority)";
              }
            } else {
              response = "Please specify which task to update. For example: Update task: Buy milk to: New Title";
            }
            break;
            
          case "complete":
            if (command.title) {
              const updated = await updateTaskByTitle(command.title, undefined, "completed");
              if (updated) {
                response = "✅ Task \"" + updated.title + "\" marked as completed! 🎉";
                action = "refresh";
              } else {
                response = "❌ I could not find a task matching \"" + command.title + "\".";
              }
            } else {
              response = "Please specify which task to complete.";
            }
            break;
            
          case "show":
            const tasks = await fetchTasks(command.status);
            if (tasks.length === 0) {
              const statusText = command.status === "all" ? "" : command.status + " ";
              response = "📋 No " + statusText + "tasks found. Create your first task!";
            } else {
              const statusText = command.status === "all" ? "All" : (command.status || "").replace("-", " ");
              response = "📋 " + statusText + " Tasks (" + tasks.length + "):\n\n";
              tasks.forEach((t, i) => {
                const statusIcon = t.status === "completed" ? "✅" : t.status === "in-progress" ? "🚀" : "💤";
                response += (i + 1) + ". " + statusIcon + " " + t.title + " (" + t.priority + ")\n";
              });
              if (tasks.length > 10) {
                response += "\n...and " + (tasks.length - 10) + " more tasks";
              }
            }
            break;
            
          case "find":
            if (command.title) {
              const allTasks = await fetchTasks();
              const found = allTasks.filter(t => 
                t.title.toLowerCase().includes(command.title!.toLowerCase())
              );
              if (found.length === 0) {
                response = "🔍 No tasks found matching \"" + command.title + "\"";
              } else {
                response = "🔍 Found " + found.length + " task(s) matching \"" + command.title + "\":\n\n";
                found.forEach((t, i) => {
                  const statusIcon = t.status === "completed" ? "✅" : t.status === "in-progress" ? "🚀" : "💤";
                  response += (i + 1) + ". " + statusIcon + " " + t.title + " (" + t.priority + ")\n";
                });
              }
            } else {
              response = "What task are you looking for?";
            }
            break;
            
          default:
            response = "I did not understand that command. Try:\n• Create task: Buy milk\n• Delete task: Buy milk\n• Update task: Buy milk to: New Title\n• Show tasks\n• Find task: milk";
        }
      } else {
        // Default help response
        response = "I can help you manage tasks! Try these commands:\n\n📝 Create Task\nCreate task: Buy milk\n\n🗑️ Delete Task\nDelete task: Buy milk\n\n✏️ Update Task\nUpdate task: Buy milk to: Call doctor\nUpdate task: Buy milk to: status: completed\n\n✅ Complete Task\nComplete task: Buy milk\n\n📋 Show Tasks\nShow tasks / Show pending tasks\n\n🔍 Find Task\nFind task: milk\n\nWhat would you like to do?";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Trigger page refresh if needed
      if (action === "refresh") {
        window.dispatchEvent(new Event("refresh-tasks"));
      }
      
    } catch (error) {
      console.error("Chatbot error:", error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Sorry, something went wrong. Please try again.",
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
          isOpen 
            ? 'bg-gray-700 rotate-90' 
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 animate-pulse-slow'
        }`}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI Assistant</h3>
                    <p className="text-indigo-100 text-xs">Online • Ready to help</p>
                  </div>
                </div>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-1">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(action.prompt)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition disabled:opacity-50"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-[90%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                        : 'bg-gray-400'
                    }`}>
                      {message.sender === 'user' ? (
                        <span className="text-white text-xs">👤</span>
                      ) : (
                        <span className="text-white text-xs">🤖</span>
                      )}
                    </div>
                    
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center">
                      <span className="text-white text-xs">🤖</span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="relative flex items-center space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a command..."
                  className="flex-1 bg-gray-100 border-0 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputText.trim()}
                  className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(99, 102, 241, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `}</style>
    </>
  );
}
