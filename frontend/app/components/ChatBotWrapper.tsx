'use client';

import { useState, useEffect } from 'react';
import FloatingChatbot from './FloatingChatbot';

export default function ChatBotWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userId = localStorage.getItem('user_id');
    setIsLoggedIn(!!userId);

    const handleLogin = () => setIsLoggedIn(true);
    const handleLogout = () => setIsLoggedIn(false);

    window.addEventListener('login', handleLogin);
    window.addEventListener('logout', handleLogout);

    return () => {
      window.removeEventListener('login', handleLogin);
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  if (!mounted) return null;
  return isLoggedIn ? <FloatingChatbot /> : null;
}
