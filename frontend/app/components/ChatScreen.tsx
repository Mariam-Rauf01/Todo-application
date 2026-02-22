'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

// Message type definition
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// User info type
interface UserInfo {
  name: string;
  email: string;
}

// ChatScreen component - Web Version with FlatList-like behavior
export default function ChatScreen() {
  // Messages state - sorted oldest first (index 0 = earliest)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // Ref for scroll container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track if user was at bottom before new message
  const isAtBottomRef = useRef(true);

  // Load user info on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');
    
    if (userName || userEmail) {
      setUserInfo({
        name: userName || 'User',
        email: userEmail || '',
      });
    }
  }, []);

  // Add welcome greeting on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "👋 Assalamu alaykum! Welcome to TaskMate AI!\n\nI'm your personal task manager assistant.\n\nHow can I help you today? 😊",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isAtBottomRef.current && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = 
      target.scrollHeight - target.scrollTop <= 
      target.clientHeight + 50;
    isAtBottomRef.current = isAtBottom;
  }, []);

  // Detect if text is in Roman Urdu
  const isRomanUrdu = (text: string): boolean => {
    const romanUrduPatterns = [
      /kaisa/i, /kaise/i, /kya/i, /kaun/i, /kahaan/i, /kyun/i,
      /main/i, /tum/i, /woh/i, /yeh/i, /mera/i, /tera/i, /hamara/i,
      /hai/i, /ho/i, /tha/i, /thi/i, /the/i, /honge/i, /hoga/i, /hogi/i,
      /jao/i, /aao/i, /dekho/i, /suno/i, /bolo/i, /likho/i, /karo/i, /kijiye/i,
      /achha/i, /bahut/i, /kam/i, /zyada/i, /theek/i, /galat/i, /sahi/i,
      /mujhe/i, /tumhe/i, /unhe/i, /isko/i, /usko/i, /iske/i, /uske/i,
      /aur/i, /ya/i, /lekin/i, /magar/i, /phir/i, /abhi/i, /kabhi/i, /hamesha/i,
      /kal/i, /aaj/i, /parso/i, /inshaallah/i, /insha/i, /allah/i,
      /shukriya/i, /mashallah/i, /alhamdullillah/i, /bismillah/i,
      /kya haal/i, /kya khbr/i, /zaroorat hai/i,
      /mein/i, /ko/i, /se/i, /pe/i, /ka/i, /ki/i, /ke/i,
      /haan/i, /nahi/i, /na/i,
      /ji/i, /ji haan/i, /ji nahe/i, /zaroor/i, /bilkul/i,
      /phir bhi/i, /to/i,
      /koi/i, /kuch/i, /sab/i, /kitna/i, /itna/i, /utna/i,
      /accha/i, /theek hai/i, /chalega/i, /ho jayega/i,
      /de do/i, /le lo/i, /kar do/i, /kar denge/i,
    ];
    
    // Check if text contains Roman Urdu characters
    const lowerText = text.toLowerCase();
    return romanUrduPatterns.some(pattern => pattern.test(lowerText));
  };

  // Send user message
  const sendMessage = useCallback(() => {
    if (!inputText.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to state (newest at bottom)
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Simulate bot response after 1-2 seconds
    setTimeout(() => {
      const botResponse = getBotResponse(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  }, [inputText, isLoading]);

  // Handle keyboard press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Bot response logic with Roman Urdu support
  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    const isUrdu = isRomanUrdu(userInput);
    
    // User identity check
    if (lowerInput.includes('who am i') || lowerInput.includes('kon hun') || 
        lowerInput.includes('mein kaun') || lowerInput.includes('mija kaun') ||
        lowerInput.includes('my name') || lowerInput.includes('mera naam') ||
        lowerInput.includes('identify')) {
      if (userInfo) {
        if (isUrdu) {
          return `📋 Aapki information:\n\n👤 Name: ${userInfo.name}\n📧 Email: ${userInfo.email}\n\nKoi aur sawaal? 😊`;
        }
        return `📋 Your information:\n\n👤 Name: ${userInfo.name}\n📧 Email: ${userInfo.email}\n\nAny other questions? 😊`;
      } else {
        if (isUrdu) {
          return "⚠️ Mujhe aapki information nahi mili. Please login karein phir try karein.";
        }
        return "⚠️ I don't have your information. Please login first and try again.";
      }
    }
    
    // Greetings in English and Roman Urdu
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || 
        lowerInput.includes('hey') || lowerInput.includes('salam') ||
        lowerInput.includes('asalam') || lowerInput.includes('peace') ||
        lowerInput.includes('greetings')) {
      return "👋 Assalamu alaykum!\n\nHello! Welcome to TaskMate AI! 😊\n\nHow can I assist you today?\n\nAap ki tareh kar sakta hoon?";
    }
    
    // Help command
    if (lowerInput.includes('help') || lowerInput.includes('madad') || 
        lowerInput.includes('sahayata') || lowerInput.includes('guide')) {
      if (isUrdu) {
        return `🤖 TaskMate AI - Help Guide\n\nMein aapki in cheezon mein madad kar sakta hoon:\n\n✅ Neeche tasks add karna\n✅ Apni tasks dekhna\n✅ Tasks complete karna\n✅ Tasks delete karna\n✅ Reminders set karna\n\nKuch examples:\n• "Add task: Groceries le aana 🛒"\n• "Meri sari tasks dikhao"\n• "Task 1 complete kar do ✅"\n• "Kal subah ka meeting delete kar do"\n\nAap kya karna chahte hain? 😊`;
      }
      return `🤖 TaskMate AI - Help Guide\n\nI can help you with:\n\n✅ Adding new tasks\n✅ Viewing your tasks\n✅ Completing tasks\n✅ Deleting tasks\n✅ Setting reminders\n\nSome examples:\n• "Add task: Buy groceries 🛒"\n• "Show all my tasks"\n• "Complete task 1 ✅"\n• "Delete morning meeting"\n\nWhat would you like to do? 😊`;
    }
    
    // Task related queries
    if (lowerInput.includes('task') || lowerInput.includes('kaam') || 
        lowerInput.includes('work') || lowerInput.includes('todolist') ||
        lowerInput.includes('todo')) {
      if (isUrdu) {
        return "📝 Tasks ke baare mein madad chahiye?\n\nAap mujhe bol sakte hain:\n• 'Neeche task add karna: Groceries le aana'\n• 'Meri sari tasks dikhao'\n• 'Task 1 complete kar do'\n• 'Task 2 delete kar do'\n\nKaisa task add karna chahte hain? 😊";
      }
      return "📝 Need help with tasks?\n\nYou can tell me:\n• 'Add task: Buy groceries'\n• 'Show all my tasks'\n• 'Complete task 1'\n• 'Delete task 2'\n\nWhat task would you like to add? 😊";
    }
    
    // Thank you
    if (lowerInput.includes('thank') || lowerInput.includes('shukriya') || 
        lowerInput.includes('shukria') || lowerInput.includes('mashkoor') ||
        lowerInput.includes('appreciate')) {
      if (isUrdu) {
        return "😊 Aapka shukriya! Khush hua madad kar ke!\n\nKoi aur sawaal ho to zaroor puchiye!";
      }
      return "😊 You're welcome! Happy to help!\n\nFeel free to ask if you have any more questions!";
    }
    
    // How are you
    if (lowerInput.includes('how are') || lowerInput.includes('kaisa hai') || 
        lowerInput.includes('kaisi hai') || lowerInput.includes('kya haal') ||
        lowerInput.includes('kya khbr')) {
      if (isUrdu) {
        return "😊 Main theek hoon, shukriya! ☺️\n\nAapa hai kais? Aapki kya help chahiye?";
      }
      return "😊 I'm doing great, thank you! ☺️\n\nHow are you? How can I help you today?";
    }
    
    // What's your name
    if (lowerInput.includes('your name') || lowerInput.includes('tumhara naam') || 
        lowerInput.includes('aap ka naam') || lowerInput.includes('who are you') ||
        lowerInput.includes('kon ho')) {
      if (isUrdu) {
        return "🤖 Mera naam TaskMate AI hai!\n\nMain aapki task management mein madad karne ke liye hoon. 😊\n\nAap mujhe tasks add karne, dekhne, complete karne aur delete karne ke liye bol sakte hain!";
      }
      return "🤖 My name is TaskMate AI!\n\nI'm here to help you manage your tasks! 😊\n\nYou can ask me to add, view, complete, or delete tasks!";
    }
    
    // Goodbye
    if (lowerInput.includes('bye') || lowerInput.includes('goodbye') || 
        lowerInput.includes('alvida') || lowerInput.includes('phir milenge') ||
        lowerInput.includes('see you later')) {
      if (isUrdu) {
        return "👋 Alvida! Phir milenge! 😊\n\nAllah hafiz! 🫡";
      }
      return "👋 Goodbye! See you later! 😊\n\nTake care! 🫡";
    }
    
    // Default response with Roman Urdu support
    if (isUrdu) {
      return "🤔 Samajh gaya! Main yahan task management mein madad ke liye hoon. 😊\n\nAap mujhe ye bol sakte hain:\n• Neeche task add karna\n• Meri tasks dikhana\n• Task complete karna\n• Task delete karna\n• Help chahiye\n\nAap kya karna chahte hain?";
    }
    return "🤔 I understand! I'm here to help you manage your tasks! 😊\n\nYou can ask me to:\n• Add a new task\n• Show your tasks\n• Complete a task\n• Delete a task\n• Get help\n\nWhat would you like to do?";
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render individual message bubble
  const renderMessage = useCallback((item: Message) => {
    const isUser = item.sender === 'user';
    
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            maxWidth: '80%',
            position: 'relative',
          }}
        >
          <div
            style={{
              backgroundColor: isUser ? '#DCF8C6' : '#FFFFFF',
              borderRadius: 18,
              padding: '10px 14px',
              borderTopLeftRadius: isUser ? 18 : 4,
              borderTopRightRadius: isUser ? 4 : 18,
              border: isUser ? 'none' : '1px solid #E5E5EA',
              position: 'relative',
            }}
          >
            {/* Bubble tail - triangular pointer */}
            {isUser ? (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: -8,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderTop: '8px solid #DCF8C6',
                  borderBottomRightRadius: 4,
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: -8,
                  width: 0,
                  height: 0,
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #FFFFFF',
                  borderBottomLeftRadius: 4,
                }}
              />
            )}
            
            <p
              style={{
                fontSize: 15,
                lineHeight: 20,
                color: '#000',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {item.text}
            </p>
          </div>
          
          {/* Timestamp below bubble */}
          <p
            style={{
              fontSize: 10,
              color: '#888',
              marginTop: 4,
              marginLeft: 4,
              marginRight: 4,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {formatTime(item.timestamp)}
          </p>
        </div>
      </div>
    );
  }, []);

  // Empty list component
  const ListEmptyComponent = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingBottom: 60,
    }}>
      <span style={{ fontSize: 50, marginBottom: 15 }}>👋</span>
      <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, margin: 0 }}>
        Welcome to TaskMate!
      </h3>
      <p style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, margin: 0 }}>
        I'm your AI task manager assistant.<br />
        Send a message to get started!
      </p>
    </div>
  );

  // Loading indicator component
  const ListFooterComponent = () => {
    if (!isLoading) return null;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 10,
      }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: '10px 14px',
            border: '1px solid #E5E5EA',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#888',
              animation: 'bounce 1s infinite',
              animationDelay: '0ms',
            }} />
            <div style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#888',
              animation: 'bounce 1s infinite',
              animationDelay: '150ms',
            }} />
            <div style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#888',
              animation: 'bounce 1s infinite',
              animationDelay: '300ms',
            }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Inline keyframes for loading animation */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={styles.headerTitle}>TaskMate AI</span>
          <span style={styles.headerSubtitle}>Online • AI Powered</span>
        </div>
      </div>

      {/* Messages List */}
      <div 
        style={styles.messagesList} 
        onScroll={handleScroll}
      >
        {/* Messages rendered in reverse order to simulate inverted FlatList */}
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          {messages.length === 0 && <ListEmptyComponent />}
          {[...messages].reverse().map((message) => renderMessage(message))}
          <ListFooterComponent />
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          style={{
            ...styles.sendButton,
            ...((!inputText.trim() || isLoading) ? styles.sendButtonDisabled : {}),
          }}
          onClick={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <span style={{ fontSize: 12 }}>⏳</span>
          ) : (
            <span>➤</span>
          )}
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  
  // Header styles
  header: {
    backgroundColor: '#7C3AED',
    paddingTop: 50,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    display: 'flex',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
    marginTop: 2,
  },
  
  // Messages list
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  
  // Input area
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderTopStyle: 'solid',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    border: 'none',
    outline: 'none',
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    width: 44,
    height: 44,
    borderRadius: 22,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 18,
  },
  sendButtonDisabled: {
    backgroundColor: '#A78BFA',
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
