'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'task_card' | 'quick_replies' | 'task_list';
  tasks?: Task[];
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  recurring?: string | null;
}

export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Friend');
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    data: any;
    message: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Assalamu Alaikum! Main aapka AI Task Assistant hoon!\n\nAap mujhe seedha message bhej kar ke tasks manage kar sakte hain. Kya aaj karna hai? 😊",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedUserName = localStorage.getItem('user_name');
    if (storedUserId) {
      setUserId(storedUserId);
      setUserName(storedUserName || 'Dost');
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTasks = async () => {
    if (!userId) {
      const storedUserId = localStorage.getItem('user_id');
      if (!storedUserId) return;
      setUserId(storedUserId);
    }
    try {
      const uid = userId || localStorage.getItem('user_id');
      const response = await fetch(`/api/tasks/?user_id=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Quick reply buttons
  const quickReplies = [
    { label: '📋 Mere Tasks', action: 'show' },
    { label: '➕ Naya Task', action: 'create' },
    { label: '✅ Complete Task', action: 'complete' },
    { label: '🗑️ Delete Task', action: 'delete' },
  ];

  const handleQuickReply = (action: string) => {
    switch (action) {
      case 'show':
        handleSendMessage('mere tasks dikhao');
        break;
      case 'create':
        handleSendMessage('add new task');
        break;
      case 'complete':
        handleSendMessage('task complete');
        break;
      case 'delete':
        handleSendMessage('task delete');
        break;
    }
  };

  // Detect language
  const detectLanguage = (text: string): string => {
    const urduRegex = /[\u0600-\u06FF]/g;
    const hindiRegex = /[\u0900-\u097F]/g;
    const romanUrduRegex = /\b(mujhe|mere|meri|kya|kaunsa|kaam|banao|dalo|hatao|karna|hai|ho|hain|hn|dikhao|dikha|batao|apna|aapka|humaray|humaray|unka|inka|ek|do|tin|char|paanch|chas|ath|nahin|nahi|lekin|magar|phir|koi|kon|konsa|kahan|kyun|kais|aise|waise|tab|kal|aaj|raat|subah|shaam|din|month|saal|ghar|baar|bahar|andar|niche|upar|saamne|pichay|chalo|jayo|ao|raho|baitho|utho|khalo|phailao|samu|bhai|yaar|ho gaya|theek hai|koi baat nahi|shukriya|shukria|allah haafiz|bye|pheir|dekhte hain)\b/gi;
    
    if (urduRegex.test(text)) return 'urdu';
    if (hindiRegex.test(text)) return 'hindi';
    if (romanUrduRegex.test(text)) return 'roman_urdu';
    return 'english';
  };

  // Parse natural language
  const parseNaturalLanguage = async (text: string) => {
    const language = detectLanguage(text);
    const lowerText = text.toLowerCase();

    // Create task patterns
    if (/(?:create|add|new|make|banao|dalo|mujhe ek|naya|add karo)\s+(?:task|todos?|kaam)?/i.test(text) ||
        /(?:i need|i want|mujhe)\s+(?:to )?(create|add|make)\s+(?:task|todos?|kaam)?/i.test(text)) {
      const titleMatch = text.match(/(?:create|add|new|make|banao|dalo)\s+(?:task|kaam)?[:\s]+(.+)/i) ||
                        text.match(/(?:task|kaam)?[:\s]+(.+)/i);
      if (titleMatch && titleMatch[1] && titleMatch[1].length > 1) {
        return { action: 'create', title: titleMatch[1].trim(), language };
      }
      return { action: 'create_help', language };
    }

    // Complete task patterns
    if (/(?:complete|done|finish|ho gaya|ho gya|kar diya|done karo)\s+(?:task|tasks|kaam)?/i.test(text) ||
        /(?:task|tasks|kaam)\s+(?:complete|done|finish)/i.test(text)) {
      const titleMatch = text.match(/(?:complete|done|finish)\s+(?:task|kaam)?[:\s]+(.+)/i) ||
                        text.match(/(?:task|kaam)?[:\s]+(.+)/i);
      if (titleMatch && titleMatch[1]) {
        return { action: 'complete', title: titleMatch[1].trim(), language };
      }
      return { action: 'complete_help', language };
    }

    // Delete task patterns
    if (/(?:delete|remove|hatao|cancel|khatam)\s+(?:task|tasks|kaam|todos?)?/i.test(text)) {
      const titleMatch = text.match(/(?:delete|remove|hatao|cancel)\s+(?:task|kaam)?[:\s]+(.+)/i);
      if (titleMatch && titleMatch[1]) {
        return { action: 'delete', title: titleMatch[1].trim(), language };
      }
      return { action: 'delete_help', language };
    }

    // Update task patterns
    if (/(?:update|change|edit|badlo|modify)\s+(?:task|tasks|kaam)?/i.test(text)) {
      const updateMatch = text.match(/(?:update|change|edit|badlo)\s+(?:task|kaam)?[:\s]+(.+?)\s+(?:to|ko|se)\s+(.+)/i);
      if (updateMatch) {
        return { action: 'update', oldTitle: updateMatch[1]?.trim(), newTitle: updateMatch[2]?.trim(), language };
      }
      return { action: 'update_help', language };
    }

    // Show tasks patterns
    if (/(?:show|list|display|dikha|dikhao|batao|kya|what)\s+(?:tasks?|todos?|kaam)?/i.test(text) ||
        /(?:my |meri |mere |sab |sabhi )(?:tasks?|todos?|kaam)/i.test(text) ||
        lowerText === 'tasks' || lowerText === 'show' || lowerText === 'list') {
      return { action: 'show', language };
    }

    // Search task patterns
    if (/(?:search|find|dhundo|search karo)\s+(?:task|kaam)?/i.test(text)) {
      const searchMatch = text.match(/(?:search|find|dhundo)[:\s]+(.+)/i);
      if (searchMatch) {
        return { action: 'search', query: searchMatch[1].trim(), language };
      }
      return { action: 'search_help', language };
    }

    // Statistics/analytics
    if (/(?:stats|statistics|analytics|kitne|kitna|count|summary|report)\s*(?:tasks|kaam)?/i.test(text) ||
        lowerText.includes('task stats') || lowerText.includes('task report')) {
      return { action: 'stats', language };
    }

    // Priority patterns
    if (/(?:priority|importance|jaruri|important|zaroori)\s*(?:set|karo|change)?/i.test(text)) {
      return { action: 'priority_help', language };
    }

    // Category patterns
    if (/(?:category|type|category|kis tarah|kon sa)\s*(?:set|karo|change)?/i.test(text)) {
      return { action: 'category_help', language };
    }

    // Greetings
    if (/(?:hi|hello|hey|namaste|salam|asalam|good morning|good evening|good night)/i.test(text)) {
      return { action: 'greeting', language };
    }

    // Thanks
    if (/(?:thanks|thank you|shukriya|shukria|dhanyawad|dhanewad)/i.test(text)) {
      return { action: 'thanks', language };
    }

    // Bye
    if (/(?:bye|goodbye|alvida|phir milenge|see you|tata)/i.test(text)) {
      return { action: 'bye', language };
    }

    // Help
    if (/(?:help|help|madad|sahayata|kya kar sakte ho|what can you do)/i.test(text)) {
      return { action: 'help', language };
    }

    return { action: 'chat', language };
  };

  // Create task
  const createTask = async (title: string, priority: string = 'medium', dueDate: string | null = null): Promise<Task | null> => {
    const uid = userId || localStorage.getItem('user_id');
    if (!uid) return null;
    try {
      const response = await fetch('/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: '',
          status: 'pending',
          priority,
          category: null,
          due_date: dueDate,
          user_id: parseInt(uid),
        }),
      });
      if (response.ok) {
        const task = await response.json();
        await fetchTasks();
        return task;
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
    return null;
  };

  // Delete task
  const deleteTask = async (title: string): Promise<boolean> => {
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchTasks();
          return true;
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    return false;
  };

  // Update task
  const updateTask = async (oldTitle: string, newTitle: string): Promise<Task | null> => {
    const task = tasks.find(t => t.title.toLowerCase().includes(oldTitle.toLowerCase()));
    if (task) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
        if (response.ok) {
          const updatedTask = await response.json();
          await fetchTasks();
          return updatedTask;
        }
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
    return null;
  };

  // Complete task
  const completeTask = async (title: string): Promise<Task | null> => {
    const task = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    if (task) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
        if (response.ok) {
          const updatedTask = await response.json();
          await fetchTasks();
          return updatedTask;
        }
      } catch (error) {
        console.error('Error completing task:', error);
      }
    }
    return null;
  };

  // Generate AI response
  const generateAIResponse = async (userMessage: string, language: string, action: string, parseResult: any): Promise<{ response: string; type?: string; tasks?: Task[] }> => {
    let response = '';
    let type: string = 'text';
    let taskList: Task[] = [];

    const responses = {
      english: {
        greeting: "Hey! 👋 Kya haal hai? Aaj kya kaam karna hai? 😊",
        thanks: "Koi baat nahi! 😊 Mazay ka kaam kiya! Aur kuch chahiye to bolna! 🙏",
        bye: "Alvida! 👋 Phir milenge! Khush raho! 😊✨",
        help: "Main aapki tasks manage kar sakta hoon! 👇\n\n•➕ Naya task banaoo\n•📋 Tasks dikhao\n•✅ Task complete karo\n•🗑️ Task delete karo\n•✏️ Task update karo\n•🔍 Task search karo\n•📊 Task stats dekho\n\nBas mujhe message bhejo!",
        create_help: "Zaroor! Kya naam se task banaana chahte ho? 🎯",
        create_success: (title: string) => `✅ Ho gaya! '${title}' task add kar diya! 🎉`,
        create_error: "Kuch gadbad ho gayi. Dobara try karo! 😕",
        complete_help: "Konsa task complete karna chahte ho? Task ka naam batao! ✅",
        complete_success: (title: string) => `🎉 Shandaar! '${title}' task complete ho gaya!`,
        complete_error: "Mujhe woh task nahi mila. Task ka sahi naam batao! 😕",
        delete_help: "Konsa task delete karna chahte ho? Task ka naam batao! 🗑️",
        delete_success: (title: string) => `✅ Ho gaya! '${title}' task delete ho gaya!`,
        delete_error: "Woh task nahi mila. Dobara try karo! 😕",
        update_help: "Kaunsa task update karna chahte ho? Purana aur naya naam batao! ✏️",
        update_success: (oldTitle: string, newTitle: string) => `✅ Ho gaya! '${oldTitle}' ab '${newTitle}' ho gaya! ✨`,
        update_error: "Woh task nahi mila. Dobara try karo! 😕",
        show_empty: "Aapke paas koi task nahi hai! ➕ Naya task banaane ke liye message karo!",
        show_list: (count: number) => `📋 Aapke paas ${count} task hain:\n\n`,
        search_help: "Kya search karna chahte ho? Task ka naam type karo! 🔍",
        search_empty: "Koi task nahi mila! 😕",
        search_result: (query: string) => `🔍 '${query}' ke results:\n\n`,
        stats: (total: number, completed: number, pending: number) => `📊 Aapke Tasks ka Stats:\n\n✅ Completed: ${completed}\n⏳ Pending: ${pending}\n📝 Total: ${total}\n\n${completed/total*100 > 50 ? 'Great job! 🎉' : 'Chalo, thoda kaam karo! 💪'}`,
        default: "Mujhe samajh nahi aya. Phir se try karo ya 'help' likho! 😊"
      },
      urdu: {
        greeting: "السلام علیکم! 👋 کیسے ہیں آپ؟ آج کیا کرنا ہے؟ 😊",
        thanks: "کوئی بات نہیں! 😊 مزے کیا آپ نے! 🙏",
        bye: "الوداع! 👋 پھر ملیں گے! 😊✨",
        help: "میں آپ کے کام سنبھال سکتا ہوں! 👇\n\n•➕ نیا کام بنائیں\n•📋 کام دکھائیں\n•✅ کام مکمل کریں\n•🗑️ کام حذف کریں\n•✏️ کام اپڈیٹ کریں\n•🔍 کام تلاش کریں\n•📊 کام کی رپورٹ دیکھیں\n\nبس مجھے پیغام بھیجیں!",
        create_help: "ضرور! کس نام سے کام بنانا چاہتے ہیں؟ 🎯",
        create_success: (title: string) => `✅ ہو گیا! '${title}' کام add کر دیا! 🎉`,
        create_error: "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں! 😕",
        complete_help: "کون سا کام مکمل کرنا چاہتے ہیں؟ کام کا نام بتائیں! ✅",
        complete_success: (title: string) => `🎉 شاندار! '${title}' کام مکمل ہو گیا!`,
        complete_error: "مجھے وہ کام نہیں ملا۔ صحیح نام بتائیں! 😕",
        delete_help: "کون سا کام حذف کرنا چاہتے ہیں؟ 🗑️",
        delete_success: (title: string) => `✅ ہو گیا! '${title}' کام حذف ہو گیا!`,
        delete_error: "وہ کام نہیں ملا! 😕",
        update_help: "کون سا کام اپڈیٹ کرنا چاہتے ہیں؟ ✏️",
        update_success: (oldTitle: string, newTitle: string) => `✅ ہو گیا! '${oldTitle}' اب '${newTitle}' ہو گیا! ✨`,
        update_error: "وہ کام نہیں ملا! 😕",
        show_empty: "آپ کے پاس کوئی کام نہیں! ➕ نیا کام بنائیں!",
        show_list: (count: number) => `📋 آپ کے پاس ${count} کام ہیں:\n\n`,
        search_help: "کیا تلاش کرنا چاہتے ہیں؟ 🔍",
        search_empty: "کوئی کام نہیں ملا! 😕",
        search_result: (query: string) => `🔍 '${query}' کے نتائج:\n\n`,
        stats: (total: number, completed: number, pending: number) => `📊 آپ کے کاموں کی رپورٹ:\n\n✅ مکمل: ${completed}\n⏳ زیر التواء: ${pending}\n📝 کل: ${total}\n\n${completed/total*100 > 50 ? 'بہترین کام! 🎉' : 'چلو، تھوڑا کام کرو! 💪'}`,
        default: "مجھے سمجھ نہیں آیا۔ پھر سے کوشش کریں! 😊"
      },
      roman_urdu: {
        greeting: "Assalamu Alaikum! 👋 Kaise ho? Aaj kya karna hai? 😊",
        thanks: "Koi baat nahi! 😊 Mazay ka kaam kiya! Aur kuch chahiye to bolna! 🙏",
        bye: "Allah Hafiz! 👋 Phir milenge! Khush raho! 😊✨",
        help: "Main aapki tasks manage kar sakta hoon! 👇\n\n•➕ Naya task banaoo\n•📋 Tasks dikhao\n•✅ Task complete karo\n•🗑️ Task delete karo\n•✏️ Task update karo\n•🔍 Task search karo\n•📊 Task stats dekho\n\nBas mujhe message bhejo!",
        create_help: "Zaroor! Kya naam se task banaana chahte ho? 🎯",
        create_success: (title: string) => `✅ Ho gaya! '${title}' task add kar diya! 🎉`,
        create_error: "Kuch gadbad ho gayi. Dobara try karo! 😕",
        complete_help: "Konsa task complete karna chahte ho? Task ka naam batao! ✅",
        complete_success: (title: string) => `🎉 Shandaar! '${title}' task complete ho gaya!`,
        complete_error: "Mujhe woh task nahi mila. Task ka sahi naam batao! 😕",
        delete_help: "Konsa task delete karna chahte ho? 🗑️",
        delete_success: (title: string) => `✅ Ho gaya! '${title}' task delete ho gaya!`,
        delete_error: "Woh task nahi mila! 😕",
        update_help: "Kaunsa task update karna chahte ho? ✏️",
        update_success: (oldTitle: string, newTitle: string) => `✅ Ho gaya! '${oldTitle}' ab '${newTitle}' ho gaya! ✨`,
        update_error: "Woh task nahi mila! 😕",
        show_empty: "Aapke paas koi task nahi hai! ➕ Naya task banaane ke liye message karo!",
        show_list: (count: number) => `📋 Aapke paas ${count} task hain:\n\n`,
        search_help: "Kya search karna chahte ho? 🔍",
        search_empty: "Koi task nahi mila! 😕",
        search_result: (query: string) => `🔍 '${query}' ke results:\n\n`,
        stats: (total: number, completed: number, pending: number) => `📊 Aapke Tasks ka Stats:\n\n✅ Completed: ${completed}\n⏳ Pending: ${pending}\n📝 Total: ${total}\n\n${completed/total*100 > 50 ? 'Great job! 🎉' : 'Chalo, thoda kaam karo! 💪'}`,
        default: "Mujhe samajh nahi aya. Phir se try karo ya 'help' likho! 😊"
      }
    };

    const langResponses = responses[language as keyof typeof responses] || responses.english;

    try {
      switch (action) {
        case 'greeting':
          response = langResponses.greeting;
          type = 'quick_replies';
          break;

        case 'thanks':
          response = langResponses.thanks;
          break;

        case 'bye':
          response = langResponses.bye;
          break;

        case 'help':
          response = langResponses.help;
          break;

        case 'create':
          if (parseResult.title) {
            const newTask = await createTask(parseResult.title);
            if (newTask) {
              response = typeof langResponses.create_success === 'function' 
                ? langResponses.create_success(parseResult.title)
                : String(langResponses.create_success);
            } else {
              response = String(langResponses.create_error);
            }
          } else {
            response = String(langResponses.create_help);
          }
          break;

        case 'complete':
          if (parseResult.title) {
            const completed = await completeTask(parseResult.title);
            if (completed) {
              response = typeof langResponses.complete_success === 'function'
                ? langResponses.complete_success(parseResult.title)
                : String(langResponses.complete_success);
            } else {
              response = String(langResponses.complete_error);
              // Show available tasks
              if (tasks.length > 0) {
                response += '\n\n📋 Aapke tasks:\n' + tasks.slice(0, 5).map(t => `• ${t.title} (${t.status})`).join('\n');
              }
            }
          } else {
            response = String(langResponses.complete_help);
            if (tasks.length > 0) {
              response += '\n\n' + tasks.filter(t => t.status !== 'completed').slice(0, 5).map(t => `• ${t.title}`).join('\n');
            }
          }
          break;

        case 'delete':
          if (parseResult.title) {
            const deleted = await deleteTask(parseResult.title);
            if (deleted) {
              response = typeof langResponses.delete_success === 'function'
                ? langResponses.delete_success(parseResult.title)
                : String(langResponses.delete_success);
            } else {
              response = String(langResponses.delete_error);
            }
          } else {
            response = String(langResponses.delete_help);
          }
          break;

        case 'update':
          if (parseResult.oldTitle && parseResult.newTitle) {
            const updated = await updateTask(parseResult.oldTitle, parseResult.newTitle);
            if (updated) {
              response = typeof langResponses.update_success === 'function'
                ? langResponses.update_success(parseResult.oldTitle, parseResult.newTitle)
                : String(langResponses.update_success);
            } else {
              response = String(langResponses.update_error);
            }
          } else {
            response = String(langResponses.update_help);
          }
          break;

        case 'show':
          if (tasks.length === 0) {
            response = String(langResponses.show_empty);
          } else {
            response = typeof langResponses.show_list === 'function'
              ? langResponses.show_list(tasks.length)
              : String(langResponses.show_list);
            
            // Add task list
            const pendingTasks = tasks.filter(t => t.status !== 'completed');
            const completedTasks = tasks.filter(t => t.status === 'completed');
            
            if (pendingTasks.length > 0) {
              response += '⏳ Pending Tasks:\n';
              response += pendingTasks.map(t => {
                const priorityEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
                return `${priorityEmoji} ${t.title}`;
              }).join('\n');
            }
            
            if (completedTasks.length > 0) {
              response += '\n\n✅ Completed:\n';
              response += completedTasks.map(t => `✓ ${t.title}`).join('\n');
            }
            
            type = 'task_list';
            taskList = tasks;
          }
          break;

        case 'search':
          if (parseResult.query) {
            const searchResults = tasks.filter(t => 
              t.title.toLowerCase().includes(parseResult.query.toLowerCase())
            );
            if (searchResults.length === 0) {
              response = String(langResponses.search_empty);
            } else {
              response = typeof langResponses.search_result === 'function'
                ? langResponses.search_result(parseResult.query)
                : String(langResponses.search_result);
              response += searchResults.map(t => `• ${t.title} (${t.status})`).join('\n');
              type = 'task_list';
              taskList = searchResults;
            }
          } else {
            response = String(langResponses.search_help);
          }
          break;

        case 'stats':
          const total = tasks.length;
          const completed = tasks.filter(t => t.status === 'completed').length;
          const pending = total - completed;
          response = typeof langResponses.stats === 'function'
            ? langResponses.stats(total, completed, pending)
            : String(langResponses.stats);
          break;

        default:
          // For casual chat, respond naturally
          response = langResponses.default;
          break;
      }
    } catch (error) {
      console.error('Error generating response:', error);
      response = "Kuch gadbad ho gayi. Dobara try karo! 😕";
    }

    return { response, type, tasks: taskList };
  };

  // Handle sending message
  const handleSendMessage = async (messageText?: string) => {
    // Handle pending confirmation
    if (pendingAction) {
      const text = messageText || inputText;
      const isConfirm = /^(yes|yeah|yep|confirm|haan|ji|han|hmm|okay|ok)$/i.test(text);
      const isCancel = /^(no|nope|cancel|nahi|nah|na|bas|bas karo)$/i.test(text);
      
      if (isConfirm) {
        if (pendingAction.type === 'delete') {
          const deleted = await deleteTask(pendingAction.data.title);
          const response = deleted 
            ? `✅ Ho gaya! '${pendingAction.data.title}' delete ho gaya!`
            : `❌ Task nahi mila!`;
          
          const botMessage: Message = {
            id: Date.now().toString(),
            text: response,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        } else if (pendingAction.type === 'update') {
          const updated = await updateTask(pendingAction.data.oldTitle, pendingAction.data.newTitle);
          const response = updated
            ? `✅ Ho gaya! '${pendingAction.data.oldTitle}' ab '${pendingAction.data.newTitle}' ho gaya!`
            : `❌ Task nahi mila!`;
          
          const botMessage: Message = {
            id: Date.now().toString(),
            text: response,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        } else if (pendingAction.type === 'complete') {
          const completed = await completeTask(pendingAction.data.title);
          const response = completed
            ? `🎉 Shandaar! '${pendingAction.data.title}' complete ho gaya!`
            : `❌ Task nahi mila!`;
          
          const botMessage: Message = {
            id: Date.now().toString(),
            text: response,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } else if (isCancel) {
        const botMessage: Message = {
          id: Date.now().toString(),
          text: "❌ Action cancelled. Koi aur kaam? 😊",
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const botMessage: Message = {
          id: Date.now().toString(),
          text: "Please confirm with 'yes' ya 'no' bolke! 😊",
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
      
      setPendingAction(null);
      setInputText('');
      setIsLoading(false);
      return;
    }
    
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
      const result = await generateAIResponse(textToSend, parsed.language, parsed.action, parsed);
      
      if (result.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.response,
          sender: 'bot',
          timestamp: new Date(),
          type: result.type as any,
          tasks: result.tasks,
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Kuch gadbad ho gayi. Dobara try karo! 😕",
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

  // Render task card
  const renderTaskCard = (task: Task) => {
    const priorityColors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    };
    const statusEmoji = task.status === 'completed' ? '✅' : '⏳';
    
    return (
      <div key={task.id} className={`p-2 rounded-lg border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors] || 'border-gray-300'} my-1`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusEmoji}</span>
          <span className="font-medium text-sm">{task.title}</span>
        </div>
        {task.due_date && (
          <div className="text-xs text-gray-500 mt-1 ml-6">
            📅 Due: {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* WhatsApp-style Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        }}
        title="Chat with AI"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* WhatsApp Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col rounded-xl shadow-2xl overflow-hidden bg-[#E5DDD5]">
          {/* WhatsApp Header */}
          <div
            className="text-white p-3 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)',
            }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#075E54]"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">AI Task Assistant</h3>
              <p className="text-sm text-green-100">Always here to help! 💪</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:bg-white/10 p-2 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[450px] bg-[#E5DDD5]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-lg shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-[#DCF8C6] rounded-br-none'
                      : 'bg-white rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap text-gray-800">{message.text}</p>
                  
                  {/* Render task cards if available */}
                  {message.tasks && message.tasks.length > 0 && (
                    <div className="mt-2">
                      {message.tasks.slice(0, 3).map(task => renderTaskCard(task))}
                      {message.tasks.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">...aur {message.tasks.length - 3} tasks</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-xs text-gray-500">{formatTime(message.timestamp)}</p>
                    {message.sender === 'user' && (
                      <span className="text-xs text-gray-400">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Buttons */}
          <div className="px-3 py-2 bg-[#F0F0F0] flex gap-2 overflow-x-auto">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply.action)}
                className="whitespace-nowrap px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition-colors border border-gray-200"
              >
                {reply.label}
              </button>
            ))}
          </div>

          {/* Input Area - WhatsApp Style */}
          <div className="bg-white px-3 py-2 flex items-center gap-2">
            <button className="text-gray-500 hover:text-gray-700 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-[#F0F0F0] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
              style={{
                background: inputText.trim() ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#E5DDD5',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
