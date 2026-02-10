'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, removeToken } from '../utils/auth';

export default function AuthHeader() {
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  const handleLogout = () => {
    // Remove token from localStorage
    removeToken();
    // Remove token from cookies
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAuth(false);
    router.push('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">TaskMate</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </a>

            {/* Show different navigation based on authentication status */}
            {isAuth ? (
              <>
                <a href="/tasks" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Tasks
                </a>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </a>
                <a href="/signup" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Sign Up
                </a>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}