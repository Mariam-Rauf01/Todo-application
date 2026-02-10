'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/30">
                📝
              </div>
              TaskMate
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-5 py-2.5 text-gray-700 hover:text-violet-600 hover:bg-violet-50 rounded-xl font-medium transition-all duration-200"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`relative py-24 md:py-32 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-violet-700 font-medium">Powered by AI ✨</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Manage Tasks
            </span>
            <br />
            <span className="text-gray-800">Smarter with AI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience the power of AI-driven task management. Create, organize, and complete tasks with natural language commands.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 transform hover:-translate-y-1"
            >
              🚀 Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl font-semibold text-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              Already a member? Login
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-violet-600">10K+</div>
              <div className="text-gray-500">Tasks Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">500+</div>
              <div className="text-gray-500">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600">99%</div>
              <div className="text-gray-500">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-24 bg-white/50 backdrop-blur-sm transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose TaskFlow?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to stay organized and productive
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI-Powered</h3>
              <p className="text-gray-600 text-lg">
                Create and manage tasks using natural language. Just tell our AI what you need to do!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 text-lg">
                blazing fast performance with real-time sync across all your devices.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                🔒
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure</h3>
              <p className="text-gray-600 text-lg">
                Your data is encrypted and protected. Only you can access your tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-24 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in 3 simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-3xl text-white font-bold mx-auto mb-6 shadow-xl shadow-purple-500/30">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Account</h3>
              <p className="text-gray-600">Sign up in seconds with your email</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-3xl text-white font-bold mx-auto mb-6 shadow-xl shadow-purple-500/30">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Add Tasks</h3>
              <p className="text-gray-600">Type or speak your tasks naturally</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-3xl text-white font-bold mx-auto mb-6 shadow-xl shadow-pink-500/30">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Things Done</h3>
              <p className="text-gray-600">Track progress and stay productive</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-24 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of users who are already managing tasks smarter with AI
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-white text-violet-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:-translate-y-1"
          >
            Start Free Today → 
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                📝
              </div>
              TaskMate
            </div>
            <p className="text-gray-400">© 2025 TaskMate. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
