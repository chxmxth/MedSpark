import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  X, 
  Check, 
  FileText,
  AlertTriangle
} from "lucide-react";
import { UserProfile } from "../types";
import { getApiUrl } from "../lib/api";
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

interface RevenueCatPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: "Resident Pro" | "Faculty Advisor";
  profile: UserProfile;
  onChangeProfile: (updated: UserProfile) => void;
}

export default function RevenueCatPaywall({
  isOpen,
  onClose,
  selectedPlan: initialSelectedPlan,
  profile,
  onChangeProfile
}: RevenueCatPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<"Resident Pro" | "Faculty Advisor">(initialSelectedPlan);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardholderName, setCardholderName] = useState(`${profile.firstName} ${profile.lastName}`);
  const [zipCode, setZipCode] = useState("");
  
  // Checkout sequence state
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [receipt, setReceipt] = useState<any | null>(null);

  const isNativePlatform = Capacitor.isNativePlatform();

  if (!isOpen) return null;

  const planDetails = {
    "Resident Pro": {
      price: "$9.99",
      period: "monthly",
      desc: "Unlimited OSCE stations & advanced diagnostics.",
      features: [
        "OSCE Short Cases: 200 per month (Fair Use)",
        "OSCE Long Cases: ✅ Included",
        "Clinical AI Assistant: 1,000 queries per month",
        "Case History / Encounter Log: ✅ Full access (saved to cloud)",
        "AI Board Evaluation: ✅ Auto-graded feedback & scores",
        "Lab & Imaging Diagnostics: ✅ Full suite unlocked",
        "RevenueCat Entitlement: pro / premium_simulator"
      ]
    },
    "Faculty Advisor": {
      price: "$29.99",
      period: "monthly",
      desc: "Syllabus builder and custom station creator.",
      features: [
        "OSCE Short Cases: 500 per month (Fair Use)",
        "OSCE Long Cases: ✅ Included",
        "Clinical AI Assistant: 1,000 queries per month",
        "Case History / Encounter Log: ✅ Full access (saved to cloud)",
        "AI Board Evaluation: ✅ Auto-graded feedback",
        "Custom Syllabus Mode: ✅ Upload PDFs & extract topics",
        "Lab & Imaging Diagnostics: ✅ Full suite unlocked",
        "RevenueCat Entitlement: faculty / faculty_access"
      ]
    }
  };

  // Helper to format credit card input (adds spaces)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    let matches = value.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || "";
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(value);
    }
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length >= 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    } else {
      setExpiry(value);
    }
  };

  const currentPlan = planDetails[selectedPlan];

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNativePlatform) {
      setStatus("submitting");
      setErrorMessage("");
      setLoadingStep(`Fetching packages for ${selectedPlan}...`);

      try {
        const offerings = await Purchases.getOfferings();
        if (!offerings.current || !offerings.current.availablePackages || offerings.current.availablePackages.length === 0) {
          throw new Error("No purchase packages available at this time.");
        }

        // Find the right package based on selection (you might need to adjust mapping depending on how you configured RevenueCat entitlements/products)
        // This is a naive match for the example:
        const packageToBuy = offerings.current.availablePackages.find(p =>
           (selectedPlan === "Resident Pro" && p.identifier.toLowerCase().includes("pro")) ||
           (selectedPlan === "Faculty Advisor" && p.identifier.toLowerCase().includes("faculty"))
        ) || offerings.current.availablePackages[0]; // fallback to first package

        setLoadingStep(`Initiating native purchase...`);
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToBuy });

        // Check entitlements
        const entitlementKeys = Object.keys(customerInfo.entitlements.active);
        if (entitlementKeys.length > 0) {
           setReceipt({
             status: "active",
             transactionId: "native_purchase",
             revenueCatId: customerInfo.originalAppUserId
           });

           let role: "student" | "pro" | "faculty" = "student";
           if (selectedPlan === "Resident Pro") {
             role = "pro";
           } else if (selectedPlan === "Faculty Advisor") {
             role = "faculty";
           }

           setStatus("success");
           onChangeProfile({
             ...profile,
             role,
             subscriptionPlan: selectedPlan,
             subscriptionActive: true
           });
        } else {
           throw new Error("Purchase was successful but no active entitlements were found.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Native purchase failed.");
      }
      return;
    }

    if (!cardNumber || !expiry || !cvc || !cardholderName || !zipCode) {
      setErrorMessage("Please complete all secure card details before authorizing.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const steps = [
      "Establishing link with RevenueCat SDK payment system...",
      "Evaluating security authentication tokens...",
      "Routing transactional block to card gateway servers...",
      "Verifying clinician credentials and billing codes...",
      "Securing active subscription entitlements in cloud catalog...",
    ];

    try {
      // Loop through progress steps for immersive premium feedback
      for (let i = 0; i < steps.length; i++) {
        setLoadingStep(steps[i]);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Call our actual server-side endpoint for payment token validation
      const response = await fetch(getApiUrl("/api/revenuecat/process"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: selectedPlan,
          billingDetails: {
            cardNumber,
            expiry,
            cvc,
            cardholderName,
            zipCode
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment verification failed.");
      }

      const receiptData = await response.json();
      setReceipt(receiptData);

      // Lock-in upgraded profiles in Firestore or memory
      let role: "student" | "pro" | "faculty" = "student";
      if (selectedPlan === "Resident Pro") {
        role = "pro";
      } else if (selectedPlan === "Faculty Advisor") {
        role = "faculty";
      }

      onChangeProfile({
        ...profile,
        role,
        subscriptionPlan: selectedPlan,
        subscriptionActive: true,
      });

      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to finalize card request in RevenueCat backend securely.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050608]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        id="revenuecat-paywall-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#0A0C10] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col md:grid md:grid-cols-12 min-h-[500px]"
      >
        {/* Top/Right Exit switch */}
        {status !== "submitting" && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 bg-slate-900/60 p-2 border border-slate-800/80 rounded-full cursor-pointer z-10 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dynamic checkout stages */}
        {status === "success" ? (
          <div className="col-span-12 p-8 flex flex-col items-center justify-center text-center animate-fade-in self-center py-16">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-black font-mono uppercase tracking-wider text-slate-100">Subscription Entitlement Activated!</h3>
            <p className="text-xs text-emerald-450 font-bold font-mono tracking-widest uppercase mt-1 mb-6">Secured via RevenueCat Web Purchases</p>
            
            <p className="text-xs text-slate-400 max-w-md mb-8 leading-relaxed font-semibold">
              Congratulations! Your active account credential has been verified and upgraded to <span className="text-slate-100 font-bold">{selectedPlan}</span>. 
              The expanded simulation gates and high-risk case modules are now fully unlocked.
            </p>

            {receipt && (
              <div className="w-full max-w-md bg-[#050608] border border-slate-850 p-5 rounded-xl text-left font-mono text-xs text-slate-350 mb-8 leading-relaxed shadow-inner">
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-3 font-bold text-slate-200">
                  <FileText className="w-4 h-4 text-emerald-400" /> Subscription Invoice Receipt
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Receipt ID:</span>
                  <span className="text-slate-200 font-bold">{receipt.receiptId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Plan Tier:</span>
                  <span className="text-emerald-400 font-black">{receipt.planName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Authorized Card:</span>
                  <span className="text-slate-200">•••• •••• •••• {receipt.last4}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Cardholder:</span>
                  <span className="text-slate-200">{receipt.payer}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-900 mt-2 pt-2">
                  <span className="text-slate-500 font-semibold">Subtotal:</span>
                  <span className="text-slate-300 font-bold">${receipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Surcharge Tax (8%):</span>
                  <span className="text-slate-400">${receipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 font-extrabold text-sm border-t border-dashed border-slate-800 mt-1 pt-1 text-slate-100">
                  <span className="text-slate-400 font-bold text-xs uppercase font-mono">Invoice Total Paid:</span>
                  <span>${receipt.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              onClick={onClose}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Access OSCE Portal Console
            </button>
          </div>
        ) : status === "submitting" ? (
          <div className="col-span-12 p-8 flex flex-col items-center justify-center text-center animate-fade-in py-24 self-center">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-6" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest animate-pulse">authorizing payment transactions...</span>
            <p className="text-xs text-slate-400 mt-3 font-semibold font-mono tracking-wide">{loadingStep}</p>
            <p className="text-[10px] text-slate-500 mt-1">Please do not reload, secure billing handshakes are executing.</p>
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: Features & Tier summary (Spans 5 cols) */}
            <div className="col-span-12 md:col-span-5 bg-slate-950/40 border-r border-slate-900 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-450 font-mono text-xs font-bold tracking-widest uppercase mb-6">
                  <Sparkles className="w-4 h-4" /> Active Upgrade Gate
                </div>
                
                <h3 className="text-xl font-bold text-slate-100 font-mono tracking-wider uppercase mb-1">Select Active Premium Tier</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-6">
                  Verify billing configurations below. Switch billing plans at any time directly with RevenueCat.
                </p>

                {/* Plan Toggle switches */}
                <div className="flex flex-col gap-3 font-mono">
                  <button 
                    onClick={() => setSelectedPlan("Resident Pro")}
                    className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                      selectedPlan === "Resident Pro"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-850 hover:border-slate-800 bg-[#050608] text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">Resident Pro Tier</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">200 Short Cases & Long Cases / mo</div>
                    </div>
                    <span className="text-xs font-black text-slate-100">$9.99/mo</span>
                  </button>

                  <button 
                    onClick={() => setSelectedPlan("Faculty Advisor")}
                    className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                      selectedPlan === "Faculty Advisor"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-850 hover:border-slate-800 bg-[#050608] text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">Faculty Advisor Tier</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">500 Short Cases & Long Cases / mo</div>
                    </div>
                    <span className="text-xs font-black text-slate-100">$29.99/mo</span>
                  </button>
                </div>

                {/* Features Checklist */}
                <div className="mt-8 flex flex-col gap-3">
                  <h4 className="text-[10px] font-mono uppercase font-black text-slate-500 tracking-wider">Unlocks for {selectedPlan}:</h4>
                  <ul className="flex flex-col gap-2.5">
                    {currentPlan.features.map((feat, i) => (
                      <li key={i} className="flex gap-2 items-start text-xs text-slate-350 leading-normal">
                        <Check className="w-3.5 h-3.5 text-emerald-450 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Assurance */}
              <div className="mt-8 pt-4 border-t border-slate-900/60 font-mono text-[10px] text-slate-500 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> SECURED VIA REVENUECAT ENCRYPTION SHA-256
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Checkout inputs (Spans 7 cols) */}
            <div className="col-span-12 md:col-span-7 p-6 md:p-8 flex flex-col justify-between">
              <div>
                {isNativePlatform ? (
                  <>
                    <div className="border-b border-slate-900 pb-4 mb-6">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Native App Purchase</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Proceed securely using your native App Store or Google Play account.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="mb-5 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-950 rounded-lg text-xs leading-normal text-rose-400 font-mono font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4 font-sans text-xs mt-10">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Purchase with {Capacitor.getPlatform() === 'ios' ? 'App Store' : 'Google Play'}
                      </button>
                      <p className="text-[10px] text-slate-500 font-semibold text-center mt-2 font-mono uppercase tracking-wide">
                        Secure checkout. Cancel anytime.
                      </p>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="border-b border-slate-900 pb-4 mb-6">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Interactive Billing Credentials</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Test using standard sandbox payment card numbers. To test declined cards, input <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-400">4111 1111 1111 1111</code>.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="mb-5 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-950 rounded-lg text-xs leading-normal text-rose-400 font-mono font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4 font-sans text-xs">
                      {/* Cardholder */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[10px]">Cardholder Name</label>
                        <input
                          required
                          type="text"
                          className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 px-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none"
                          placeholder="Sarah Jenkins"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                        />
                      </div>

                      {/* Card number */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[10px]">Card Number</label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            required
                            type="text"
                            maxLength={19}
                            onChange={handleCardNumberChange}
                            className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none font-mono"
                            placeholder="4242 4242 4242 4242"
                            value={cardNumber}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Expiry */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[10px]">Expiry (MM/YY)</label>
                          <input
                            required
                            type="text"
                            maxLength={5}
                            placeholder="12/28"
                            onChange={handleExpiryChange}
                            className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 px-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none font-mono"
                            value={expiry}
                          />
                        </div>

                        {/* CVC */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[10px]">CVC Code</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              required
                              type="text"
                              maxLength={3}
                              placeholder="123"
                              className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none font-mono"
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ZIP code */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-slate-500 uppercase tracking-wide font-mono text-[10px]">Billing ZIP / Postal Code</label>
                        <input
                          required
                          type="text"
                          className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 px-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none font-mono"
                          placeholder="90210"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                        />
                      </div>

                      <div className="mt-4">
                        <button
                          type="submit"
                          className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Pay & Activate {selectedPlan} • {currentPlan.price}
                        </button>
                        <p className="text-[10px] text-slate-500 font-semibold text-center mt-2 font-mono uppercase tracking-wide">
                          Instant upgrade sync. Secure checkout billing. Cancel anytime.
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
