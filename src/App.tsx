import { useState, useEffect } from "react";
import { UserProfile, CaseEvaluation } from "./types";
import { PRESEEDED_HISTORY } from "./casesData";
import SimulatorLab from "./components/SimulatorLab";
import ParaClinicalLab from "./components/ParaClinicalLab";
import ClinicalAssistant from "./components/ClinicalAssistant";
import HistoryFeed from "./components/HistoryFeed";
import UserProfileSettings from "./components/UserProfileSettings";
import { 
  auth, 
  getUserProfileDoc, 
  saveUserProfileDoc, 
  saveEvaluationDoc, 
  subscribeUserEvaluations 
} from "./lib/firebase";
import { 
  Heart, 
  Stethoscope, 
  FileCheck2, 
  History, 
  User, 
  Sparkles,
  Search,
  ClipboardList,
  AlertTriangle,
  Dna,
  ChevronRight
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { Purchases as PurchasesWeb } from "@revenuecat/purchases-js";
import { getApiUrl } from "./lib/api";

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<"lab" | "paraclinical" | "assistant" | "history" | "profile">("lab");

  // Global synchronized state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: "sarah.jenkins@hospital.org",
    firstName: "Sarah",
    lastName: "Jenkins",
    role: "pro", // Preset to PRO resident so they can fully explore without restriction of limits out-of-the-box!
    casesCompleted: 0,
    assistantQueriesUsed: 0,
    subscriptionActive: true,
    subscriptionPlan: "Resident Pro"
  });

  const [caseHistory, setCaseHistory] = useState<CaseEvaluation[]>(PRESEEDED_HISTORY);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Monitor Authentication and Sync Real-Time Database Collections
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      // Initialize RevenueCat for native applications and web with the correct User ID
      try {
        const res = await fetch(getApiUrl("/api/revenuecat/keys"));
        if (res.ok) {
          const keys = await res.json();
          const platform = Capacitor.getPlatform();
          const appUserId = firebaseUser?.uid || "web_guest_user";

          if (platform === "ios" && keys.iosKey) {
            await Purchases.configure({ apiKey: keys.iosKey, appUserID: appUserId });
          } else if (platform === "android" && keys.androidKey) {
            await Purchases.configure({ apiKey: keys.androidKey, appUserID: appUserId });
          } else if (platform === "web" && keys.webKey) {
            PurchasesWeb.configure(keys.webKey, appUserId);
          }
        }
      } catch (e) {
        console.error("Failed to initialize RevenueCat keys from backend", e);
      }

      setCurrentUser(firebaseUser);
      setIsAuthLoading(false);
      
      if (firebaseUser) {
        // Authenticated! Check/retrieve profile or initialize
        const profile = await getUserProfileDoc(firebaseUser.uid);
        if (profile) {
          setUserProfile(profile as UserProfile);
        } else {
          // Initialize a fresh persistent credentials profile in Firestore as Free Tier
          const displayName = firebaseUser.displayName || "";
          const nameParts = displayName.split(" ");
          const newProfile: UserProfile = {
            email: firebaseUser.email || "resident@hospital.org",
            firstName: nameParts[0] || "Resident",
            lastName: nameParts.slice(1).join(" ") || "Physician",
            role: "student",
            casesCompleted: 0,
            assistantQueriesUsed: 0,
            subscriptionActive: false,
            subscriptionPlan: "Free Tier"
          };
          await saveUserProfileDoc(firebaseUser.uid, newProfile);
          setUserProfile(newProfile);

          // Seed default preseeded histories into firestore collection
          for (const ev of PRESEEDED_HISTORY) {
            await saveEvaluationDoc(firebaseUser.uid, ev);
          }
        }

        // Real-Time board evaluations update listener
        const unsubscribeEvals = subscribeUserEvaluations(firebaseUser.uid, (evals) => {
          if (evals && evals.length > 0) {
            setCaseHistory(evals as CaseEvaluation[]);
          } else {
            setCaseHistory([]);
          }
        });

        return () => {
          unsubscribeEvals();
        };
      } else {
        // Offline / Guest Fallback State (Starts as student / Free Tier)
        setUserProfile({
          email: "sarah.jenkins@hospital.org",
          firstName: "Sarah",
          lastName: "Jenkins",
          role: "student",
          casesCompleted: 0,
          assistantQueriesUsed: 0,
          subscriptionActive: false,
          subscriptionPlan: "Free Tier"
        });
        setCaseHistory(PRESEEDED_HISTORY);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update profile handler supporting Firestore sync
  const handleUpdateProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    if (auth.currentUser) {
      await saveUserProfileDoc(auth.currentUser.uid, updated);
    }
  };

  // Quota limits check handlers
  const handleCompleteCase = async (evaluation: CaseEvaluation) => {
    const isFree = userProfile.subscriptionPlan === "Free Tier";

    if (auth.currentUser) {
      // Only persist to database if the user is upgraded
      if (!isFree) {
        await saveEvaluationDoc(auth.currentUser.uid, evaluation);
      }
      const updatedProfile: UserProfile = {
        ...userProfile,
        casesCompleted: userProfile.casesCompleted + 1
      };
      await saveUserProfileDoc(auth.currentUser.uid, updatedProfile);
      setUserProfile(updatedProfile);
    } else {
      // Memory state only for guests (non-Free Tier)
      if (!isFree) {
        setCaseHistory((prev) => [evaluation, ...prev]);
      }
      setUserProfile((prev) => ({
        ...prev,
        casesCompleted: prev.casesCompleted + 1
      }));
    }

    if (isFree) {
      alert("OSCE Evaluation complete! Note: On the Free Tier, evaluations are NOT saved to the database. Upgrade to Resident Pro to save evaluations to your persistent OSCE logs.");
    }
  };

  const decreaseAvailableCases = (): boolean => {
    const caseLimit = userProfile.subscriptionPlan === "Free Tier" ? 3 : userProfile.subscriptionPlan === "Resident Pro" ? 200 : 500;
    if (userProfile.casesCompleted >= caseLimit) {
      return false; // Gated!
    }
    return true;
  };

  const decreaseAssistantQueries = (): boolean => {
    const queryLimit = userProfile.subscriptionPlan === "Free Tier" ? 10 : 1000;
    if (userProfile.assistantQueriesUsed >= queryLimit) {
      return false; // Gated!
    }
    const updatedProfile: UserProfile = {
      ...userProfile,
      assistantQueriesUsed: userProfile.assistantQueriesUsed + 1
    };
    setUserProfile(updatedProfile);
    if (auth.currentUser) {
      saveUserProfileDoc(auth.currentUser.uid, updatedProfile);
    }
    return true;
  };



  return (
    <div className="bg-[#050608] min-h-screen w-full text-slate-100 antialiased font-sans flex flex-col md:flex-row pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 selection:bg-emerald-500/30">
      
      {/* 1. TOP BAR Shell: Mobile-only */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-[#0A0C10] border-b border-slate-800/60 h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-4 z-50 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="w-5 h-5 text-emerald-400" />
          <h1 className="font-bold text-sm tracking-widest uppercase text-emerald-400">MediXpark</h1>
        </div>
      </header>

      {/* 2. SIDE PANEL COLUMN: Desktop-only */}
      <nav className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0A0C10] text-slate-300 border-r border-slate-800/50 z-40 p-5">
        
        {/* Core Branding */}
        <div className="mb-10 flex items-center gap-3 px-1">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-450 shrink-0">
            <Stethoscope className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-white text-base leading-tight font-mono tracking-wide">MEDIXPARK</h2>
            <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest font-black block">AI OSCE Simulator</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex flex-col gap-1.5 flex-grow">
          <button
            onClick={() => setActiveTab("lab")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all ${
              activeTab === "lab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/45"
            }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            Simulator Lab
          </button>

          <button
            onClick={() => setActiveTab("paraclinical")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all ${
              activeTab === "paraclinical"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/45"
            }`}
          >
            <Dna className="w-4 h-4 shrink-0" />
            <span className="hidden md:block">Para-Clinical</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 md:group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => setActiveTab("assistant")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all ${
              activeTab === "assistant"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/45"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Decision Bot
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all ${
              activeTab === "history"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/45"
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            Encounts History
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all ${
              activeTab === "profile"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/45"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            User Settings
          </button>
        </div>



      </nav>

      {/* 3. MAIN CONTENT LAYER Panel (Offsets Desktop Sidebar) */}
      <main className="flex-grow md:ml-64 flex flex-col min-h-screen pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0 min-w-0">
        
        {/* Core Header Banner breadcrumb */}
        <div className="hidden md:flex justify-between items-center bg-[#0A0C10] border-b border-slate-800/50 p-6 shadow-md shrink-0">
          <div>
            <h2 className="font-extrabold text-white text-lg leading-tight first-letter:uppercase">
              {activeTab === "lab" ? "🩺 OSCE Clinical Simulation Lab" : activeTab === "paraclinical" ? "🧬 Para-Clinical Target Science" : activeTab === "assistant" ? "🧠 Decision Support Guidance" : activeTab === "history" ? "📂 Simulated Encounter Archive" : "⚙️ Clinical Settings & Credentials"}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {activeTab === "lab" ? "High-fidelity clinical exam training powered by active AI orchestration." : activeTab === "paraclinical" ? "Deep foundational science integration matching case paradigms." : activeTab === "assistant" ? "Evidence-based guidelines, medication references and differential diagnostic checklists." : activeTab === "history" ? "Review structured board examiner comments, clinical feedback and scoring catalogs." : "Verify credentials usage boundaries, limits and active plans."}
            </p>
          </div>

          <div className="flex gap-2.5 items-center font-mono text-xs font-bold text-slate-400">
            {currentUser ? (
              <span className="px-3.5 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center gap-1.5 text-[10px] uppercase text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.08)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span> DB Synced: {currentUser.email}
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/30 flex items-center gap-1.5 text-[10px] uppercase text-amber-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span> Guest offline mode
              </span>
            )}
            <span className="px-3.5 py-1.5 bg-[#050608] rounded-full border border-slate-800/60 flex items-center gap-1.5 text-[10px] uppercase text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.08)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span> System Live Standard
            </span>
          </div>
        </div>

        {/* Main Canvas view area */}
        <div className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
          <div className={activeTab === "lab" ? "block" : "hidden"}>
            <SimulatorLab 
              onEvaluationCompleted={handleCompleteCase}
              userProfile={userProfile}
              decreaseAvailableCases={decreaseAvailableCases}
              onUpgrade={() => setActiveTab("profile")}
            />
          </div>

          <div className={activeTab === "paraclinical" ? "block" : "hidden"}>
            <ParaClinicalLab
              onEvaluationCompleted={handleCompleteCase}
              userProfile={userProfile}
              decreaseAvailableCases={decreaseAvailableCases}
              onUpgrade={() => setActiveTab("profile")}
            />
          </div>

          <div className={activeTab === "assistant" ? "block" : "hidden"}>
            <ClinicalAssistant 
              decreaseAssistantQueries={decreaseAssistantQueries}
              userProfile={userProfile}
            />
          </div>

          <div className={activeTab === "history" ? "block" : "hidden"}>
            <HistoryFeed 
              evaluations={caseHistory} 
              userProfile={userProfile}
              onUpgrade={() => setActiveTab("profile")}
            />
          </div>

          <div className={activeTab === "profile" ? "block" : "hidden"}>
            <UserProfileSettings 
              profile={userProfile} 
              onChangeProfile={handleUpdateProfile}
              onLoginSuccess={() => setActiveTab("lab")}
            />
          </div>
        </div>

      </main>

      {/* 4. BOTTOM NAVIGATION TRAY Bar: Mobile-only */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-[#0A0C10] border-t border-slate-800/60 p-1 flex justify-around items-center text-xs font-mono uppercase tracking-wider font-bold z-50 shadow-lg text-slate-500 rounded-t-xl overflow-hidden">
        <button
          onClick={() => setActiveTab("lab")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-[10px] font-bold ${
            activeTab === "lab" ? "text-[#10B981] bg-emerald-500/5 font-extrabold" : "text-slate-500"
          }`}
        >
          <Stethoscope className="w-4 h-4 mb-0.5 shrink-0" />
          <span>Lab</span>
        </button>

        <button
          onClick={() => setActiveTab("paraclinical")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-[10px] font-bold ${
            activeTab === "paraclinical" ? "text-indigo-400 bg-indigo-500/5 font-extrabold" : "text-slate-500"
          }`}
        >
          <Dna className="w-4 h-4 mb-0.5 shrink-0" />
          <span>Science</span>
        </button>

        <button
          onClick={() => setActiveTab("assistant")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-[10px] font-bold ${
            activeTab === "assistant" ? "text-[#10B981] bg-emerald-500/5 font-extrabold" : "text-slate-500"
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 shrink-0" />
          <span>Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-[10px] font-bold ${
            activeTab === "history" ? "text-[#10B981] bg-emerald-500/5 font-extrabold" : "text-slate-500"
          }`}
        >
          <History className="w-4 h-4 mb-0.5 shrink-0" />
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-[10px] font-bold ${
            activeTab === "profile" ? "text-emerald-400 bg-emerald-500/5 font-extrabold" : "text-slate-500"
          }`}
        >
          <User className="w-4 h-4 mb-0.5 shrink-0" />
          <span>Profile</span>
        </button>
      </nav>

    </div>
  );
}
