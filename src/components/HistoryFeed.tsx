import { useState } from "react";
import { CaseEvaluation } from "../types";
import { 
  Award, 
  Layers, 
  Calendar, 
  ChevronRight, 
  Search, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Clipboard,
  Sliders,
  Filter,
  Lock,
  Shield
} from "lucide-react";

interface HistoryProps {
  evaluations: CaseEvaluation[];
  userProfile: any;
  onUpgrade: () => void;
}

export default function HistoryFeed({ evaluations, userProfile, onUpgrade }: HistoryProps) {
  const [selectedEval, setSelectedEval] = useState<CaseEvaluation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "low">("all");

  const isFree = userProfile && userProfile.subscriptionPlan === "Free Tier";

  if (isFree) {
    return (
      <div className="bg-[#0A0C10] border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center text-center py-16 animate-fade-in max-w-2xl mx-auto gap-6">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/40 rounded-full flex items-center justify-center text-rose-450 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <Lock className="w-8 h-8 animate-pulse text-rose-500" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-100 font-mono tracking-wider uppercase mb-2">Simulated Encounter Log Locked</h3>
          <p className="text-xs text-rose-450 font-bold font-mono tracking-widest uppercase mb-4">Premium Subscription Required</p>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed font-semibold">
            Your historical clinical OSCE encounters, diagnostic boards feedback reports, and board scoring portfolios are archived under our secure cloud servers. Archive history logs are only unlocked for upgraded medical clinicians.
          </p>
        </div>

        <div className="w-full bg-[#050608] border border-slate-850 p-5 rounded-xl text-left font-mono text-[11px] text-slate-400 flex flex-col gap-2.5">
          <div className="font-bold text-slate-350 border-b border-slate-900 pb-1.5 flex items-center gap-1.5 uppercase">
            <Shield className="w-3.5 h-3.5 text-emerald-450" /> Premium OSCE Capabilities:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rose-500 font-black">❌</span>
            <span>Local & cloud persistent DB collections save</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rose-500 font-black">❌</span>
            <span>Auto-graded AI detailed scorecard review modal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rose-500 font-black">❌</span>
            <span>Historical clinic performance average tracking analytics</span>
          </div>
        </div>

        <button 
          onClick={onUpgrade}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <span>Upgrade to Resident Pro ($9.99/mo)</span>
        </button>
      </div>
    );
  }

  // Filter evaluations list
  const filteredEvals = evaluations.filter((item) => {
    const matchesSearch = 
      item.caseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (scoreFilter === "high") return matchesSearch && item.score >= 80;
    if (scoreFilter === "low") return matchesSearch && item.score < 60;
    return matchesSearch;
  });

  // Calculate average stats
  const totalScore = evaluations.reduce((sum, item) => sum + item.score, 0);
  const avgScore = evaluations.length > 0 ? Math.round(totalScore / evaluations.length) : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search and Filters Header */}
      <div className="bg-[#0A0C10] border border-slate-800/60 p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#050608] border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs font-semibold placeholder:text-slate-500 focus:bg-[#050608] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none text-slate-100"
            placeholder="Search completed cases or patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wider">Score filter</span>
          <select
            className="bg-[#050608] border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-300 outline-none focus:border-emerald-500/50 cursor-pointer"
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as any)}
          >
            <option value="all" className="bg-[#0A0C10]">All Grades</option>
            <option value="high" className="bg-[#0A0C10]">Outstanding (80+)</option>
            <option value="low" className="bg-[#0A0C10]">Safety Risk (Under 60)</option>
          </select>
        </div>
      </div>

      {/* Bento style KPI dashboard header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI: Case Average */}
        <div className="bg-[#0A0C10] border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-500 uppercase">Average Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-100 font-mono">{avgScore}</span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-450 flex items-center gap-1 mt-1">
              ✦ Stable Performance Rate
            </span>
          </div>
          <Award className="w-10 h-10 text-slate-600 shrink-0 opacity-40 animate-pulse" />
        </div>

        {/* KPI: Cases Done */}
        <div className="bg-[#0A0C10] border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-500 uppercase">Cases Audited</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-100 font-mono">{evaluations.length}</span>
              <span className="text-xs font-mono text-slate-500">OSCEs</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-1">
              ✓ Fully documented
            </span>
          </div>
          <Layers className="w-10 h-10 text-slate-600 shrink-0 opacity-40" />
        </div>

        {/* KPI: Pass rate warnings */}
        <div className="bg-[#0A0C10] border border-slate-800/60 p-5 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#10B981] uppercase">Pro Status</span>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl font-black text-white uppercase tracking-tight font-mono">Active Plan</span>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 leading-relaxed">
              Unlimited active simulations
            </span>
          </div>
          <Sparkles className="w-10 h-10 text-emerald-400 shrink-0 opacity-80" />
        </div>

      </div>

      {/* Historical Logs List */}
      <div className="bg-[#0A0C10] border border-slate-800/60 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <h4 className="font-bold text-xs font-mono tracking-wider text-slate-400 uppercase">Recent OSCE Encounters list</h4>
        </div>

        {filteredEvals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold font-mono uppercase bg-[#050608]">
            No historical clinical evaluations available matching query filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 bg-[#050608]/40">
            {filteredEvals.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedEval(item)}
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[#050608]/80 cursor-pointer active:bg-slate-950/90 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg shrink-0 border ${
                    item.score >= 85 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : item.score >= 60 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                  }`}>
                    <Clipboard className="w-5 h-5" />
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors font-mono tracking-tight leading-tight">
                      {item.caseName}
                    </h5>
                    <div className="flex items-center gap-2.5 text-[10px] font-bold font-mono tracking-wide text-slate-550 text-slate-500 mt-1 uppercase">
                      <span>Patient: {item.patientName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto ml-14 md:ml-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">OSCE Score</span>
                    <span className={`text-base font-extrabold font-mono ${
                      item.score >= 80 ? 'text-emerald-450' : item.score >= 60 ? 'text-amber-400' : 'text-rose-450'
                    }`}>
                      {item.score}/100
                    </span>
                  </div>

                  <span className="px-2.5 py-1.5 bg-[#050608] border border-slate-800/80 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 transition-all">
                    Review Board report <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal detailed reports */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0C10] rounded-2xl w-full max-w-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/60 text-white border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-base uppercase tracking-wider text-slate-100">Board OSCE Audit Report</h3>
              </div>
              <button 
                onClick={() => setSelectedEval(null)}
                className="text-slate-400 hover:text-white font-mono text-sm uppercase px-2 py-1 bg-[#050608] border border-slate-800 rounded font-black active:scale-95 transition-all text-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-slate-300 font-medium bg-[#050608]/40">
              
              {/* Grading banner scale */}
              <div className="p-4 bg-[#050608] border border-slate-800/95 rounded-xl flex items-center gap-4 shadow-inner">
                <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest">Score</span>
                  <span className={`text-2xl font-black font-mono ${selectedEval.score >= 80 ? 'text-emerald-400' : selectedEval.score >= 60 ? 'text-amber-400' : 'text-rose-450'}`}>
                    {selectedEval.score}/100
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 uppercase tracking-wide font-mono mb-1 text-xs">Chief Examiners Feedback Verdict</h4>
                  <p className="leading-relaxed leading-medium text-slate-400">{selectedEval.aiFeedback.overallFeedback}</p>
                </div>
              </div>

              {/* Sub competency logs */}
              <div className="grid grid-cols-4 gap-2 font-mono text-center">
                <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">History</span>
                  <span className="font-extrabold text-slate-200">{selectedEval.aiFeedback.historyRating}/5</span>
                </div>
                <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Physical</span>
                  <span className="font-extrabold text-slate-200">{selectedEval.aiFeedback.examRating}/5</span>
                </div>
                <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Diagnostics</span>
                  <span className="font-extrabold text-slate-200">{selectedEval.aiFeedback.diagnosticRating}/5</span>
                </div>
                <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Therapy</span>
                  <span className="font-extrabold text-slate-200">{selectedEval.aiFeedback.managementRating}/5</span>
                </div>
              </div>

              {/* Strengths & omissions list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <span className="font-bold text-emerald-400 uppercase flex items-center gap-1 mb-2 font-mono font-bold tracking-wide">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Strengths Demonstrations
                  </span>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 font-semibold leading-relaxed">
                    {selectedEval.aiFeedback.strengths.map((str, idx) => (
                      <li key={idx} className="marker:text-emerald-450">{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <span className="font-bold text-rose-400 uppercase flex items-center gap-1 mb-2 font-mono font-bold tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Omissions & Criticisms
                  </span>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 font-semibold leading-relaxed">
                    {selectedEval.aiFeedback.weaknesses.map((weak, idx) => (
                      <li key={idx} className="marker:text-rose-450">{weak}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Student documentation records */}
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="p-3 bg-slate-950/40 text-slate-300 border-b border-slate-800 font-mono tracking-wider font-bold uppercase text-[10px]">
                  STUDENT CASE CLINICAL DOCUMENTATION
                </div>
                <div className="divide-y divide-slate-800/80 bg-[#050608]/80 text-slate-300 leading-relaxed">
                  
                  <div className="p-3.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1 font-mono">1. History taking Findings</span>
                    <p className="text-slate-300 leading-medium font-semibold">{selectedEval.studentSubmission.historyFindings}</p>
                  </div>

                  <div className="p-3.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1 font-mono text-slate-500">2. Physical exam Findings</span>
                    <p className="text-slate-300 leading-medium font-semibold">{selectedEval.studentSubmission.physicalFindings}</p>
                  </div>

                  <div className="p-3.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-450 block mb-1 font-mono text-slate-500">3. Differential Diagnoses List</span>
                    <p className="text-slate-300 leading-medium font-semibold">{selectedEval.studentSubmission.differentialDiagnosis}</p>
                  </div>

                  <div className="p-3.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1 font-mono text-slate-500">4. Working Final Diagnosis</span>
                    <p className="text-emerald-400 font-extrabold font-mono tracking-tight leading-medium text-sm">{selectedEval.studentSubmission.finalDiagnosis}</p>
                  </div>

                  <div className="p-3.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1 font-mono text-slate-500">5. Therapeutic Management Plan</span>
                    <p className="text-slate-300 leading-medium font-semibold">{selectedEval.studentSubmission.managementPlan}</p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
