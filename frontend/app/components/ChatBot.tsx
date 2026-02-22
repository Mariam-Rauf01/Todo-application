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

  // State to track all tasks for clickable actions
  const [allTasksData, setAllTasksData] = useState<any[]>([]);

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
        
        // Store all tasks for clickable actions
        const sortedAllTasks = [...pendingTasks, ...completedTasks];
        setAllTasksData(sortedAllTasks);
        
        // Build the task list message
        let taskListText = "📋 Your All Tasks (Click to complete):\n\n";
        
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

  // Function to complete a task from clickable button
  const handleCompleteTaskFromChat = async (taskId: number, taskTitle: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) return;
      
      const response = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        const botMessage: Message = {
          id: Date.now(),
          text: `✅ Task "${taskTitle}" completed successfully! 🎉`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        window.dispatchEvent(new CustomEvent('refresh-tasks'));
        
        // Update local tasks data
        setAllTasksData(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed' } : t
        ));
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  // Function to delete a task from clickable button
  const handleDeleteTaskFromChat = async (taskId: number, taskTitle: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) return;
      
      const response = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const botMessage: Message = {
          id: Date.now(),
          text: `🗑️ Task "${taskTitle}" deleted!`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        window.dispatchEvent(new CustomEvent('refresh-tasks'));
        
        // Update local tasks data
        setAllTasksData(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
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

    // Check if it's NOT a task command - show message in chat instead of popup
    if (!isTaskCommand(messageToSend)) {
      // Show message in chat instead of popup
      const botMessage: Message = {
        id: Date.now() + 1,
        text: isUrdu
          ? "🤔 Samajh nahi aaya!\n\nMein sirf tasks manage kar sakta hoon.\n\nKuch yeh try karein:\n• 'Add task: Meri task'\n• 'Show my tasks'\n• 'Complete task 1'\n• 'Delete task 1'"
          : "🤔 I didn't understand that!\n\nI can only help you manage tasks.\n\nTry these:\n• 'Add task: My task'\n• 'Show my tasks'\n• 'Complete task 1'\n• 'Delete task 1'",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
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
        
        // Also handle just "add" followed by title
        if (!taskTitle && lowerMsg.startsWith('add ')) {
          taskTitle = lowerMsg.replace(/^add\s+/i, '').trim();
        }
        
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
                ? `✅ Task "${taskTitle}" successfully created!`
                : `✅ Task "${taskTitle}" successfully created!`;
              console.log('✅ Task created from chatbot!');
              
              // Send bot response and return to avoid duplicate
              const botMessage: Message = {
                id: Date.now() + 1,
                text: taskActionResult,
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, botMessage]);
              window.dispatchEvent(new CustomEvent('refresh-tasks'));
              setIsLoading(false);
              return;
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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        
        if (userId && token) {
          // Get all tasks
          const tasksRes = await fetch(`${backendUrl}/api/tasks/?user_id=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (tasksRes.ok) {
            const allTasks = await tasksRes.json();
            const pendingTasks = allTasks.filter((t: any) => t.status === 'pending');
            const sortedTasks = pendingTasks.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            // Try to find task by number first
            const taskIdMatch = messageToSend.match(/task\s*#?(\d+)/i) || 
                               messageToSend.match(/(\d+)/);
            
            let taskToComplete = null;
            
            if (taskIdMatch) {
              // Find by number
              const taskIndex = parseInt(taskIdMatch[1]) - 1;
              if (sortedTasks[taskIndex]) {
                taskToComplete = sortedTasks[taskIndex];
              }
            } else {
              // Try to find by task name
              const taskNameMatch = messageToSend.replace(/complete task:?/i, '')
                .replace(/finish task:?/i, '')
                .replace(/mark complete:?/i, '')
                .replace(/done task:?/i, '')
                .replace(/task complete:?/i, '')
                .replace(/task done:?/i, '')
                .replace(/please/i, '')
                .replace(/can you/i, '')
                .trim();
              
              if (taskNameMatch) {
                // Find task by name (partial match)
                taskToComplete = sortedTasks.find((t: any) => 
                  t.title.toLowerCase().includes(taskNameMatch.toLowerCase())
                );
              }
            }
            
            if (taskToComplete) {
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
                
                // Send bot response and return to avoid duplicate
                const botMessage: Message = {
                  id: Date.now() + 1,
                  text: taskActionResult,
                  sender: 'bot',
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
                window.dispatchEvent(new CustomEvent('refresh-tasks'));
                setIsLoading(false);
                return;
              }
            } else {
              // Show available pending tasks
              if (sortedTasks.length > 0) {
                let taskList = isUrdu
                  ? "⚠️ Task nahi mila. Yeh aapke pending tasks hain:\n\n"
                  : "⚠️ Task not found. Your pending tasks:\n\n";
                sortedTasks.slice(0, 5).forEach((t: any, i: number) => {
                  taskList += `${i + 1}. ${t.title}\n`;
                });
                if (sortedTasks.length > 5) {
                  taskList += isUrdu ? "... aur bhi hain" : "... and more";
                }
                taskActionResult = taskList;
              } else {
                taskActionResult = isUrdu
                  ? "⚠️ Koi pending task nahi hai!"
                  : "⚠️ No pending tasks!";
              }
            }
          }
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
                  
                  // Send bot response and return to avoid duplicate
                  const botMessage: Message = {
                    id: Date.now() + 1,
                    text: taskActionResult,
                    sender: 'bot',
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, botMessage]);
                  window.dispatchEvent(new CustomEvent('refresh-tasks'));
                  setIsLoading(false);
                  return;
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
            className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-purple-900/80 to-pink-900/80 backdrop-blur-md"
            onClick={() => setShowConfirmModal(false)}
          />
          {/* Modal Content */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-scale-in border border-white/20">
            <div className="text-center">
              {/* Animated Icon */}
              <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-4xl animate-bounce">⚠️</span>
              </div>
              
              {/* Title with gradient */}
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-3">
                Oops!
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                I didn't understand that. Would you like to reload the page and try again?
              </p>
              
              {/* Buttons with glass effect */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100/80 backdrop-blur text-gray-700 rounded-2xl font-semibold hover:bg-gray-200/90 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  ✕ Cancel
                </button>
                <button
                  onClick={handleConfirmReload}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white rounded-2xl font-semibold hover:from-red-600 hover:via-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 transform hover:scale-[1.02]"
                >
                  🔄 Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button - Enhanced with glow effect */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 md:w-14 md:h-14 
          bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 
          rounded-full flex items-center justify-center text-white text-xl md:text-2xl 
          shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 
          transition-all duration-300 transform hover:scale-110 hover:rotate-12
          ${isOpen ? 'rotate-90' : 'animate-pulse-slow'}
          ring-4 ring-purple-500/20 hover:ring-purple-500/40`}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <span className="text-lg transform hover:scale-125 transition-transform">✕</span>
        ) : (
          <span className="transform hover:scale-125 transition-transform">💬</span>
        )}
      </button>

      {/* Chat Window - Enhanced with glass morphism */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-50 
          w-[90vw] md:w-80 h-[55vh] md:h-[450px] 
          bg-white/90 backdrop-blur-xl rounded-2xl 
          shadow-2xl border border-white/20 
          flex flex-col overflow-hidden animate-slide-up
          ring-1 ring-black/5">
          
          {/* Header with animated gradient */}
          <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-5 flex items-center gap-4 
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-500 before:via-purple-500 before:to-pink-500 
            before:animate-pulse before:opacity-50">
            <div className="relative w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl 
              shadow-inner border border-white/10 animate-bounce-slow">
              🤖
            </div>
            <div className="relative flex-1">
              <h3 className="text-white font-bold text-xl drop-shadow-md">TaskMate AI</h3>
              <p className="text-white/90 text-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                Online • AI Powered
              </p>
            </div>
            <div className="relative flex gap-2">
              <button
                onClick={() => {
                  setMessages([]);
                  setShowingAllTasks(false);
                }}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur text-white/80 hover:text-white 
                  hover:bg-white/20 transition-all duration-200 hover:rotate-12"
                title="New chat"
              >
                ✨
              </button>
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
                      setShowingAllTasks(false);
                    } catch (error) {
                      console.error('Failed to clear chat:', error);
                      setMessages([]);
                    }
                  }
                }}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur text-white/80 hover:text-white 
                  hover:bg-white/20 transition-all duration-200 hover:rotate-12"
                title="Clear chat"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Messages Area with beautiful background */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 
            bg-gradient-to-b from-violet-50/50 via-purple-50/30 to-pink-50/50
            scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="w-24 h-24 mx-auto mb-5 bg-gradient-to-br from-violet-100 to-pink-100 
                  rounded-3xl flex items-center justify-center text-5xl shadow-inner">
                  👋
                </div>
                <p className="font-bold text-2xl text-gray-800 mb-2">Welcome! 👋</p>
                <p className="text-gray-500 mb-6">I'm TaskMate, your AI task assistant!</p>
                
                {/* Quick action buttons */}
                <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={() => setInputText('Show my tasks')} 
                    className="px-4 py-2 bg-violet-100 text-violet-700 rounded-xl text-sm font-medium 
                      hover:bg-violet-200 transition-colors">
                    📋 Show Tasks
                  </button>
                  <button onClick={() => setInputText('Help')} 
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium 
                      hover:bg-purple-200 transition-colors">
                    ❓ Help
                  </button>
                  <button onClick={() => setInputText('Add task: ')} 
                    className="px-4 py-2 bg-pink-100 text-pink-700 rounded-xl text-sm font-medium 
                      hover:bg-pink-200 transition-colors">
                    ➕ Add Task
                  </button>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} 
                  animate-fade-in-up`}
              >
                {/* Avatar for bot */}
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 
                    flex items-center justify-center text-lg mr-2 shadow-md flex-shrink-0">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/90 backdrop-blur border border-gray-100 text-gray-800 shadow-md'
                  }`}
                  style={{
                    borderTopLeftRadius: message.sender === 'bot' ? 4 : 20,
                    borderTopRightRadius: message.sender === 'user' ? 4 : 20,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  
                  {/* Show "Show More" button for task responses */}
                  {message.sender === 'bot' && (
                    <div className="mt-3 space-y-2">
                      {(message.text.includes('others') || message.text.includes('more') || message.text.includes('tasks:')) && !showingAllTasks && (
                        <button
                          onClick={handleShowMoreTasks}
                          className="text-sm px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl 
                            hover:from-violet-600 hover:to-purple-600 transition-all duration-200 
                            shadow-lg shadow-purple-500/30 font-medium transform hover:scale-105"
                        >
                          👁️ Show All Tasks
                        </button>
                      )}
                      
                      {/* Show clickable task buttons when showing all tasks */}
                      {showingAllTasks && allTasksData.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {allTasksData.slice(0, 10).map((task: any, index: number) => (
                            task.status === 'pending' && (
                              <div key={task.id} className="flex gap-1">
                                <button
                                  onClick={() => handleCompleteTaskFromChat(task.id, task.title)}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                  title="Complete task"
                                >
                                  ✅ {index + 1}
                                </button>
                                <button
                                  onClick={() => handleDeleteTaskFromChat(task.id, task.title)}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Delete task"
                                >
                                  🗑️
                                </button>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 
                  flex items-center justify-center text-lg mr-2 shadow-md">
                  🤖
                </div>
                <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl px-5 py-4 shadow-md">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="p-4 bg-white/80 backdrop-blur border-t border-gray-100">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-5 py-3.5 bg-gray-50/80 backdrop-blur border border-gray-200 
                    rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100/50 
                    text-sm transition-all duration-300 shadow-inner"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="w-14 h-14 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 
                  text-white rounded-2xl hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 
                  shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 
                  transform hover:scale-105 active:scale-95 flex items-center justify-center text-xl"
              >
                {isLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <span>➤</span>
                )}
              </button>
            </div>
            {/* Quick suggestions */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
              <button onClick={() => setInputText('Show my tasks')} 
                className="px-3 py-1.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-medium 
                  hover:bg-violet-100 transition-colors whitespace-nowrap">
                📋 Tasks
              </button>
              <button onClick={() => setInputText('Help')} 
                className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-medium 
                  hover:bg-purple-100 transition-colors whitespace-nowrap">
                ❓ Help
              </button>
              <button onClick={() => setInputText('Add task: ')} 
                className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl text-xs font-medium 
                  hover:bg-pink-100 transition-colors whitespace-nowrap">
                ➕ Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
