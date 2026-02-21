'use client';

import { useState, useEffect } from 'react';
import FloatingChatbot from './FloatingChatbot';

export default function ChatBotWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is logged in
    const userId = localStorage.getItem('user_id');
    setIsLoggedIn(!!userId);

    // Listen for login/logout events
    const handleLogin = () => setIsLoggedIn(true);
    const handleLogout = () => setIsLoggedIn(false);

    window.addEventListener('login', handleLogin);
    window.addEventListener('logout', handleLogout);

    // Also check periodically in case user logs in through another tab
    const interval = setInterval(() => {
      const userId = localStorage.getItem('user_id');
      setIsLoggedIn(!!userId);
    }, 1000);

    return () => {
      window.removeEventListener('login', handleLogin);
      window.removeEventListener('logout', handleLogout);
      clearInterval(interval);
    };
  }, []);

  // Don't render anything on server or until we check
  if (!mounted) return null;

  // Only show FloatingChatbot when user is logged in
  return isLoggedIn ? <FloatingChatbot /> : null;
}
