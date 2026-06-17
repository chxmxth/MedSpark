import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0A0C10] border border-slate-800/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
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
            <h3 className="text-lg font-bold text-emerald-400 mb-2">1. Information We Collect</h3>
            <p>At MediXpark, we collect information that you provide directly to us, such as when you create an account, update your profile, or communicate with us. This includes your name, email address, medical role, and interaction data within our OSCE simulations.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">2. How We Use Your Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services, including personalizing your simulation experiences, processing transactions, and sending you technical notices and support messages.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">3. Data Security and Storage</h3>
            <p>Your simulation performance data and profile information are securely stored. We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">4. Third-Party Services</h3>
            <p>We may share information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., payment processing via RevenueCat/Stripe, AI processing via Google Gemini).</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">5. Your Rights</h3>
            <p>Depending on your location, you may have rights regarding your personal information, including the right to access, correct, or delete your data. You can manage most of this information directly from your User Settings dashboard.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">6. Contact Information</h3>
            <p>For any privacy-related questions or concerns, please contact our Data Protection Officer at privacy@medixpark.com.</p>
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
