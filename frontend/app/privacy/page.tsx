'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/signup" className="text-white/80 hover:text-white text-sm flex items-center gap-2 mb-4">
            ← Back to Signup
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-white/80 mt-2">Last updated: February 2024</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              At TaskFlow, we value your privacy and are committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you 
              use our task management application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Information We Collect</h2>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li className="font-medium text-gray-700">Personal Information:</li>
              <li>• Full name (provided during signup)</li>
              <li>• Email address (used for account authentication)</li>
              <li>• Password (encrypted securely)</li>
              <li className="font-medium text-gray-700 mt-3">Usage Data:</li>
              <li>• Tasks and notes you create</li>
              <li>• Chat messages with our AI assistant</li>
              <li>• App preferences and settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>• Provide and maintain our services</li>
              <li>• Process your transactions</li>
              <li>• Send you account-related notifications</li>
              <li>• Improve and personalize your experience</li>
              <li>• Provide customer support</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Data Storage & Security</h2>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>• Your data is stored on secure servers</li>
              <li>• Passwords are encrypted using industry-standard hashing (bcrypt)</li>
              <li>• We use HTTPS/TLS for data transmission</li>
              <li>• Access to personal data is restricted to authorized personnel only</li>
              <li>• Regular security audits are performed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We do NOT sell your personal information. We may share data only in these cases:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>• <strong>Service Providers:</strong> With trusted third parties who help us operate (hosting, analytics)</li>
              <li>• <strong>Legal Requirements:</strong> When required by law or to protect rights/safety</li>
              <li>• <strong>Business Transfers:</strong> In case of merger or acquisition (with notice)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Your Rights</h2>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>• <strong>Access:</strong> You can request a copy of your data</li>
              <li>• <strong>Correction:</strong> You can update or correct your information</li>
              <li>• <strong>Deletion:</strong> You can request deletion of your account and data</li>
              <li>• <strong>Data Portability:</strong> You can export your data in a common format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Cookies & Tracking</h2>
            <p className="text-gray-600 leading-relaxed">
              We use essential cookies to keep you logged in and remember your preferences. 
              These are necessary for the app to function properly. We do not use third-party 
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              TaskFlow is not intended for children under 13. We do not knowingly collect 
              personal information from children under 13. If you believe we have collected 
              such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Changes to Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of 
              any material changes by posting the new policy on this page and updating 
              the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us at:
              <br />
              <span className="text-purple-600">support@taskflow.app</span>
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
