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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
        text: "Hello! Welcome to TaskMate AI! 👋\n\nI'm here to help you manage your tasks. How can I assist you today?",
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
        
        if (loadedMessages.length === 0) {
          const welcomeMessage: Message = {
            id: Date.now(),
            text: "Hello! Welcome to TaskMate AI! 👋\n\nI'm here to help you manage your tasks. How can I assist you today?",
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
      const welcomeMessage: Message = {
        id: Date.now(),
        text: "Hello! Welcome to TaskMate AI! 👋\n\nI'm here to help you manage your tasks. How can I assist you today?",
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

  // Detect Roman Urdu - only respond in Roman Urdu if user types in Roman Urdu
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
      /swaal/i, /jawaab/i, /poochho/i, /batana/i,
    ];
    const lowerText = text.toLowerCase();
    return romanUrduPatterns.some(pattern => pattern.test(lowerText));
  };

  // Get English response (only use Roman Urdu when user specifically types in Roman Urdu)
  const getEnglishResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    // User identity check
    if (lowerInput.includes('who am i') || lowerInput.includes('identify')) {
      if (userInfo) {
        return `📋 Your information:\n\n👤 Name: ${userInfo.name}\n📧 Email: ${userInfo.email}\n\nAny other questions?`;
      } else {
        return "⚠️ I don't have your information. Please login first and try again.";
      }
    }
    
    // Greetings
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return "Hello! 👋 Welcome to TaskMate AI!\n\nHow can I help you today?";
    }
    
    // Help
    if (lowerInput.includes('help') || lowerInput.includes('guide')) {
      return `🤖 TaskMate AI - Help\n\nI can help you with:\n\n✅ Adding new tasks\n✅ Viewing your tasks\n✅ Completing tasks\n✅ Deleting tasks\n\nExamples:\n• "Add task: Buy groceries"\n• "Show all my tasks"\n• "Complete task 1"\n• "Delete task 2"\n\nWhat would you like to do?`;
    }
    
    // Tasks
    if (lowerInput.includes('task') || lowerInput.includes('work') || lowerInput.includes('todolist')) {
      return "📝 Need help with tasks?\n\nYou can tell me:\n• 'Add task: Buy groceries'\n• 'Show all my tasks'\n• 'Complete task 1'\n• 'Delete task 2'\n\nWhat task would you like to add?";
    }
    
    // Thank you
    if (lowerInput.includes('thank') || lowerInput.includes('appreciate')) {
      return "😊 You're welcome! Happy to help!\n\nFeel free to ask if you have any more questions!";
    }
    
    // How are you
    if (lowerInput.includes('how are')) {
      return "😊 I'm doing great, thank you!\n\nHow are you? How can I help you today?";
    }
    
    // What's your name
    if (lowerInput.includes('your name') || lowerInput.includes('who are you')) {
      return "🤖 My name is TaskMate AI!\n\nI'm here to help you manage your tasks!\n\nYou can ask me to add, view, complete, or delete tasks!";
    }
    
    // Goodbye
    if (lowerInput.includes('bye') || lowerInput.includes('goodbye') || lowerInput.includes('see you later')) {
      return "👋 Goodbye! See you later!\n\nTake care! 🫡";
    }
    
    // Default response in English
    return "I understand! I'm here to help you manage your tasks!\n\nYou can ask me to:\n• Add a new task\n• Show your tasks\n• Complete a task\n• Delete a task\n• Get help\n\nWhat would you like to do?";
  };

  // Get Roman Urdu response (only when user types in Roman Urdu)
  const getRomanUrduResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    // User identity check
    if (lowerInput.includes('who am i') || lowerInput.includes('kon hun') || 
        lowerInput.includes('mein kaun') || lowerInput.includes('mera naam') ||
        lowerInput.includes('mija kaun')) {
      if (userInfo) {
        return `📋 Aapki information:\n\n👤 Name: ${userInfo.name}\n📧 Email: ${userInfo.email}\n\nKoi aur sawaal? 😊`;
      } else {
        return "⚠️ Mujhe aapki information nahi mili. Please login karein.";
      }
    }
    
    // Greetings
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || 
        lowerInput.includes('hey') || lowerInput.includes('salam') ||
        lowerInput.includes('asalam') || lowerInput.includes('peace')) {
      return "👋 Assalamu alaykum!\n\nWelcome to TaskMate AI! 😊\n\nAap ki tareh kar sakta hoon?";
    }
    
    // Help
    if (lowerInput.includes('help') || lowerInput.includes('madad') || 
        lowerInput.includes('sahayata') || lowerInput.includes('guide')) {
      return `🤖 TaskMate AI - Help\n\nMein aapki in cheezon mein madad kar sakta hoon:\n\n✅ Tasks add karna\n✅ Tasks dekhna\n✅ Tasks complete karna\n✅ Tasks delete karna\n\nExamples:\n• "Add task: Groceries le aana"\n• "Meri sari tasks dikhao"\n• "Task 1 complete kar do"\n\nKya karna chahte hain? 😊`;
    }
    
    // Tasks
    if (lowerInput.includes('task') || lowerInput.includes('kaam') || 
        lowerInput.includes('work') || lowerInput.includes('todolist')) {
      return "📝 Tasks ke baare mein madad chahiye?\n\nAap mujhe bol sakte hain:\n• 'Add task: Groceries le aana'\n• 'Meri sari tasks dikhao'\n• 'Task 1 complete kar do'\n• 'Task 2 delete kar do'\n\nKaisa task add karna chahte hain? 😊";
    }
    
    // Thank you
    if (lowerInput.includes('thank') || lowerInput.includes('shukriya') || 
        lowerInput.includes('shukria') || lowerInput.includes('appreciate')) {
      return "😊 Aapka shukriya! Khush hua madad kar ke!\n\nKoi aur sawaal ho to zaroor puchiye!";
    }
    
    // How are you
    if (lowerInput.includes('how are') || lowerInput.includes('kaisa hai') || 
        lowerInput.includes('kaisi hai') || lowerInput.includes('kya haal') ||
        lowerInput.includes('kya khbr')) {
      return "😊 Main theek hoon, shukriya! ☺️\n\nAap kais? Aapki kya help chahiye?";
    }
    
    // What's your name
    if (lowerInput.includes('your name') || lowerInput.includes('tumhara naam') || 
        lowerInput.includes('aap ka naam') || lowerInput.includes('who are you') ||
        lowerInput.includes('kon ho')) {
      return "🤖 Mera naam TaskMate AI hai!\n\nMain aapki task management mein madad karne ke liye hoon. 😊\n\nAap mujhe tasks add karne, dekhne, complete karne aur delete karne ke liye bol sakte hain!";
    }
    
    // Goodbye
    if (lowerInput.includes('bye') || lowerInput.includes('goodbye') || 
        lowerInput.includes('alvida') || lowerInput.includes('phir milenge') ||
        lowerInput.includes('see you later')) {
      return "👋 Alvida! Phir milenge! 😊\n\nAllah hafiz! 🫡";
    }
    
    // Default response in Roman Urdu
    return "🤔 Samajh gaya! Main yahan task management mein madad ke liye hoon. 😊\n\nAap mujhe ye bol sakte hain:\n• Task add karna\n• Meri tasks dikhana\n• Task complete karna\n• Task delete karna\n• Help chahiye\n\nAap kya karna chahte hain?";
  };

  // Bot response logic - use Roman Urdu only when user types in Roman Urdu
  const getBotResponse = (userInput: string): string => {
    const isUrdu = isRomanUrdu(userInput);
    if (isUrdu) {
      return getRomanUrduResponse(userInput);
    }
    return getEnglishResponse(userInput);
  };

  // State to track if we're showing limited tasks
  const [showingAllTasks, setShowingAllTasks] = useState(false);
  const [displayedTaskCount, setDisplayedTaskCount] = useState(5);

  // Function to fetch and display tasks with clickable "show more"
  const handleShowMoreTasks = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      if (!userId || !token) {
        return;
      }
      
      const response = await fetch(`${backendUrl}/api/tasks/?user_id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const tasks = await response.json();
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
        const completedTasks = tasks.filter((t: any) => t.status === 'completed');
        
        // Build the task list message
        let taskListText = "📋 Your Tasks:\n\n";
        
        if (pendingTasks.length > 0) {
          taskListText += "⏳ Pending Tasks:\n";
          pendingTasks.forEach((task: any, index: number) => {
            taskListText += `${index + 1}. ${task.title}\n`;
          });
          taskListText += "\n";
        }
        
        if (completedTasks.length > 0) {
          taskListText += "✅ Completed Tasks:\n";
          completedTasks.forEach((task: any, index: number) => {
            taskListText += `${index + 1}. ${task.title}\n`;
          });
        }
        
        if (pendingTasks.length === 0 && completedTasks.length === 0) {
          taskListText = "📝 You don't have any tasks yet!\n\nTry adding a task like: \"Add task: Buy groceries\"";
        }
        
        // Add bot message with all tasks
        const botMessage: Message = {
          id: Date.now(),
          text: taskListText,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setShowingAllTasks(true);
      }
    } catch (error) {
      console.error('Failed to load more tasks:', error);
    }
  };

  // Function to check if message contains task count and return clickable version
  const processTaskResponse = (text: string, taskCount: number): { text: string; showMore: boolean } => {
    if (taskCount > 5) {
      return {
        text: text.replace(/\d+ others/, `${taskCount - 5} others`).replace(/and \d+ more/, `and ${taskCount - 5} more`),
        showMore: true
      };
    }
    return { text, showMore: false };
  };

  // Check if message is a greeting
  const isGreeting = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return lowerText.includes('hi') || 
           lowerText.includes('hello') || 
           lowerText.includes('hey') ||
           lowerText.includes('salam') ||
           lowerText.includes('asalam') ||
           lowerText.includes('peace') ||
           lowerText.includes('assalam') ||
           lowerText.includes('good morning') ||
           lowerText.includes('good evening') ||
           lowerText.includes('good night');
  };

  // Check if message is asking for help
  const isHelpRequest = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return lowerText.includes('help') || 
           lowerText.includes('guide') ||
           lowerText.includes('what can you do') ||
           lowerText.includes('how do you work');
  };

  // Check if message is a valid task command
  const isTaskCommand = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return lowerText.includes('add task') || 
           lowerText.includes('add') ||
           lowerText.includes('create task') ||
           lowerText.includes('new task') ||
           lowerText.includes('task add') ||
           lowerText.includes('task create') ||
           lowerText.includes('complete task') ||
           lowerText.includes('done task') ||
           lowerText.includes('finish task') ||
           lowerText.includes('task complete') ||
           lowerText.includes('task done') ||
           lowerText.includes('task finished') ||
           lowerText.includes('mark complete') ||
           lowerText.includes('mark done') ||
           lowerText.includes('delete task') ||
           lowerText.includes('remove task') ||
           lowerText.includes('task delete') ||
           lowerText.includes('task remove') ||
           lowerText.includes('show tasks') ||
           lowerText.includes('my tasks') ||
           lowerText.includes('list tasks');
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

    const lowerMsg = messageToSend.toLowerCase();
    const isUrdu = isRomanUrdu(messageToSend);

    // Check for greetings - respond directly without API call
    if (isGreeting(messageToSend)) {
      const greetingResponse = getBotResponse(messageToSend);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: greetingResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      return;
    }

    // Check for help request - respond directly without API call
    if (isHelpRequest(messageToSend)) {
      const helpResponse = getBotResponse(messageToSend);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: helpResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      return;
    }

    // Check if it's NOT a task command - show modern confirm modal instead of old alert
    if (!isTaskCommand(messageToSend)) {
      setShowConfirmModal(true);
      setIsLoading(false);
      return;
    }

    // Check if user wants to add a task
    const isTaskAddRequest = 
      lowerMsg.includes('add task') || 
      lowerMsg.includes('add') ||
      lowerMsg.includes('create task') ||
      lowerMsg.includes('new task') ||
      lowerMsg.includes('task add') ||
      lowerMsg.includes('task create');

    // Check if user wants to complete a task
    const isTaskCompleteRequest = 
      lowerMsg.includes('complete task') ||
      lowerMsg.includes('done task') ||
      lowerMsg.includes('finish task') ||
      lowerMsg.includes('task complete') ||
      lowerMsg.includes('task done') ||
      lowerMsg.includes('task finished') ||
      lowerMsg.includes('mark complete') ||
      lowerMsg.includes('mark done');

    // Check if user wants to delete a task
    const isTaskDeleteRequest = 
      lowerMsg.includes('delete task') ||
      lowerMsg.includes('remove task') ||
      lowerMsg.includes('task delete') ||
      lowerMsg.includes('task remove');

    // Check if user wants to see tasks
    const isShowTasksRequest = 
      lowerMsg.includes('show tasks') ||
      lowerMsg.includes('my tasks') ||
      lowerMsg.includes('list tasks') ||
      lowerMsg.includes('view tasks') ||
      lowerMsg.includes('all tasks') ||
      (lowerMsg.includes('task') && !isTaskAddRequest && !isTaskCompleteRequest && !isTaskDeleteRequest);

    // Handle show tasks request - fetch and display tasks with Show More button
    if (isShowTasksRequest) {
      setShowingAllTasks(false);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        
        if (userId && token) {
          const response = await fetch(`${backendUrl}/api/tasks/?user_id=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const tasks = await response.json();
            const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
            const completedTasks = tasks.filter((t: any) => t.status === 'completed');
            const totalTasks = pendingTasks.length + completedTasks.length;
            
            if (totalTasks === 0) {
              const botMessage: Message = {
                id: Date.now() + 1,
                text: isUrdu 
                  ? "📝 Aapke paas koi task nahi hai!\n\nTask add karne ke liye bolen: 'Add task: Meri task'"
                  : "📝 You don't have any tasks yet!\n\nTry adding a task like: \"Add task: Buy groceries\"",
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, botMessage]);
            } else {
              // Show first 5 tasks with option to see more
              const displayCount = 5;
              let taskListText = isUrdu
                ? `📋 Aapke Tasks (${totalTasks} total):\n\n`
                : `📋 Your Tasks (${totalTasks} total):\n\n`;
              
              if (pendingTasks.length > 0) {
                taskListText += isUrdu ? "⏳ Pending Tasks:\n" : "⏳ Pending Tasks:\n";
                pendingTasks.slice(0, displayCount).forEach((task: any, index: number) => {
                  taskListText += `${index + 1}. ${task.title}\n`;
                });
                if (pendingTasks.length > displayCount) {
                  taskListText += isUrdu 
                    ? `... aur ${pendingTasks.length - displayCount} aur tasks\n`
                    : `... and ${pendingTasks.length - displayCount} more tasks\n`;
                }
              }
              
              if (completedTasks.length > 0) {
                taskListText += isUrdu ? "\n✅ Completed Tasks:\n" : "\n✅ Completed Tasks:\n";
                completedTasks.slice(0, displayCount).forEach((task: any, index: number) => {
                  taskListText += `${index + 1}. ${task.title}\n`;
                });
                if (completedTasks.length > displayCount) {
                  taskListText += isUrdu 
                    ? `... aur ${completedTasks.length - displayCount} aur tasks\n`
                    : `... and ${completedTasks.length - displayCount} more tasks\n`;
                }
              }
              
              const botMessage: Message = {
                id: Date.now() + 1,
                text: taskListText,
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, botMessage]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
      setIsLoading(false);
      return;
    }

    let taskActionResult = '';

    // Try to create task locally
    if (isTaskAddRequest) {
      try {
        let taskTitle = messageToSend
          .replace(/add task:?/i, '')
          .replace(/create task:?/i, '')
          .replace(/new task:?/i, '')
          .replace(/task add:?/i, '')
          .replace(/task create:?/i, '')
          .replace(/please/i, '')
          .replace(/can you/i, '')
          .replace(/i want to/i, '')
          .replace(/i need to/i, '')
          .trim();
        
        if (taskTitle && taskTitle.length > 0) {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          
          if (userId && token) {
            const res = await fetch(`${backendUrl}/api/tasks/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title: taskTitle,
                description: null,
                status: 'pending',
                priority: 'medium',
                category: null,
                due_date: null
              })
            });
            
            if (res.ok) {
              taskActionResult = isUrdu 
                ? "✅ Task successfully created!"
                : "✅ Task successfully created!";
              console.log('✅ Task created from chatbot!');
            }
          }
        }
      } catch (taskError) {
        console.error('Failed to create task from chatbot:', taskError);
      }
    }

    // Try to complete task locally
    if (isTaskCompleteRequest) {
      try {
        const taskIdMatch = messageToSend.match(/task\s*#?(\d+)/i) || 
                           messageToSend.match(/(\d+)/);
        
        if (taskIdMatch) {
          const taskId = taskIdMatch[1];
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          
          if (userId && token) {
            // First get the tasks to find the correct task ID
            const tasksRes = await fetch(`${backendUrl}/api/tasks/?user_id=${userId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (tasksRes.ok) {
              const tasks = await tasksRes.json();
              const sortedTasks = tasks.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const taskIndex = parseInt(taskId) - 1;
              
              if (sortedTasks[taskIndex]) {
                const taskToComplete = sortedTasks[taskIndex];
                const updateRes = await fetch(`${backendUrl}/api/tasks/${taskToComplete.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ status: 'completed' })
                });
                
                if (updateRes.ok) {
                  taskActionResult = isUrdu
                    ? `✅ Task "${taskToComplete.title}" completed! Great job! 🎉`
                    : `✅ Task "${taskToComplete.title}" completed! Great job! 🎉`;
                  console.log('✅ Task completed from chatbot!');
                }
              } else {
                taskActionResult = isUrdu
                  ? "⚠️ Task nahi mila. Task number check karein."
                  : "⚠️ Task not found. Please check the task number.";
              }
            }
          }
        } else {
          taskActionResult = isUrdu
            ? "⚠️ Task number specify karein. Example: 'Complete task 1'"
            : "⚠️ Please specify the task number. Example: 'Complete task 1'";
        }
      } catch (taskError) {
        console.error('Failed to complete task from chatbot:', taskError);
        taskActionResult = isUrdu
          ? "⚠️ Task complete karne mein error aaya."
          : "⚠️ Error completing the task.";
      }
    }

    // Try to delete task locally
    if (isTaskDeleteRequest) {
      try {
        const taskIdMatch = messageToSend.match(/task\s*#?(\d+)/i) || 
                           messageToSend.match(/(\d+)/);
        
        if (taskIdMatch) {
          const taskId = taskIdMatch[1];
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          
          if (userId && token) {
            const tasksRes = await fetch(`${backendUrl}/api/tasks/?user_id=${userId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (tasksRes.ok) {
              const tasks = await tasksRes.json();
              const sortedTasks = tasks.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const taskIndex = parseInt(taskId) - 1;
              
              if (sortedTasks[taskIndex]) {
                const taskToDelete = sortedTasks[taskIndex];
                const deleteRes = await fetch(`${backendUrl}/api/tasks/${taskToDelete.id}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (deleteRes.ok) {
                  taskActionResult = isUrdu
                    ? `✅ Task "${taskToDelete.title}" delete ho gaya!`
                    : `✅ Task "${taskToDelete.title}" has been deleted!`;
                  console.log('✅ Task deleted from chatbot!');
                }
              } else {
                taskActionResult = isUrdu
                  ? "⚠️ Task nahi mila. Task number check karein."
                  : "⚠️ Task not found. Please check the task number.";
              }
            }
          }
        } else {
          taskActionResult = isUrdu
            ? "⚠️ Task number specify karein. Example: 'Delete task 1'"
            : "⚠️ Please specify the task number. Example: 'Delete task 1'";
        }
      } catch (taskError) {
        console.error('Failed to delete task from chatbot:', taskError);
        taskActionResult = isUrdu
          ? "⚠️ Task delete karne mein error aaya."
          : "⚠️ Error deleting the task.";
      }
    }

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
      
      let botText = data.bot_response || data.response || getBotResponse(messageToSend);
      
      // If task action was performed, prepend success message
      if (taskActionResult) {
        botText = taskActionResult + "\n\n" + botText;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      console.log('🔄 Dispatching refresh-tasks event...');
      window.dispatchEvent(new CustomEvent('refresh-tasks'));
    } catch (error) {
      console.error('Chat error:', error);
      
      let fallbackText = getBotResponse(messageToSend);
      if (taskActionResult) {
        fallbackText = taskActionResult + "\n\n" + fallbackText;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: fallbackText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      if (taskActionResult) {
        window.dispatchEvent(new CustomEvent('refresh-tasks'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle confirmed page reload
  const handleConfirmReload = () => {
    setShowConfirmModal(false);
    window.location.reload();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Modern Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowConfirmModal(false)}
          />
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scale-in">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Invalid Message
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                I didn't understand that. Would you like to reload the page and try again?
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReload}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                if (confirm('Clear all chat history? 🗑️')) {
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
                <p className="font-bold text-xl text-gray-700">Welcome!</p>
                <p className="text-sm mt-2 text-gray-500">I'm TaskMate, your task manager assistant!</p>
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
                  
                  {/* Show "Show More" button for task responses */}
                  {message.sender === 'bot' && (
                    <div className="mt-2">
                      {(message.text.includes('others') || message.text.includes('more') || message.text.includes('tasks:')) && !showingAllTasks && (
                        <button
                          onClick={handleShowMoreTasks}
                          className="text-sm px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors font-medium"
                        >
                          👁️ Show All Tasks
                        </button>
                      )}
                    </div>
                  )}
                  
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
                placeholder="Type your message..."
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
