import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="bg-[#050608] min-h-screen text-slate-100 p-8 md:p-16">
      <div className="max-w-4xl mx-auto bg-[#0A0C10] p-8 md:p-12 rounded-2xl border border-slate-800/60 shadow-xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">Terms and Conditions</h1>
        <p className="text-slate-400 mb-8 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-slate-300 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">1. Introduction</h2>
            <p>Welcome to MediXpark. By accessing our application and services, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, you may not use our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">2. Service Usage</h2>
            <p>MediXpark provides a medical OSCE simulation platform for educational purposes only. Our services, including AI-driven decision support and patient simulations, are not substitutes for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay in seeking it because of something you have read or experienced on our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">3. User Accounts</h2>
            <p>To use certain features, you must register for an account. You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">4. Intellectual Property</h2>
            <p>The service and its original content, features, and functionality are owned by MediXpark and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">5. Subscriptions and Payments</h2>
            <p>Some parts of the service are billed on a subscription basis ("Subscriptions"). You will be billed in advance on a recurring and periodic basis. Subscription fees are non-refundable except as required by law or as explicitly stated in our Return Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">6. Limitation of Liability</h2>
            <p>In no event shall MediXpark, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">7. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-emerald-400 mb-3">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@medixpark.com.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/60 flex justify-center">
          <a href="/" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">
            Return to MediXpark
          </a>
        </div>
      </div>
    </div>
  );
}
