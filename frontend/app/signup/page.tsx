'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        if (data.user_id) {
          try {
            localStorage.setItem('user_id', data.user_id.toString());
            localStorage.setItem('user_email', data.email || email);
            localStorage.setItem('user_name', data.full_name || fullName);
          } catch (e) {
            console.warn('localStorage unavailable', e);
          }
          router.push('/login');
          return;
        }
        // fallback success path
        router.push('/login');
        return;
      }

      // handle error payloads
      if (data && (data.error || data.detail || data.message)) {
        setError(data.error || data.detail || data.message);
      } else {
        setError('Signup failed');
      }
    } catch (err) {
      setError('Unable to connect to server. Please ensure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">📝</div>
            <h1 className="text-3xl font-bold text-gray-800">TaskFlow</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Create an account</h2>
              <p className="text-gray-500 mt-2">Get started with TaskFlow today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-lg flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" className="w-4 h-4 mt-1 text-purple-600 rounded focus:ring-purple-500" required />
                <span className="text-sm text-gray-600">I agree to the <a href="#" className="text-purple-600 hover:underline">Terms of Service</a> and <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a></span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">Already have an account?{' '}
                <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-8">
            © 2024 TaskFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 relative overflow-hidden">
        {/* Animated shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center text-white">
            <div className="text-8xl mb-6 animate-bounce">🚀</div>
            <h1 className="text-5xl font-bold mb-4">Join TaskFlow</h1>
            <p className="text-xl text-white/80">Start organizing your life today</p>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm">Track Progress</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm">Set Goals</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm">Stay Productive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
