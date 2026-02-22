'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface UserInfo {
  name: string;
  email: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user info on mount
  useEffect(() => {
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');
    
    if (userName || userEmail) {
      setUserInfo({
        name: userName || 'User',
        email: userEmail || '',
      });
    }
  }, []);

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

  // Load previous chat history when chat opens (only first time)
  const hasLoadedHistory = useRef(false);
  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      loadChatHistory();
    }
  }, [isOpen]);

  // Add welcome message if no messages
  useEffect(() => {
    if (isOpen && messages.length === 0 && hasLoadedHistory.current) {
      const welcomeMessage: Message = {
        id: Date.now(),
        text: "👋 Assalamu alaykum! Welcome to TaskMate AI!\n\nI'm your personal task manager assistant.\n\nHow can I help you today? 😊",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
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
        const sortedMessages = data.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const loadedMessages: Message[] = sortedMessages.map((msg: any) => ({
          id: msg.id,
          text: msg.sender === 'user' ? msg.message : (msg.response || msg.message),
          sender: msg.sender as 'user' | 'bot',
          timestamp: new Date(msg.created_at)
        }));
        
        // Add welcome message at the start if no messages loaded
        if (loadedMessages.length === 0) {
          const welcomeMessage: Message = {
            id: Date.now(),
            text: "👋 Assalamu alaykum! Welcome to TaskMate AI!\n\nI'm your personal task manager assistant.\n\nHow can I help you today? 😊",
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        } else {
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Show welcome message on error
      const welcomeMessage: Message = {
        id: Date.now(),
        text: "👋 Assalamu alaykum! Welcome to TaskMate AI!\n\nI'm your personal task manager assistant.\n\nHow can I help you today? 😊",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  // Listen for task-action events
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

  // Detect Roman Urdu
  const isRomanUrdu = (text: string): boolean => {
    const romanUrduPatterns = [
      /kaisa/i, /kaise/i, /kya/i, /kaun/i, /kahaan/i, /kyun/i,
      /main/i, /tum/i, /woh/i, /yeh/i, /mera/i, /tera/i, /hamara/i,
      /hai/i, /ho/i, /tha/i, /thi/i, /the/i, /honge/i, /hoga/i, /hogi/i,
      /jao/i, /aao/i, /dekho/i, /suno/i, /bolo/i, /likho/i, /karo/i, /kijiye/i,
      /achha/i, /bahut/i, /kam/i, /zyada/i, /theek/i, /galat/i, /sahi/i,
      /mujhe/i, /tumhe/i, /unhe/i, /isko/i, /usko/i, /iske/i, /uske/i,
      /aur/i, /ya/i, /lekin/i, /magar/i, /phir/i, /abhi/i, /kabhi/i, /hamesha/i,
      /kal/i, /aaj/i, /parso/i, /inshaallah/i, /bismillah/i,
      /shukriya/i, /mashallah/i, /alhamdullillah/i,
      /kya haal/i, /kya khbr/i, /zaroorat hai/i,
      /mein/i, /ko/i, /se/i, /pe/i, /ka/i, /ki/i, /ke/i,
      /haan/i, /nahi/i, /na/i, /ji/i, /zaroor/i, /bilkul/i,
      /phir bhi/i, /to/i, /koi/i, /kuch/i, /sab/i, /kitna/i, /itna/i, /utna/i,
      /accha/i, /theek hai/i, /chalega/i, /ho jayega/i,
      /de do/i, /le lo/i, /kar do/i, /kar denge/i,
      /salam/i, /asalam/i, /peace/i, /alvida/i, /phir milenge/i,
    ];
    const lowerText = text.toLowerCase();
    return romanUrduPatterns.some(pattern => pattern.test(lowerText));
  };

  // Bot response logic with Roman Urdu support
  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    const isUrdu = isRomanUrdu(userInput);
    
    // User identity check
    if (lowerInput.includes('who am i') || lowerInput.includes('kon hun') || 
        lowerInput.includes('mein kaun') || lowerInput.includes('mera naam') ||
        lowerInput.includes('identify') || lowerInput.includes('mija kaun')) {
      if (userInfo) {
        return isUrdu 
          ? `📋 Aapki information:\n\n👤 Name: ${userInfo.name}\n📧 Email: ${userInfo.email}\n\nKoi aur sawaal? 😊`
          : `📋 Your information:\n\n👤 Name: ${userInfo.name}\n📧 Email: ${userInfo.email}\n\nAny other questions? 😊`;
      } else {
        return isUrdu 
          ? "⚠️ Mujhe aapki information nahi mili. Please login karein phir try karein."
          : "⚠️ I don't have your information. Please login first and try again.";
      }
    }
    
    // Greetings
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || 
        lowerInput.includes('hey') || lowerInput.includes('salam') ||
        lowerInput.includes('asalam') || lowerInput.includes('peace') ||
        lowerInput.includes('greetings')) {
      return "👋 Assalamu alaykum!\n\nHello! Welcome to TaskMate AI! 😊\n\nHow can I assist you today?\n\nAap ki tareh kar sakta hoon?";
    }
    
    // Help
    if (lowerInput.includes('help') || lowerInput.includes('madad') || 
        lowerInput.includes('sahayata') || lowerInput.includes('guide')) {
      return isUrdu
        ? `🤖 TaskMate AI - Help Guide\n\nMein aapki in cheezon mein madad kar sakta hoon:\n\n✅ Tasks add karna\n✅ Tasks dekhna\n✅ Tasks complete karna\n✅ Tasks delete karna\n\nExamples:\n• "Add task: Groceries le aana 🛒"\n• "Meri sari tasks dikhao"\n• "Task 1 complete kar do ✅"\n\nKya karna chahte hain? 😊`
        : `🤖 TaskMate AI - Help Guide\n\nI can help you with:\n\n✅ Adding new tasks\n✅ Viewing your tasks\n✅ Completing tasks\n✅ Deleting tasks\n\nExamples:\n• "Add task: Buy groceries 🛒"\n• "Show all my tasks"\n• "Complete task 1 ✅"\n\nWhat would you like to do? 😊`;
    }
    
    // Tasks
    if (lowerInput.includes('task') || lowerInput.includes('kaam') || 
        lowerInput.includes('work') || lowerInput.includes('todolist')) {
      return isUrdu
        ? "📝 Tasks ke baare mein madad chahiye?\n\nAap mujhe bol sakte hain:\n• 'Add task: Groceries le aana'\n• 'Meri sari tasks dikhao'\n• 'Task 1 complete kar do'\n• 'Task 2 delete kar do'\n\nKaisa task add karna chahte hain? 😊"
        : "📝 Need help with tasks?\n\nYou can tell me:\n• 'Add task: Buy groceries'\n• 'Show all my tasks'\n• 'Complete task 1'\n• 'Delete task 2'\n\nWhat task would you like to add? 😊";
    }
    
    // Thank you
    if (lowerInput.includes('thank') || lowerInput.includes('shukriya') || 
        lowerInput.includes('shukria') || lowerInput.includes('appreciate')) {
      return isUrdu
        ? "😊 Aapka shukriya! Khush hua madad kar ke!\n\nKoi aur sawaal ho to zaroor puchiye!"
        : "😊 You're welcome! Happy to help!\n\nFeel free to ask if you have any more questions!";
    }
    
    // How are you
    if (lowerInput.includes('how are') || lowerInput.includes('kaisa hai') || 
        lowerInput.includes('kaisi hai') || lowerInput.includes('kya haal') ||
        lowerInput.includes('kya khbr')) {
      return isUrdu
        ? "😊 Main theek hoon, shukriya! ☺️\n\nAap kais? Aapki kya help chahiye?"
        : "😊 I'm doing great, thank you! ☺️\n\nHow are you? How can I help you today?";
    }
    
    // What's your name
    if (lowerInput.includes('your name') || lowerInput.includes('tumhara naam') || 
        lowerInput.includes('aap ka naam') || lowerInput.includes('who are you') ||
        lowerInput.includes('kon ho')) {
      return isUrdu
        ? "🤖 Mera naam TaskMate AI hai!\n\nMain aapki task management mein madad karne ke liye hoon. 😊\n\nAap mujhe tasks add karne, dekhne, complete karne aur delete karne ke liye bol sakte hain!"
        : "🤖 My name is TaskMate AI!\n\nI'm here to help you manage your tasks! 😊\n\nYou can ask me to add, view, complete, or delete tasks!";
    }
    
    // Goodbye
    if (lowerInput.includes('bye') || lowerInput.includes('goodbye') || 
        lowerInput.includes('alvida') || lowerInput.includes('phir milenge') ||
        lowerInput.includes('see you later')) {
      return isUrdu
        ? "👋 Alvida! Phir milenge! 😊\n\nAllah hafiz! 🫡"
        : "👋 Goodbye! See you later! 😊\n\nTake care! 🫡";
    }
    
    // Default response
    return isUrdu
      ? "🤔 Samajh gaya! Main yahan task management mein madad ke liye hoon. 😊\n\nAap mujhe ye bol sakte hain:\n• Task add karna\n• Meri tasks dikhana\n• Task complete karna\n• Task delete karna\n• Help chahiye\n\nAap kya karna chahte hain?"
      : "🤔 I understand! I'm here to help you manage your tasks! 😊\n\nYou can ask me to:\n• Add a new task\n• Show your tasks\n• Complete a task\n• Delete a task\n• Get help\n\nWhat would you like to do?";
  };

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
        text: data.bot_response || data.response || getBotResponse(messageToSend),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Refresh tasks if a task was created/updated
      window.dispatchEvent(new CustomEvent('refresh-tasks'));
    } catch (error) {
      console.error('Chat error:', error);
      
      // Use local bot response as fallback
      const botMessage: Message = {
        id: Date.now() + 1,
        text: getBotResponse(messageToSend),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
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
      {/* Chat Toggle Button - Fixed position */}
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

      {/* Chat Window - Only render when open */}
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
                    setMessages([]);
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
                  style={{
                    borderTopLeftRadius: message.sender === 'bot' ? 4 : 18,
                    borderTopRightRadius: message.sender === 'user' ? 4 : 18,
                  }}
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
