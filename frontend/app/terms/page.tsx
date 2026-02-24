'use client';

import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/signup" className="text-white/80 hover:text-white text-sm flex items-center gap-2 mb-4">
            ← Back to Signup
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-white/80 mt-2">Last updated: February 2024</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using TaskFlow, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. User Eligibility</h2>
            <p className="text-gray-600 leading-relaxed">
              You must be at least 13 years old to use TaskFlow. By signing up, you confirm that you meet this age requirement 
              and have the legal capacity to enter into this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Account Responsibilities</h2>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>• You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>• You must provide accurate and complete registration information</li>
              <li>• You agree to notify us immediately of any unauthorized use of your account</li>
              <li>• You are solely responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              You agree NOT to:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>• Create multiple accounts for the same person</li>
              <li>• Use the service for any illegal or unauthorized purpose</li>
              <li>• Attempt to gain unauthorized access to any part of the service</li>
              <li>• Interfere with or disrupt the service or servers</li>
              <li>• Share your account credentials with others</li>
              <li>• Post or transmit harmful, abusive, or inappropriate content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. User Content</h2>
            <p className="text-gray-600 leading-relaxed">
              You retain ownership of any content you create, post, or store on TaskFlow. By using our service, 
              you grant us permission to use your content solely for providing and improving our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Service Modifications</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time. 
              We will try to provide reasonable notice of any significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              TaskFlow is provided "as is" without any warranties, expressed or implied. We do not guarantee 
              that the service will be error-free, secure, or continuously available.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              We shall not be liable for any indirect, incidental, or consequential damages arising from 
              your use of TaskFlow. Your use of the service is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the app 
              or at support@taskflow.app
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
            >
              ← Back to Signup
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© 2024 TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
