'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user ID and chat history
  useEffect(() => {
    const uid = localStorage.getItem('user_id');
    setUserId(uid);
    
    if (uid) {
      loadChatHistory();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/chatbot/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const formatted: Message[] = data.map((m: any) => ({
          id: m.id.toString(),
          text: m.message,
          sender: m.sender as 'user' | 'bot',
          timestamp: new Date(m.created_at)
        }));
        
        if (formatted.length === 0) {
          setMessages([{
            id: 'welcome',
            text: "Hi! I'm your AI Task Assistant! 🎉\n\nTry:\n• 'Add task to buy groceries'\n• 'Show my tasks'\n• 'Complete task'\n• 'Delete task'",
            sender: 'bot',
            timestamp: new Date()
          }]);
        } else {
          setMessages(formatted);
        }
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessages(prev => [...prev, {
          id: 'error',
          text: 'Please login to use chatbot',
          sender: 'bot',
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: input.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMsg]);

        // Refresh tasks if action was performed
        if (data.action) {
          const timestamp = Date.now();
          // Store timestamp for cross-page sync
          localStorage.setItem('tasks-refresh-trigger', timestamp.toString());
          
          // Dispatch event for same-page refresh
          const event = new CustomEvent('refresh-tasks', { 
            detail: { action: data.action, timestamp } 
          });
          window.dispatchEvent(event);
          
          // Force reload the tasks page to show new task
          setTimeout(() => {
            window.location.href = '/tasks';
          }, 500);
          
          console.log('✅ Task action completed, redirecting to tasks page:', data.action);
        }
      } else {
        setMessages(prev => [...prev, {
          id: 'error',
          text: 'Something went wrong. Please try again.',
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: 'error',
        text: 'Connection error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/chatbot/messages`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessages([{
        id: 'welcome',
        text: "Chat cleared! How can I help you? 😊",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? 'bg-gray-700 rotate-90' : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-semibold">✨ Task Assistant</span>
            <button onClick={clearChat} className="text-white/80 hover:text-white text-xs" title="Clear chat">
              🗑️
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 bg-gray-50 border-b flex flex-wrap gap-1">
            <button onClick={() => setInput('Add task: ')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
              ➕ Add
            </button>
            <button onClick={() => setInput('Show my tasks')} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
              📋 Tasks
            </button>
            <button onClick={() => setInput('Complete task')} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200">
              ✅ Done
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
