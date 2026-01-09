'use client';

import Link from 'next/link';

export default function AuthPageHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            AI Powered Todo App
          </Link>
        </div>
      </div>
    </header>
  );
}