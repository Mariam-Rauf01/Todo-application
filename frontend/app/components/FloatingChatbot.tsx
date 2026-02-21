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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Get user-specific localStorage key
  const getChatStorageKey = () => {
    const uid = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    return uid ? `chat_history_${uid}` : 'chat_history';
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getChatStorageKey());
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        } catch {
          // If parsing fails, return default
        }
      }
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedUserEmail = localStorage.getItem('user_email');
    const storedUserName = localStorage.getItem('user_name');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    if (storedUserEmail) {
      setUserEmail(storedUserEmail);
    }
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  // Debug: log when messages change
  useEffect(() => {
    console.log('📬 Messages updated:', messages.length, 'messages');
    messages.forEach((m, i) => console.log(`  ${i}: ${m.sender} - ${m.text.substring(0, 30)}...`));
  }, [messages]);

  // Reload chat history when user changes
  useEffect(() => {
    console.log('User ID changed:', userId);
    if (userId) {
      console.log('Loading messages for user:', userId);
      // Always load from backend database (source of truth)
      loadMessagesFromDb().then((hasMessages) => {
        console.log('Has messages from DB:', hasMessages);
        if (!hasMessages) {
          // Show welcome message if no messages in DB
          console.log('No messages in DB, showing welcome message');
          setMessages([getWelcomeMessage()]);
        }
      });
    }
  }, [userId]);

  // Load messages from backend database
  const loadMessagesFromDb = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token, showing welcome message');
        return false;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      console.log('Loading messages from:', `${backendUrl}/api/chatbot/messages?limit=50`);
      
      const response = await fetch(`${backendUrl}/api/chatbot/messages?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const dbMessages = await response.json();
        console.log('DB Messages loaded:', dbMessages.length, 'messages');
        console.log('Raw DB messages:', dbMessages);

        if (dbMessages && dbMessages.length > 0) {
          // Backend returns in ascending order (oldest first) - display as is
          const formattedMessages: Message[] = dbMessages.map((m: any) => ({
            id: m.id.toString(),
            text: m.message,  // For both user and bot, message is in 'message' field
            sender: m.sender === 'user' ? 'user' : 'bot',
            timestamp: new Date(m.created_at)
          }));

          console.log('Formatted messages:', formattedMessages.length);
          console.log('First few messages:', formattedMessages.slice(0, 3));

          setMessages(formattedMessages);
          // Also save to localStorage
          localStorage.setItem(getChatStorageKey(), JSON.stringify(formattedMessages));

          // Scroll to bottom after loading
          setTimeout(() => scrollToBottom(), 100);

          return true; // Return true if messages loaded
        } else {
          console.log('No messages in database');
        }
      } else {
        console.error('Failed to load messages, status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (e) {
      console.error('Error loading messages from DB:', e);
    }
    return false; // Return false if no messages
  };

  const getWelcomeMessage = (): Message => ({
    id: '1',
    text: "Hi! I'm your AI Task Assistant! 🎉\n\nI understand both English and Roman Urdu/Hindi!\n\n📝 ENGLISH Commands:\n• 'Create task: Buy groceries'\n• 'Show my tasks'\n• 'Delete task: Buy milk'\n• 'Mark task: Finish report as completed'\n• 'List pending tasks'\n\n📝 ROMAN URDU/HINDI Commands:\n• 'Task banao: Grocery shopping'\n• 'Mere tasks dikhao'\n• 'Task hatao: Milk'\n• 'Task complete karo: Report'\n• 'Pending tasks list karo'\n\nTry me in any language! 🤖",
    sender: 'bot',
    timestamp: new Date(),
  });

  // Save chat history to localStorage (backup only - DB is source of truth)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const hasRealMessages = messages.some(m => m.sender === 'user' || m.sender === 'bot');
      if (hasRealMessages) {
        localStorage.setItem(getChatStorageKey(), JSON.stringify(messages));
      }
    }
  }, [messages]);

  // Clear chat function
  const clearChat = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      // Clear from backend DB
      await fetch(`${backendUrl}/api/chatbot/messages`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Clear from localStorage
      localStorage.removeItem(getChatStorageKey());
      
      // Show welcome message
      setMessages([getWelcomeMessage()]);
      console.log('Chat cleared successfully');
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  // Clear chat when user logs out
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem(getChatStorageKey());
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
    };
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change or chat opens
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTasks = async (): Promise<Task[]> => {
    if (!userId) return [];
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/tasks/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  };

  // Save message to database
  const saveMessageToDb = async (message: string, response: string, sender: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      console.log('Saving message to DB:', { message, response, sender, hasToken: !!token, userId });

      if (!token) {
        console.warn('No auth token found, skipping save to DB');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const url = `${backendUrl}/api/chatbot/messages`;

      console.log('Posting to:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message || '',
          response: response || '',
          sender: sender || 'user'
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Message saved successfully:', data);
        return data;
      } else {
        const error = await res.text();
        console.error('Failed to save message:', res.status, error);
      }
    } catch (e) {
      console.error('Error saving message to database:', e);
    }
  };

  // Parse JSON blocks from bot response
  const parseJsonBlocks = (text: string): any[] => {
    const jsonBlocks: any[] = [];
    const jsonRegex = /```json\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = jsonRegex.exec(text)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);
        jsonBlocks.push(parsed);
      } catch (e) {
        console.warn('Failed to parse JSON block:', e);
      }
    }
    
    return jsonBlocks;
  };

  // Execute actions from JSON blocks
  const executeActions = async (actions: any[]) => {
    let refresh = false;
    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    for (const action of actions) {
      try {
        switch (action.action) {
          case 'add':
            // Task already created by backend, just refresh
            refresh = true;
            console.log('✅ Task created via backend, will refresh tasks list');
            break;

          case 'update':
            if (action.task_id && action.updates) {
              const response = await fetch(`${backendUrl}/api/tasks/${action.task_id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(action.updates)
              });
              
              if (!response.ok) {
                console.error('Failed to update task:', response.status);
              }
              refresh = true;
            }
            break;

          case 'delete':
            if (action.task_id) {
              const response = await fetch(`${backendUrl}/api/tasks/${action.task_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                console.error('Failed to delete task:', response.status);
              }
              refresh = true;
            }
            break;

          case 'complete':
            if (action.task_id) {
              const response = await fetch(`${backendUrl}/api/tasks/${action.task_id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'completed' })
              });
              
              if (!response.ok) {
                console.error('Failed to complete task:', response.status);
              }
              refresh = true;
            }
            break;

          case 'list':
            // Just display, no DB action needed
            console.log('📋 Listing tasks');
            break;
            
          default:
            console.log('Unknown action:', action.action);
        }
      } catch (e) {
        console.error('❌ Failed to execute action:', action, e);
      }
    }

    if (refresh) {
      // Wait a moment before refreshing to ensure backend has updated
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('🔄 Refreshing tasks list...');
      window.dispatchEvent(new Event("refresh-tasks"));
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    console.log('📤 Sending message:', text);

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    console.log('➕ User message added to state');
    setInputText('');
    setIsLoading(true);

    try {
      let response = '';

      // ALWAYS use backend AI chatbot for ALL commands
      try {
        const token = localStorage.getItem('access_token');
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

        const aiResponse = await fetch(`${backendUrl}/api/chatbot/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: text })
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          response = data.response;

          // Parse and execute JSON blocks from response (but don't display JSON to user)
          const jsonBlocks = parseJsonBlocks(response);
          
          // Remove JSON blocks from the displayed message
          let cleanResponse = response.replace(/```json\n[\s\S]*?\n```/g, '').trim();
          
          // Remove task list if present (lines starting with ⬜ or ✅, or "📋 Your recent tasks" section)
          const lines = cleanResponse.split('\n');
          const filteredLines: string[] = [];
          let skipSection = false;
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip task list headers and task items
            if (trimmedLine.includes('📋 Your recent tasks') || 
                trimmedLine.includes('📋 Pending Tasks') ||
                trimmedLine.includes('📋 Your Tasks')) {
              skipSection = true;
              continue;
            }
            
            // Skip task items (lines with ⬜ or ✅)
            if (trimmedLine.startsWith('⬜') || trimmedLine.startsWith('✅')) {
              continue;
            }
            
            // If we hit a non-task line, stop skipping
            if (trimmedLine && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('•')) {
              skipSection = false;
            }
            
            // Add line if not skipping and not empty or part of task list
            if (!skipSection && trimmedLine) {
              filteredLines.push(line);
            }
          };
          
          cleanResponse = filteredLines.join('\n').trim();
          
          // Remove any extra newlines
          cleanResponse = cleanResponse.replace(/\n\s*\n/g, '\n').trim();
          
          // If response is now empty or only contains "Here", show a generic confirmation
          if (!cleanResponse || cleanResponse.length < 5) {
            response = "✅ Done! Task updated successfully.";
          } else {
            response = cleanResponse;
          }
          
          console.log('Clean response:', response);
          
          // Check if user is performing task operations (based on their message)
          const userMessageLower = text.toLowerCase();
          const isTaskOperation = 
            userMessageLower.includes('create') || userMessageLower.includes('add') ||
            userMessageLower.includes('banao') || userMessageLower.includes('naya') ||
            userMessageLower.includes('update') || userMessageLower.includes('edit') ||
            userMessageLower.includes('delete') || userMessageLower.includes('remove') || 
            userMessageLower.includes('hatao') ||
            userMessageLower.includes('complete') || userMessageLower.includes('mark') ||
            userMessageLower.includes('done') || userMessageLower.includes('tick') ||
            userMessageLower.includes('karo') || userMessageLower.includes('status');
          
          // Execute actions from JSON blocks or refresh if task operation detected
          if (jsonBlocks.length > 0) {
            await executeActions(jsonBlocks);
          } else if (isTaskOperation) {
            // If user is doing a task operation but no JSON blocks, still refresh
            console.log('🔄 Task operation detected, refreshing tasks...');
            await new Promise(resolve => setTimeout(resolve, 600));
            window.dispatchEvent(new Event("refresh-tasks"));
          }
        } else {
          response = "I'm here to help! 😊 You can ask me to create tasks, show tasks, delete tasks, or get your info. Try in Roman Urdu too!";
        }
      } catch (error) {
        console.error("AI Chat error:", error);
        response = "I'm here to help! 😊 You can ask me to create tasks, show tasks, delete tasks, or get your info. Try in Roman Urdu too!";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      console.log('🤖 Bot response:', response);
      console.log('➕ Adding bot message to state');
      
      // Use functional update to get latest state
      setMessages(prev => [...prev, botMessage]);
      console.log('✅ Bot message added');

      // Scroll to bottom after bot response
      setTimeout(() => scrollToBottom(), 100);

      // Backend already saves messages in /chat endpoint, no need to save again

    } catch (error) {
      console.error("Chatbot error:", error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Error: Something went wrong',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);

      // Save error message to database (only if backend failed)
      await saveMessageToDb(text, 'Error: Something went wrong', 'user');
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearChat}
                    className="text-white/80 hover:text-white text-xs"
                    title="Clear chat"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="bg-purple-50 px-2 py-2 border-b border-purple-100">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setInputText('who am i')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">👤 Profile</button>
                <button onClick={() => setInputText('create task: ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">+ Add</button>
                <button onClick={() => setInputText('update: -> ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">~ Edit</button>
                <button onClick={() => setInputText('delete task: ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">- Delete</button>
                <button onClick={() => setInputText('complete task: ')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">✓ Done</button>
                <button onClick={() => setInputText('show my tasks')} className="px-2 py-1 bg-white rounded text-xs hover:bg-purple-100">📋 List</button>
              </div>
            </div>

            {/* Messages Area - newest at bottom */}
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
