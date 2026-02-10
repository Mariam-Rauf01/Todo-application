'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  language?: string;
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

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Friend');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! 👋 I'm your intelligent AI Task Assistant. I can understand natural conversations in any language. Tell me what you need help with - I can help you manage tasks, answer questions, or just chat! 😊",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedUserName = localStorage.getItem('user_name');
    if (storedUserId) {
      setUserId(storedUserId);
      setUserName(storedUserName || 'Friend');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Detect language from text
  const detectLanguage = (text: string): string => {
    const urduRegex = /[\u0600-\u06FF]/g;
    const hindiRegex = /[\u0900-\u097F]/g;
    const romanUrduRegex = /\b(mujhe|mere|meri|kya|kaunsa|task|kaam|banao|dalo|hatao|update|karna|hai|ho|hain|hn|dikhao|dikha|batao)\b/gi;
    
    if (urduRegex.test(text)) return 'urdu';
    if (hindiRegex.test(text)) return 'hindi';
    if (romanUrduRegex.test(text)) return 'roman_urdu';
    return 'english';
  };

  // Parse natural language input for task operations
  const parseNaturalLanguage = async (text: string) => {
    const language = detectLanguage(text);
    const lowerText = text.toLowerCase();

    // Task creation patterns
    if (/(?:create|add|new|make|banao|dalo|mujhe ek)\s+(?:task|todos?|kaam)/i.test(text) ||
        /(?:i need|i want|mujhe)\s+(?:to )?(create|add|make)\s+(?:task|todos?|kaam)/i.test(text)) {
      const titleMatch = text.match(/(?:create|add|new|make|banao|dalo)\s+(?:task|kaam)[:\s]+(.+)/i);
      if (titleMatch) {
        return { action: 'create', title: titleMatch[1].trim(), language };
      }
      return { action: 'create_help', language };
    }

    // Task update patterns
    if (/(?:update|change|edit|modify|badlo|update karna|change karna)\s+(?:task|tasks|kaam)/i.test(text)) {
      const updateMatch = text.match(/(?:update|change|edit|modify|badlo)\s+(?:task|kaam)[:\s]+(.+?)\s+to\s+(.+)/i) ||
                         text.match(/(?:update|change|edit|modify|badlo).+?([^to]+)\s+to\s+(.+)/i);
      if (updateMatch) {
        return { action: 'update', oldTitle: updateMatch[1]?.trim(), newTitle: updateMatch[2]?.trim(), language };
      }
      // For Roman Urdu: "update karo: old title ko new title"
      const romanUpdateMatch = text.match(/(?:update|badlo).+?([^ko]+?)\s+(?:ko|se)\s+(.+)/i);
      if (romanUpdateMatch) {
        return { action: 'update', oldTitle: romanUpdateMatch[1]?.trim(), newTitle: romanUpdateMatch[2]?.trim(), language };
      }
      return { action: 'update_help', language };
    }

    // Task deletion patterns
    if (/(?:delete|remove|hatao|cancel)\s+(?:task|tasks|kaam|todos?)/i.test(text)) {
      const titleMatch = text.match(/(?:delete|remove|hatao|cancel)\s+(?:task|kaam)[:\s]+(.+)/i);
      if (titleMatch) {
        return { action: 'delete', title: titleMatch[1].trim(), language };
      }
      return { action: 'delete_help', language };
    }

    // Show tasks patterns
    if (/(?:show|list|display|dikha|dikhao|batao|kya|what)\s+(?:tasks?|todos?|kaam)/i.test(text) ||
        /(?:my |meri |mere )(?:tasks?|todos?|kaam)/i.test(text)) {
      return { action: 'show', language };
    }

    return { action: 'chat', language };
  };

  const createTask = async (title: string): Promise<Task | null> => {
    if (!userId) return null;
    try {
      const response = await fetch('/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: '',
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
    } catch (error) {
      console.error('Error creating task:', error);
    }
    return null;
  };

  const deleteTask = async (title: string): Promise<boolean> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'DELETE',
        });
        return response.ok;
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    return false;
  };

  const updateTask = async (oldTitle: string, newTitle: string): Promise<Task | null> => {
    const tasks = await fetchTasks();
    const task = tasks.find(t => t.title.toLowerCase().includes(oldTitle.toLowerCase()));
    if (task) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
    return null;
  };

  const fetchTasks = async (): Promise<Task[]> => {
    if (!userId) return [];
    try {
      const response = await fetch(`/api/tasks/?user_id=${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    return [];
  };

  const generateAIResponse = async (userMessage: string, language: string, action: string, parseResult: any) => {
    const tasks = await fetchTasks();
    
    const responses: { [key: string]: { [key: string]: string | Function } } = {
      english: {
        create_help: `Sure! What task would you like to create? Just tell me the task title. (e.g., "create task: Buy groceries")`,
        create_success: (title: string) => `✅ Great! I've created the task "${title}" for you!`,
        create_error: `❌ Sorry, I couldn't create that task. Please try again.`,
        update_help: `Which task would you like to update? Tell me the old title and the new title. (e.g., "update task: buy milk to: buy bread")`,
        update_success: (oldTitle: string, newTitle: string) => `✅ Done! I've updated "${oldTitle}" to "${newTitle}"!`,
        update_error: (oldTitle: string) => `❌ I couldn't find a task matching "${oldTitle}". Try "show tasks" to see what you have.`,
        delete_help: `Which task would you like to delete? Here are your current tasks:\n${tasks.length > 0 ? tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n') : 'You have no tasks yet!'}`,
        delete_success: (title: string) => `✅ Done! I've deleted "${title}" for you!`,
        delete_error: (title: string) => `❌ I couldn't find a task matching "${title}". Try "show tasks" to see what you have.`,
        show_empty: `You don't have any tasks yet! Want to create one? Just say "create task: [task name]"`,
        show_list: (list: string) => `📋 Here are your current tasks, ${userName}:\n\n${list}\n\nWould you like to create a new one or update any of these?`,
        default: `I'm here to help! I can:\n• Create tasks (say "create task: buy milk")\n• Show your tasks (say "show tasks")\n• Update tasks (say "update task: old to: new")\n• Delete tasks (say "delete task: buy milk")\n\nWhat would you like to do?`,
      },
      urdu: {
        create_help: `بالکُل! آپ کونسا کام بنانا چاہتے ہیں؟ مثال: "نیا کام: دودھ خریدنا"`,
        create_success: (title: string) => `✅ بہترین! میں نے آپ کا کام "${title}" بنا دیا ہے!`,
        create_error: `❌ معافی چاہتا ہوں، کام نہیں بن سکا۔ دوبارہ کوشش کریں۔`,
        update_help: `آپ کونسا کام بدلنا چاہتے ہیں؟ پرانا اور نیا نام بتائیں۔`,
        update_success: (oldTitle: string, newTitle: string) => `✅ ہو گیا! میں نے "${oldTitle}" کو "${newTitle}" میں بدل دیا۔`,
        update_error: (oldTitle: string) => `❌ مجھے "${oldTitle}" نہیں ملا۔ "کام دکھاؤ" کہہ کر اپنے کام دیکھیں۔`,
        delete_help: `آپ کونسا کام حذف کرنا چاہتے ہیں؟ یہ آپ کے کام ہیں:\n${tasks.length > 0 ? tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n') : 'آپ کے پاس کوئی کام نہیں!'}`,
        delete_success: (title: string) => `✅ ہو گیا! میں نے "${title}" حذف کر دیا۔`,
        delete_error: (title: string) => `❌ مجھے "${title}" نہیں ملا۔ "کام دکھاؤ" کہہ کر اپنے کام دیکھیں۔`,
        show_empty: `آپ کے پاس ابھی کوئی کام نہیں! نیا کام بنائیں؟ "نیا کام: [نام]" کہیں۔`,
        show_list: (list: string) => `📋 یہاں آپ کے کام ہیں:\n\n${list}\n\nنیا کام بنائیں یا موجودہ کام بدلیں؟`,
        default: `میں آپ کی مدد کے لیے یہاں ہوں! میں یہ کر سکتا ہوں:\n• نیا کام بنائیں\n• کام دیکھیں\n• کام بدلیں\n• کام حذف کریں\n\nآپ کیا کرنا چاہتے ہیں?`,
      },
      roman_urdu: {
        create_help: `Bilkul! Aap konsa kaam banana chahte ho? Masalan: "naya kaam: doodh khareedna"`,
        create_success: (title: string) => `✅ Great! Maine aapka kaam "${title}" bana diya!`,
        create_error: `❌ Maafi chahta hoon, kaam nahi ban saka. Dobara koshish karo.`,
        update_help: `Aap konsa kaam badalna chahte ho? Purana aur naya naam batao.`,
        update_success: (oldTitle: string, newTitle: string) => `✅ Ho gaya! Maine "${oldTitle}" ko "${newTitle}" mein badal diya!`,
        update_error: (oldTitle: string) => `❌ Mujhe "${oldTitle}" nahi mila. "Show tasks" kahho apne kaam dekhne ke liye.`,
        delete_help: `Aap konsa kaam delete karna chahte ho? Yeh aapke kaam hain:\n${tasks.length > 0 ? tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n') : 'Aapke pass koi kaam nahi!'}`,
        delete_success: (title: string) => `✅ Ho gaya! Maine "${title}" delete kar diya!`,
        delete_error: (title: string) => `❌ Mujhe "${title}" nahi mila. "Show tasks" kahho dekhne ke liye.`,
        show_empty: `Aapke pass abhi koi kaam nahi! Naya kaam banana ho? "Create task: [name]" kahho.`,
        show_list: (list: string) => `📋 Yeh aapke kaam hain:\n\n${list}\n\nNaya kaam banana ho ya purane ko update karna ho?`,
        default: `Main aapki madad ke liye yahan hoon! Main yeh kar sakta hoon:\n• Naya kaam banana\n• Kaam dekhna\n• Kaam update karna\n• Kaam delete karna\n\nAap kya karna chahte ho?`,
      },
      hindi: {
        create_help: `बिल्कुल! आप कौन सा काम बनाना चाहते हैं? उदाहरण: "नया काम: दूध खरीदना"`,
        create_success: (title: string) => `✅ शानदार! मैंने आपका काम "${title}" बना दिया है!`,
        create_error: `❌ खेद है, काम नहीं बन सका। कृपया फिर से कोशिश करें।`,
        update_help: `आप कौन सा काम अपडेट करना चाहते हैं? पुराना और नया नाम बताएं।`,
        update_success: (oldTitle: string, newTitle: string) => `✅ हो गया! मैंने "${oldTitle}" को "${newTitle}" में बदल दिया है!`,
        update_error: (oldTitle: string) => `❌ मुझे "${oldTitle}" नहीं मिला। "काम दिखाओ" कहकर अपने काम देखें।`,
        delete_help: `आप कौन सा काम हटाना चाहते हैं? ये आपके काम हैं:\n${tasks.length > 0 ? tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n') : 'आपके पास कोई काम नहीं है!'}`,
        delete_success: (title: string) => `✅ हो गया! मैंने "${title}" हटा दिया है।`,
        delete_error: (title: string) => `❌ मुझे "${title}" नहीं मिला। "काम दिखाओ" कहकर अपने काम देखें।`,
        show_empty: `आपके पास अभी कोई काम नहीं है! नया काम बनाएं? "नया काम: [नाम]" कहें।`,
        show_list: (list: string) => `📋 आपके काम यहाँ हैं:\n\n${list}\n\nनया काम बनाएं या मौजूदा काम अपडेट करें?`,
        default: `मैं आपकी मदद के लिए यहाँ हूँ! मैं यह कर सकता हूँ:\n• नया काम बनाएं\n• काम देखें\n• काम अपडेट करें\n• काम हटाएं\n\nआप क्या करना चाहते हैं?`,
      }
    };

    const langResponses = responses[language] || responses.english;
    let response = '';

    try {
      if (action === 'create') {
        if (parseResult.title) {
          const newTask = await createTask(parseResult.title);
          if (newTask) {
            response = typeof langResponses.create_success === 'function' 
              ? (langResponses.create_success as Function)(parseResult.title)
              : String(langResponses.create_success);
          } else {
            response = String(langResponses.create_error);
          }
        } else {
          response = String(langResponses.create_help);
        }
      } else if (action === 'create_help') {
        response = String(langResponses.create_help);
      } else if (action === 'update') {
        if (parseResult.oldTitle && parseResult.newTitle) {
          const updated = await updateTask(parseResult.oldTitle, parseResult.newTitle);
          if (updated) {
            response = typeof langResponses.update_success === 'function'
              ? (langResponses.update_success as Function)(parseResult.oldTitle, parseResult.newTitle)
              : String(langResponses.update_success);
          } else {
            response = typeof langResponses.update_error === 'function'
              ? (langResponses.update_error as Function)(parseResult.oldTitle)
              : String(langResponses.update_error);
          }
        } else {
          response = String(langResponses.update_help);
        }
      } else if (action === 'update_help') {
        response = String(langResponses.update_help);
      } else if (action === 'delete') {
        if (parseResult.title) {
          const deleted = await deleteTask(parseResult.title);
          if (deleted) {
            response = typeof langResponses.delete_success === 'function'
              ? (langResponses.delete_success as Function)(parseResult.title)
              : String(langResponses.delete_success);
          } else {
            response = typeof langResponses.delete_error === 'function'
              ? (langResponses.delete_error as Function)(parseResult.title)
              : String(langResponses.delete_error);
          }
        } else {
          response = String(langResponses.delete_help);
        }
      } else if (action === 'delete_help') {
        response = String(langResponses.delete_help);
      } else if (action === 'show') {
        if (tasks.length === 0) {
          response = String(langResponses.show_empty);
        } else {
          const taskList = tasks.map((t, i) => `${i + 1}. ✏️ ${t.title} (${t.status})`).join('\n');
          response = typeof langResponses.show_list === 'function'
            ? (langResponses.show_list as Function)(taskList)
            : String(langResponses.show_list);
        }
      } else {
        response = String(langResponses.default);
      }
    } catch (error) {
      console.error('Error in generateAIResponse:', error);
      response = 'Sorry, something went wrong. Please try again.';
    }

    return response;
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
      const parsed = await parseNaturalLanguage(textToSend);
      const response = await generateAIResponse(textToSend, parsed.language, parsed.action, parsed);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        language: parsed.language,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center font-bold text-white text-2xl"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        title="AI Assistant"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <span>💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col rounded-lg shadow-2xl overflow-hidden bg-white">
          {/* Header */}
          <div
            className="text-white p-4 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-lg">AI Assistant</h3>
                <p className="text-sm text-indigo-100">Talk naturally in any language</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (supports all languages)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🌍 English • اردو • हिंदी • Roman Urdu (Romanized) • and more!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
