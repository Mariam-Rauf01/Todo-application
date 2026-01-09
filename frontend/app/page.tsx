'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                AI Powered Todo App
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Your Tasks Smarter with AI
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Experience the power of AI-driven task management.
          </p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-base font-medium"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Smart Management</h3>
              <p className="text-gray-600">
                AI-powered task organization.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Time Optimization</h3>
              <p className="text-gray-600">
                Better productivity insights.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Secure</h3>
              <p className="text-gray-600">
                Protected data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}