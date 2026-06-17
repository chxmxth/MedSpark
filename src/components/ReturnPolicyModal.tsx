import React from 'react';
import { X } from 'lucide-react';

interface ReturnPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnPolicyModal({ isOpen, onClose }: ReturnPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0A0C10] border border-slate-800/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <h2 className="text-2xl font-bold text-white">Return & Refund Policy</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow text-slate-300 space-y-6 text-sm md:text-base">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">1. General Policy</h3>
            <p>MediXpark offers digital subscriptions providing access to our AI-driven OSCE simulation platform. Because our products are digital and access is granted immediately upon purchase, we generally do not offer refunds.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">2. Subscription Cancellations</h3>
            <p>You may cancel your subscription at any time. When you cancel, you will continue to have access to your premium features until the end of your current billing cycle. To cancel, please use the subscription management options within the app or contact support.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">3. Exceptions</h3>
            <p>We may offer refunds on a case-by-case basis under the following exceptional circumstances:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Duplicate billing errors caused by our systems.</li>
              <li>Significant technical issues that prevent you from using the core features of the service for an extended period, which our support team is unable to resolve.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">4. App Store Purchases</h3>
            <p>If you purchased your subscription through the Apple App Store or Google Play Store, your purchase is subject to their respective refund policies. MediXpark cannot process refunds for purchases made directly through these third-party platforms. Please contact Apple or Google customer support for refund requests.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">5. Contacting Support</h3>
            <p>If you believe you are eligible for a refund based on our exceptions, please contact our billing team at support@medixpark.com within 7 days of the charge in question. Include your account email and details of the issue.</p>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800/60 bg-slate-900/50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
