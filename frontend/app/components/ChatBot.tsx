'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load previous chat history when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${backendUrl}/api/chatbot/messages`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort messages by timestamp - oldest first (for display at top)
        const sortedMessages = data.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const loadedMessages: Message[] = sortedMessages.map((msg: any) => ({
          id: msg.id,
          text: msg.sender === 'user' ? msg.message : (msg.response || msg.message),
          sender: msg.sender as 'user' | 'bot',
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Listen for task-action events to show notification in chatbot
  useEffect(() => {
    const handleTaskAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const botMessage: Message = {
          id: Date.now(),
          text: customEvent.detail.message || 'Your task list has been updated!',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    };

    window.addEventListener('task-action', handleTaskAction);
    return () => window.removeEventListener('task-action', handleTaskAction);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${backendUrl}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.bot_response || data.response || 'I\'m here to help with your tasks!',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Dispatch event to refresh tasks if a task was created/updated
      window.dispatchEvent(new CustomEvent('refresh-tasks'));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 transform hover:scale-110 ${isOpen ? 'rotate-90' : ''}`}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <span className="text-lg">✕</span>
        ) : (
          <span className="animate-pulse">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-50 w-[90vw] md:w-96 h-[60vh] md:h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl animate-bounce">
              🤖
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">TaskMate AI</h3>
              <p className="text-white/80 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online • AI Powered
              </p>
            </div>
            <button
              onClick={async () => {
                if (confirm('Sab chat history clear karna hai? 🗑️')) {
                  try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
                    const token = localStorage.getItem('access_token');
                    await fetch(`${backendUrl}/api/chatbot/messages`, {
                      method: 'DELETE',
                      headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      }
                    });
                    setMessages([]);
                  } catch (error) {
                    console.error('Failed to clear chat:', error);
                  }
                }
              }}
              className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all"
              title="Clear chat"
            >
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-violet-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8 px-4">
                <div className="text-5xl mb-3">👋</div>
                <p className="font-bold text-xl text-gray-700">As-salamu alaykum! </p>
                <p className="text-sm mt-2 text-gray-500">Main TaskMate hu, aapki task manager buddy! 😊</p>
                <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm text-left">
                  <p className="text-xs font-semibold text-gray-400 mb-3">Kuch try karein:</p>
                  <p className="text-sm text-violet-600">• "Add task: Groceries le aana 🛒"</p>
                  <p className="text-sm text-violet-600">• "Project report kal tak khatam karna"</p>
                  <p className="text-sm text-violet-600">• "Meri sari tasks dikhao"</p>
                  <p className="text-sm text-violet-600">• "Task 1 complete kar do ✅"</p>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your task..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
