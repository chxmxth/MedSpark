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
import { Purchases as PurchasesWeb } from "@revenuecat/purchases-js";

interface RevenueCatPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: "Resident Pro" | "Faculty Advisor";
  profile: UserProfile;
  onChangeProfile: (updated: UserProfile) => void;
  userId: string;
}

export default function RevenueCatPaywall({
  isOpen,
  onClose,
  selectedPlan: initialSelectedPlan,
  profile,
  onChangeProfile,
  userId
}: RevenueCatPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<"Resident Pro" | "Faculty Advisor">(initialSelectedPlan);
  
  // Checkout sequence state
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [receipt, setReceipt] = useState<any | null>(null);

  const isNativePlatform = Capacitor.isNativePlatform();
  const isWebPlatform = Capacitor.getPlatform() === "web";

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

  const currentPlan = planDetails[selectedPlan];

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("submitting");
    setErrorMessage("");
    setLoadingStep(`Fetching packages for ${selectedPlan}...`);

    try {
      if (isWebPlatform) {
        if (!PurchasesWeb.isConfigured()) {
          throw new Error("Purchasing is not configured properly.");
        }
        const offerings = await PurchasesWeb.getSharedInstance().getOfferings();
        const expectedId = selectedPlan === "Resident Pro" ? "medispark_pro_monthly" : "medispark_faculty_monthly";
        let packageToBuy;

        const isMatch = (p: any) => {
          const keyword = selectedPlan === "Resident Pro" ? "pro" : "faculty";
          const idMatch = p.identifier === expectedId || p.identifier.toLowerCase().includes(keyword) || p.identifier.toLowerCase().startsWith('$rc_');
          const productIdMatch = p.product?.identifier === expectedId || p.product?.identifier?.toLowerCase().includes(keyword);
          const webIdMatch = p.rcBillingProduct?.identifier === expectedId || p.rcBillingProduct?.identifier?.toLowerCase().includes(keyword);
          const platformProductIdMatch = p.platform_product_identifier === expectedId || p.platform_product_identifier?.toLowerCase().includes(keyword);
          const platformProductCamelMatch = p.platformProductIdentifier === expectedId || p.platformProductIdentifier?.toLowerCase().includes(keyword);

          return idMatch || productIdMatch || webIdMatch || platformProductIdMatch || platformProductCamelMatch;
        };

        if (offerings.all && offerings.all[expectedId]) {
          const off = offerings.all[expectedId];
          if (off.availablePackages && off.availablePackages.length > 0) {
             packageToBuy = off.availablePackages.find(isMatch) || off.availablePackages[0];
          }
        }
        if (!packageToBuy && offerings.all) {
          for (const key of Object.keys(offerings.all)) {
            const off = offerings.all[key];
            if (off && off.availablePackages) {
              const found = off.availablePackages.find(isMatch);
              if (found) {
                packageToBuy = found;
                break;
              }
            }
          }
        }
        if (!packageToBuy && offerings.current && offerings.current.availablePackages) {
          packageToBuy = offerings.current.availablePackages.find(isMatch) || offerings.current.availablePackages[0];
        }

        if (!packageToBuy && offerings.all) {
          for (const key of Object.keys(offerings.all)) {
            const off = offerings.all[key];
            if (off && off.availablePackages && off.availablePackages.length > 0) {
              packageToBuy = off.availablePackages[0];
              break;
            }
          }
        }

        if (!packageToBuy) {
          throw new Error(`No purchase packages available at this time for ${selectedPlan}.`);
        }

        const checkoutUrl = packageToBuy.webCheckoutURL;
        if (!checkoutUrl) {
           throw new Error("No web checkout URL found for this package.");
        }

        // Web checkout URLs from RevenueCat might already have query parameters, so safely append
        const finalUrl = checkoutUrl.includes('?')
           ? `${checkoutUrl}&app_user_id=${userId}`
           : `${checkoutUrl}?app_user_id=${userId}`;

        window.open(finalUrl, "_blank");

        setLoadingStep("Waiting for payment completion...");

        const pollInterval = setInterval(async () => {
          try {
            if (PurchasesWeb.isConfigured()) {
              const customerInfo = await PurchasesWeb.getSharedInstance().getCustomerInfo();
              const entitlementKeys = Object.keys(customerInfo.entitlements.active);

              if (entitlementKeys.length > 0) {
                clearInterval(pollInterval);
                handleSuccessfulPurchase({
                  receiptId: "web_stripe_checkout",
                  customerInfo
                });
              }
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(pollInterval);
          setStatus(prev => prev === "submitting" ? "idle" : prev);
        }, 300000);

        return;
      }
      let offerings;
      if (isNativePlatform) {
        offerings = await Purchases.getOfferings();
      } else {
        throw new Error("Purchasing is not configured properly on this platform.");
      }
        const expectedId = selectedPlan === "Resident Pro" ? "medispark_pro_monthly" : "medispark_faculty_monthly";
        let packageToBuy;

        const isMatch = (p: any) => {
          const keyword = selectedPlan === "Resident Pro" ? "pro" : "faculty";
          const idMatch = p.identifier === expectedId || p.identifier.toLowerCase().includes(keyword) || p.identifier.toLowerCase().startsWith('$rc_');
          const productIdMatch = p.product?.identifier === expectedId || p.product?.identifier?.toLowerCase().includes(keyword);
          const webIdMatch = p.rcBillingProduct?.identifier === expectedId || p.rcBillingProduct?.identifier?.toLowerCase().includes(keyword);
          const platformProductIdMatch = p.platform_product_identifier === expectedId || p.platform_product_identifier?.toLowerCase().includes(keyword);
          const platformProductCamelMatch = p.platformProductIdentifier === expectedId || p.platformProductIdentifier?.toLowerCase().includes(keyword);

          return idMatch || productIdMatch || webIdMatch || platformProductIdMatch || platformProductCamelMatch;
        };

        // 1. Try to find the exact offering by ID and use its matching package
        if (offerings.all && offerings.all[expectedId]) {
          const off = offerings.all[expectedId];
          if (off.availablePackages && off.availablePackages.length > 0) {
             packageToBuy = off.availablePackages.find(isMatch) || off.availablePackages[0];
          }
        }

        // 2. Fallback: Search all offerings for a package identifier that matches
        if (!packageToBuy && offerings.all) {
          for (const key of Object.keys(offerings.all)) {
            const off = offerings.all[key];
            if (off && off.availablePackages) {
              const found = off.availablePackages.find(isMatch);
              if (found) {
                packageToBuy = found;
                break;
              }
            }
          }
        }

        // 3. Fallback: Check offerings.current
        if (!packageToBuy && offerings.current && offerings.current.availablePackages) {
          packageToBuy = offerings.current.availablePackages.find(isMatch) || offerings.current.availablePackages[0];
        }

        // 4. Ultimate Fallback: Select the very first package from ANY offering
        if (!packageToBuy && offerings.all) {
            for (const key of Object.keys(offerings.all)) {
              const off = offerings.all[key];
              if (off && off.availablePackages && off.availablePackages.length > 0) {
                packageToBuy = off.availablePackages[0];
                break;
              }
            }
        }

        if (!packageToBuy) {
          throw new Error(`No purchase packages available at this time for ${selectedPlan}.`);
        }

        setLoadingStep(`Initiating purchase...`);
        let purchaseResult;
        if (isNativePlatform) {
          purchaseResult = await Purchases.purchasePackage({ aPackage: packageToBuy });
          const { customerInfo } = purchaseResult;

          // Check entitlements
          const entitlementKeys = Object.keys(customerInfo.entitlements.active);
          if (entitlementKeys.length > 0) {
             setReceipt({
               receiptId: "native_purchase",
               planName: selectedPlan,
               last4: "N/A",
               payer: profile.firstName + " " + profile.lastName,
               subtotal: parseFloat(currentPlan.price.replace("$", ""))
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
        }
      } catch (err: any) {
        setStatus("error");
        if (!err.userCancelled) {
          setErrorMessage(err.message || "Purchase failed.");
        }
      }
  };

  const handleSuccessfulPurchase = ({ receiptId, customerInfo }: any) => {
    setReceipt({
      receiptId,
      planName: selectedPlan,
      last4: "N/A",
      payer: profile.firstName + " " + profile.lastName,
      subtotal: parseFloat(currentPlan.price.replace("$", "")),
      tax: 0,
      total: parseFloat(currentPlan.price.replace("$", ""))
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
                      <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Web App Purchase</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Proceed securely using RevenueCat Web Checkout.
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
                        Purchase via Checkout
                      </button>
                      <p className="text-[10px] text-slate-500 font-semibold text-center mt-2 font-mono uppercase tracking-wide">
                        Secure checkout. Cancel anytime.
                      </p>
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
