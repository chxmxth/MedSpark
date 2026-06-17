import React, { useState, FormEvent, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  auth, 
  signInWithGoogle, 
  logOutUser 
} from "../lib/firebase";
import RevenueCatPaywall from "./RevenueCatPaywall";
import { 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  BarChart, 
  Settings2, 
  CreditCard,
  Chrome,
  Facebook,
  Mail,
  Lock,
  Zap,
  Power,
  RotateCw,
  FileText,
  RefreshCcw
} from "lucide-react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import ReturnPolicyModal from "./ReturnPolicyModal";

interface UserProfileProps {
  profile: UserProfile;
  onChangeProfile: (updated: UserProfile) => void;
}

export default function UserProfileSettings({ profile, onChangeProfile }: UserProfileProps) {
  const [emailInput, setEmailInput] = useState(profile.email);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [isEditing, setIsEditing] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

  // Paywall states
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"Resident Pro" | "Faculty Advisor">("Resident Pro");

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  // Monitor Auth changes to dynamically adjust UI layouts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (user) {
        setEmailInput(user.email || "");
        const parts = (user.displayName || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync state variables when profile is loaded/updated
  useEffect(() => {
    setEmailInput(profile.email);
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
  }, [profile]);

  // Real clinical Google login
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      alert("Authentication failed. Please verify your settings or try again. If on localhost, verify your domain is whitelisted in Firebase Console.\n\nDetailed error: " + (error.message || error));
    }
  };

  const handleCredentialsAuth = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Guest system mock credentials active. Please use the Google SSO option to enable real Firebase Database Cloud Sync!");
    setFirebaseUser({
      uid: 'guest-' + Date.now(),
      email: emailInput || 'guest@example.com',
      displayName: 'Guest User',
      isAnonymous: true,
      emailVerified: false,
    } as any);
  };

  // Upgraders for RevenueCat sub simulation
  const handleUpgradeTier = (planName: "Free Tier" | "Resident Pro" | "Faculty Advisor") => {
    if (planName === "Free Tier") {
      const confirmDowngrade = window.confirm("Are you sure you want to contract your limits back to Free Tier?");
      if (!confirmDowngrade) return;
      onChangeProfile({
        ...profile,
        role: "student",
        subscriptionPlan: "Free Tier",
        subscriptionActive: false,
      });
      alert("Billing downgraded to Free Tier.");
    } else {
      setPendingPlan(planName);
      setIsPaywallOpen(true);
    }
  };

  // Simulate limit resets
  const handleResetUsage = () => {
    onChangeProfile({
      ...profile,
      casesCompleted: 0,
      assistantQueriesUsed: 0
    });
    alert("Simulated usage records reset back to 0. Excellent for testing limits!");
  };

  if (!firebaseUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-[#0A0C10] border border-slate-800 p-6 rounded-2xl shadow-2xl animate-fade-in text-slate-100 font-sans">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#050608] border border-slate-800 text-emerald-450 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 font-mono tracking-wider uppercase">OSCE Portal Gateway</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Sign in with Firebase to sync patient cases & assessments to the cloud.</p>
        </div>

        {/* Real Dynamic Google Clinical SSO Centered Action button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-450 text-[#050608] font-mono text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 cursor-pointer mb-6"
        >
          <Chrome className="w-4 h-4 text-[#050608]" /> Sign In with Google
        </button>

        {/* social and mock login dividers */}
        <div className="relative my-6 text-center">
          <hr className="border-slate-800" />
          <span className="bg-[#0A0C10] px-2.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 font-mono">
            Or Guest offline Mode
          </span>
        </div>

        {/* Credentials Form for Guests */}
        <form onSubmit={handleCredentialsAuth} className="flex flex-col gap-4 font-sans text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wide font-mono">Email (Guest simulation mode)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="email"
                placeholder="physician@hospital.org"
                className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wide font-mono">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 font-semibold focus:bg-slate-950 focus:border-emerald-500/50 text-slate-100 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#050608] border border-slate-800 hover:bg-slate-900 text-slate-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Explore as Offline Guest (No Cloud Sync)
          </button>
        </form>
      </div>
    );
  }

  // Calculate quota remaining
  const caseLimit = profile.subscriptionPlan === "Free Tier" ? 3 : profile.subscriptionPlan === "Resident Pro" ? 200 : 500;
  const assistantLimit = profile.subscriptionPlan === "Free Tier" ? 10 : 1000;
  
  const casePercentage = Math.min(((profile.casesCompleted / caseLimit) * 100), 100);
  const assistantPercentage = Math.min(((profile.assistantQueriesUsed / assistantLimit) * 100), 100);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-full">
      
      {/* Column Left: Visual Bio Avatar Card  (Spans 4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Bio */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 p-6 shadow-md flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img 
              src={firebaseUser?.photoURL || "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150&auto=format&fit=crop&q=80"} 
              alt={profile.firstName} 
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 shadow-lg"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1 right-1 bg-emerald-500 text-[#050608] rounded-full p-1 border-2 border-[#0A0C10] shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <h3 className="font-bold text-lg text-slate-100 leading-tight">
            {profile.firstName} {profile.lastName}
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mt-1">
            {profile.subscriptionPlan}
          </span>

          <div className="w-full mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              onClick={() => {
                if (isEditing) {
                  onChangeProfile({
                    ...profile,
                    firstName,
                    lastName,
                    email: emailInput
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="w-full py-2 bg-[#050608] border border-slate-800/80 hover:bg-slate-900 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all font-mono uppercase tracking-wider cursor-pointer"
            >
              {isEditing ? "Save Bio Settings" : "Edit Bio settings"}
            </button>

            <button
              onClick={logOutUser}
              className="w-full py-2 border border-rose-950 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" /> Sign Out Portal
            </button>
          </div>
        </div>

        {/* RevenueCat tier selector */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 p-5 shadow-md relative overflow-hidden">
          <h4 className="font-mono text-emerald-450 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-1">
            <CreditCard className="w-4 h-4" /> RevenueCat Plans
          </h4>
          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-semibold">
            Simulate RevenueCat payment hooks dynamically. Select billing level tiers to immediately adjust case limits:
          </p>

          <div className="flex flex-col gap-2 font-mono text-xs font-bold">
            <button
              onClick={() => handleUpgradeTier("Free Tier")}
              disabled={profile.subscriptionPlan === "Free Tier"}
              className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-all cursor-pointer ${
                profile.subscriptionPlan === "Free Tier"
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-850 hover:border-slate-800 bg-[#050608] hover:bg-slate-900 text-slate-400'
              }`}
            >
              <span>Basic Plan (Limits: 3 Short Cases)</span>
              <span className="text-[9px] bg-slate-800 px-1.5 rounded uppercase font-semibold text-slate-300">Free</span>
            </button>

            <button
              onClick={() => handleUpgradeTier("Resident Pro")}
              disabled={profile.subscriptionPlan === "Resident Pro"}
              className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-all cursor-pointer ${
                profile.subscriptionPlan === "Resident Pro"
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'border-slate-850 hover:border-slate-800 bg-[#050608] hover:bg-slate-900 text-slate-400'
              }`}
            >
              <span>Resident Pro (Limits: 200 OSCEs)</span>
              <span className="text-[9px] bg-emerald-500 px-1.5 rounded uppercase font-semibold text-slate-950 font-black">$9.99/mo</span>
            </button>

            <button
              onClick={() => handleUpgradeTier("Faculty Advisor")}
              disabled={profile.subscriptionPlan === "Faculty Advisor"}
              className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-all cursor-pointer ${
                profile.subscriptionPlan === "Faculty Advisor"
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'border-slate-850 hover:border-slate-800 bg-[#050608] hover:bg-slate-900 text-slate-400'
              }`}
            >
              <span>Faculty Advisor (Limits: 500 OSCEs)</span>
              <span className="text-[9px] bg-emerald-500 px-1.5 rounded uppercase font-semibold text-slate-950 font-black">$29.99/mo</span>
            </button>
          </div>
        </div>

        {/* Policies and Legal */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 p-5 shadow-md relative overflow-hidden">
          <h4 className="font-mono text-emerald-450 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-1">
            <FileText className="w-4 h-4" /> Legal & Policies
          </h4>
          <div className="flex flex-col gap-2 font-mono text-xs font-bold text-slate-400">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="flex items-center gap-2 p-2 hover:bg-slate-900 rounded-lg hover:text-slate-200 transition-colors cursor-pointer text-left w-full border border-transparent hover:border-slate-800"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500/70" />
              Privacy Policy
            </button>
            <button
              onClick={() => setIsReturnOpen(true)}
              className="flex items-center gap-2 p-2 hover:bg-slate-900 rounded-lg hover:text-slate-200 transition-colors cursor-pointer text-left w-full border border-transparent hover:border-slate-800"
            >
              <RefreshCcw className="w-4 h-4 shrink-0 text-emerald-500/70" />
              Return Policy
            </button>
            <a
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2 hover:bg-slate-900 rounded-lg hover:text-slate-200 transition-colors cursor-pointer text-left w-full border border-transparent hover:border-slate-800"
            >
              <FileText className="w-4 h-4 shrink-0 text-emerald-500/70" />
              Terms and Conditions
            </a>
          </div>
        </div>

      </div>

      {/* Column Right: Settings Details and Quotas (Spans 8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6 font-sans">
        
        {/* Limits & Quotas usage indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* OSCE Cases completed */}
          <div className="bg-[#0A0C10] border border-slate-800/65 rounded-xl p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-3 text-slate-400">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase">Simulated cases completed</span>
              <BarChart className="w-4 h-4 text-slate-500 animate-pulse" />
            </div>

            <div className="flex items-baseline gap-1 mt-auto font-mono">
              <span className="text-3xl font-black text-slate-100">{profile.casesCompleted}</span>
              <span className="text-xs text-slate-500">/ {caseLimit} OSCE cases limit</span>
            </div>

            {/* Quota bar */}
            <div className="w-full bg-[#050608] rounded-full h-2 mt-4 overflow-hidden border border-slate-900">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  casePercentage > 90 ? 'bg-rose-500' : casePercentage > 70 ? 'bg-amber-500' : 'bg-[#10B981]'
                }`}
                style={{ width: `${casePercentage}%` }}
              ></div>
            </div>

            {casePercentage >= 100 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-900/45">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Scenario compilation limit reached. Please scale subscription tier.
              </div>
            )}
          </div>

          {/* AI Reference queries used */}
          <div className="bg-[#0A0C10] border border-slate-800/65 rounded-xl p-5 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-3 text-slate-400">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase">Assistant searches used</span>
              <Settings2 className="w-4 h-4 text-slate-500" />
            </div>

            <div className="flex items-baseline gap-1 mt-auto font-mono">
              <span className="text-3xl font-black text-slate-100">{profile.assistantQueriesUsed}</span>
              <span className="text-xs text-slate-500">/ {assistantLimit} searches limit</span>
            </div>

            {/* Quota bar */}
            <div className="w-full bg-[#050608] rounded-full h-2 mt-4 overflow-hidden border border-slate-900">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  assistantPercentage > 90 ? 'bg-rose-500' : assistantPercentage > 70 ? 'bg-amber-500' : 'bg-[#10B981]'
                }`}
                style={{ width: `${assistantPercentage}%` }}
              ></div>
            </div>

            {assistantPercentage >= 100 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-900/45">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Reference search limit reached. Upgrade standard plan!
              </div>
            )}
          </div>

        </div>

        {/* Biometrics & account values fields editing */}
        <div className="bg-[#0A0C10] border border-slate-800/60 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="font-bold text-xs font-mono tracking-wider text-slate-400 uppercase">OSCE Portal Settings</h4>
            
            {/* Reset button purely for testing */}
            <button 
              onClick={handleResetUsage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-mono font-bold bg-[#050608] border border-slate-800 hover:border-slate-750 text-slate-300 rounded-lg active:scale-95 transition-all w-auto cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 shrink-0" /> Reset simulated quota metrics
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 text-xs font-semibold text-slate-300">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">First Name</label>
                <input
                  disabled={!isEditing}
                  className="p-2.5 bg-[#050608] border border-slate-800/80 rounded-lg disabled:opacity-60 focus:bg-slate-950 focus:border-emerald-500/50 outline-none font-bold text-slate-100"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">Last Name</label>
                <input
                  disabled={!isEditing}
                  className="p-2.5 bg-[#050608] border border-slate-800/80 rounded-lg disabled:opacity-60 focus:bg-slate-950 focus:border-emerald-500/50 outline-none font-bold text-slate-100"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold font-mono tracking-wide uppercase text-slate-500">Secure Hospital Email</label>
              <input
                disabled={!isEditing}
                className="p-2.5 bg-[#050608] border border-slate-800/80 rounded-lg disabled:opacity-60 focus:bg-[#050608] focus:border-emerald-500/50 outline-none font-bold text-slate-100"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

          </div>
        </div>

      </div>

      {isPaywallOpen && (
        <RevenueCatPaywall
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          selectedPlan={pendingPlan}
          profile={profile}
          onChangeProfile={onChangeProfile}
          userId={firebaseUser.uid}
        />
      )}

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <ReturnPolicyModal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} />

    </div>
  );
}
