'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

// Message type definition
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// ChatScreen component - Web Version with FlatList-like behavior
export default function ChatScreen() {
  // Messages state - sorted oldest first (index 0 = earliest)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for scroll container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track if user was at bottom before new message
  const isAtBottomRef = useRef(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isAtBottomRef.current && messages.length > 0) {
      // Small delay to ensure content is rendered
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
      target.clientHeight + 50; // 50px threshold
    isAtBottomRef.current = isAtBottom;
  }, []);

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
    setInputText('');
    setIsLoading(true);

    // Simulate bot response after 1-2 seconds
    setTimeout(() => {
      const botResponse = getBotResponse(inputText.trim());
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // 1-2 seconds delay
  }, [inputText, isLoading]);

  // Handle keyboard press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Simple bot response logic (for demo)
  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm your TaskMate AI assistant. How can I help you today?";
    } else if (lowerInput.includes('task')) {
      return "I can help you manage tasks! Just tell me what you need - like 'Add task: Buy groceries' or 'Show my tasks'.";
    } else if (lowerInput.includes('help')) {
      return "I can help you with:\n• Adding new tasks\n• Viewing your tasks\n• Completing tasks\n• Deleting tasks\n\nWhat would you like to do?";
    } else if (lowerInput.includes('thank')) {
      return "You're welcome! 😊 Is there anything else I can help you with?";
    } else {
      return "I understand! I'm here to help with your task management. You can ask me to add tasks, view tasks, or get help with anything else!";
    }
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

      {/* Messages List - Simulating FlatList with inverted behavior */}
      {/* Using overflow-y: auto and flexDirection: column-reverse to achieve inverted effect */}
      <div 
        style={styles.messagesList} 
        onScroll={handleScroll}
      >
        {/* Messages rendered in reverse order to simulate inverted FlatList */}
        {/* Oldest message at TOP, newest at BOTTOM */}
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
  
  // Messages list - simulates FlatList with inverted behavior
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
