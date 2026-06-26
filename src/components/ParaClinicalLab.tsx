import { useState } from "react";
import { PatientCase, CaseEvaluation } from "../types";
import { PRESET_CASES } from "../casesData";
import { getApiUrl } from "../lib/api";
import { getParaClinicalQuestion } from "../lib/paraClinicalUtils";
import {
  Heart, Zap, Database, Search, FileText, Sparkles, AlertTriangle,
  Target, Layers, Send, ChevronRight, CheckCircle, ShieldAlert
} from "lucide-react";

interface ParaClinicalLabProps {
  onEvaluationCompleted: (evaluation: CaseEvaluation) => void;
  userProfile: any;
  decreaseAvailableCases: () => boolean;
  onUpgrade: () => void;
}

export default function ParaClinicalLab({
  onEvaluationCompleted,
  userProfile,
  decreaseAvailableCases,
  onUpgrade
}: ParaClinicalLabProps) {
  const [casesList, setCasesList] = useState<PatientCase[]>(PRESET_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("john-doe-65");
  const caseData = casesList.find(c => c.id === selectedCaseId) || casesList[0];

  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [pendingGenerationType, setPendingGenerationType] = useState<"short" | "long" | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Q&A State
  const [questions, setQuestions] = useState<Array<{ id: string, question: string, answer: string }>>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const [isHpiExpanded, setIsHpiExpanded] = useState(false);

  const handleOpenSourceModal = (type: "short" | "long") => {
    const isFree = userProfile && userProfile.subscriptionPlan === "Free Tier";
    if (type === "long" && isFree) {
      alert("Long Cases are blocked entirely on the Free Tier! Please upgrade.");
      onUpgrade();
      return;
    }
    setPendingGenerationType(type);
    setShowCustomInput(false);
    setCustomTopicInput("");
    setShowSourceModal(true);
  };

  const handleGenerateTopicCase = async (type: "short" | "long", topic: string) => {
    if (isGeneratingCase) return;
    const isFree = userProfile && userProfile.subscriptionPlan === "Free Tier";

    if (type === "long" && isFree) {
      alert("Long Cases are blocked entirely on the Free Tier! Please upgrade.");
      onUpgrade();
      return;
    }

    const isOk = decreaseAvailableCases();
    if (!isOk) {
      alert("Scenario Limit Reached! Please upgrade to simulate up to 200 cases.");
      onUpgrade();
      return;
    }

    setIsGeneratingCase(true);
    try {
      const payload = { type, topic };
      const response = await fetch(getApiUrl("api/cases/generate-topic"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const generatedCase: PatientCase = await response.json();
      setCasesList(prev => [generatedCase, ...prev]);
      setSelectedCaseId(generatedCase.id);
      setQuestions([]); // reset questions on new case
    } catch (err) {
      console.error("Failed to generate case:", err);
      alert("Failed to generate case from backend. Trying fallback...");
      handleGenerateRandomCase(type);
    } finally {
      setIsGeneratingCase(false);
      setShowSourceModal(false);
    }
  };

  const handleGenerateRandomCase = async (type: "short" | "long") => {
    try {
      const response = await fetch(getApiUrl("api/cases/generate-random"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (!response.ok) throw new Error("Failed to generate random case");
      const generatedCase: PatientCase = await response.json();
      setCasesList(prev => [generatedCase, ...prev]);
      setSelectedCaseId(generatedCase.id);
      setQuestions([]);
    } catch (err) {
      alert("Could not generate case. Please check server connection.");
    }
  };

  // Add a new question to the Q&A section
  const handleAddQuestion = () => {
    const qText = getParaClinicalQuestion(userProfile, customTopic);
    setQuestions(prev => [
      ...prev,
      { id: Date.now().toString(), question: qText, answer: "" }
    ]);
    setCustomTopic("");
  };

  const handleAnswerChange = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer: text } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSubmitEvaluation = () => {
    if (questions.length === 0) {
      alert("Please add and answer at least one para-clinical question.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call for mock evaluation
    setTimeout(() => {
      const rating = Math.floor(Math.random() * 2) + 3; // 3-4 out of 5
      const mockResult = {
        overallFeedback: "Good application of foundational science to the clinical presentation. You accurately identified major targets but lacked some specificity on pathological pathways.",
        rating: rating,
        strengths: ["identified core biomarker", "linked mechanisms to symptoms"],
        weaknesses: ["broad pharmacological mechanisms", "lacked dosage-specific rationale"]
      };

      setEvaluationResult(mockResult);
      setIsSubmitting(false);

      // We need to construct a CaseEvaluation object to push it to the history
      // since ParaClinicalLab handles questions rather than a standard submission, we can map it.
      const evaluationToSave: CaseEvaluation = {
        id: `eval-${Date.now()}`,
        caseName: caseData.name,
        caseId: caseData.id,
        patientName: caseData.name,
        studentSubmission: {
          historyFindings: "N/A (Evaluated in ParaClinical Lab)",
          physicalFindings: "N/A (Evaluated in ParaClinical Lab)",
          differentialDiagnosis: "N/A",
          finalDiagnosis: caseData.correctAnswers?.finalDiagnosis || "Unspecified",
          managementPlan: caseData.correctAnswers?.management?.join(", ") || "Unspecified"
        },
        aiFeedback: {
          overallFeedback: "This case was evaluated purely on foundational ParaClinical sciences rather than standard clinical OSCE competencies.",
          historyRating: 0,
          examRating: 0,
          diagnosticRating: 0,
          managementRating: 0,
          strengths: ["Focused on biological pathways"],
          weaknesses: []
        },
        paraClinicalSubmission: questions.map(q => ({ question: q.question, answer: q.answer })),
        paraClinicalFeedback: mockResult,
        score: Math.floor((mockResult.rating / 5) * 100),
        createdAt: new Date().toISOString()
      };
      onEvaluationCompleted(evaluationToSave);

      // Create evaluation object
      const sub = questions.map(q => ({ question: q.question, answer: q.answer }));
      const newScore = Math.floor((rating / 5) * 100);

      const newEval: CaseEvaluation = {
        id: `eval-${Date.now()}`,
        caseName: caseData.name,
        caseId: caseData.id,
        patientName: caseData.name,
        studentSubmission: {
          historyFindings: "[Para-clinical assessment]",
          physicalFindings: "[Para-clinical assessment]",
          differentialDiagnosis: "[Para-clinical assessment]",
          finalDiagnosis: caseData.correctAnswers.finalDiagnosis,
          managementPlan: "[Para-clinical assessment]"
        },
        aiFeedback: {
          overallFeedback: mockResult.overallFeedback,
          historyRating: 0,
          examRating: 0,
          diagnosticRating: 0,
          managementRating: 0,
          strengths: mockResult.strengths,
          weaknesses: mockResult.weaknesses
        },
        paraClinicalSubmission: sub,
        paraClinicalFeedback: mockResult,
        score: newScore,
        createdAt: new Date().toISOString()
      };

      onEvaluationCompleted(newEval);
    }, 1500);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-full xl:min-w-0">
      {/* LEFT SIDE: Case Dashboard */}
      <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6">

        {/* Case Selector */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 p-4 shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-center pb-1 border-b border-slate-900">
            <label className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">Select Practice Case</label>
            <span className="text-[9px] text-[#10B981] font-bold font-mono uppercase bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/25">
              10k+ UMLS Cases
            </span>
          </div>
          <select
            className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:outline-none cursor-pointer"
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setQuestions([]);
            }}
          >
            {casesList.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-[#0A0C10] text-slate-200">
                {preset.id.startsWith("umls-") ? "🧬 [UMLS] " : ""} {preset.name} - {preset.complaint}
              </option>
            ))}
          </select>

          {/* Generate Case Buttons */}
          <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-slate-900/60">
            <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">Generate Dynamic Case:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                disabled={isGeneratingCase}
                onClick={() => handleOpenSourceModal("short")}
                className="py-2 px-3 border border-slate-800 bg-[#050608] hover:bg-slate-900 text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wide rounded-lg disabled:opacity-50 flex justify-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" /> OSCE SHORT
              </button>
              <button
                disabled={isGeneratingCase}
                onClick={() => handleOpenSourceModal("long")}
                className="py-2 px-3 border border-slate-800 bg-[#050608] hover:bg-slate-900 text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wide rounded-lg disabled:opacity-50 flex justify-center gap-1 cursor-pointer"
              >
                <Database className="w-3 h-3 text-sky-400" /> OSCE LONG
              </button>
            </div>
          </div>
        </div>

        {/* Selected Case Info */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 overflow-hidden shadow-md">
          <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex items-center gap-4">
            <img src={caseData.avatar} alt="Patient" className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover" />
            <div>
              <h3 className="text-white font-bold text-base leading-tight">{caseData.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{caseData.age}yo {caseData.gender === 'M' ? 'Male' : 'Female'}</p>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <div className="bg-[#050608] border border-slate-800 p-3 rounded-lg flex gap-3 items-center">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-0.5">Chief Complaint</p>
                <p className="text-rose-100 text-xs font-bold leading-tight">{caseData.complaint}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Para-clinical Assessment */}
      <div className="flex-grow flex flex-col gap-4 bg-[#0A0C10] rounded-xl border border-slate-800 shadow-xl overflow-hidden min-h-[600px]">

        <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-200 uppercase font-mono tracking-wider text-sm">Para-Clinical Targets & Science</h3>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-6">

          {/* Chief Complaint Presenting History Display */}
          <div className="bg-[#050608] border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-1.5 gap-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase font-mono">Chief Complaint Presenting History</h4>
              <button
                onClick={() => setIsHpiExpanded(!isHpiExpanded)}
                className="text-[9px] font-mono uppercase bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded transition-all active:scale-95 cursor-pointer flex items-center shrink-0"
              >
                {isHpiExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
            <p
              onClick={() => setIsHpiExpanded(!isHpiExpanded)}
              className={`text-xs text-slate-350 leading-relaxed cursor-pointer transition-all duration-300 ${
                isHpiExpanded ? "" : "line-clamp-3 md:hover:line-clamp-none"
              }`}
            >
              {caseData.historyOfPresentIllness}
            </p>
            {!isHpiExpanded && (
              <div
                onClick={() => setIsHpiExpanded(true)}
                className="text-[9px] text-slate-500 italic mt-1.5 cursor-pointer hover:text-slate-400 select-none text-center"
              >
                Click / Tap to view full history
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/80 my-2"></div>

          {/* Q&A Section */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-slate-200 uppercase font-mono tracking-wider text-xs">Pre-Clinical Assessment</h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Custom Topic (e.g. Pathology, Microbiology) or leave blank"
                className="flex-grow bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500/50 outline-none"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
              />
              <button
                onClick={handleAddQuestion}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs px-4 rounded-lg font-bold uppercase transition-colors"
              >
                Ask Question
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 relative">
                  <button onClick={() => removeQuestion(q.id)} className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs">✕</button>
                  <p className="text-sm text-indigo-300 font-bold font-mono">Q{idx + 1}: {q.question}</p>
                  <textarea
                    rows={4}
                    className="w-full bg-[#050608] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 resize-none focus:outline-none focus:border-indigo-500/50"
                    placeholder="Enter your para-clinical rationale..."
                    value={q.answer}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center p-8 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg bg-[#050608]/50">
                  Generate a question to begin foundational science evaluation.
                </div>
              )}
            </div>

            {questions.length > 0 && !evaluationResult && (
              <button
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting}
                className="mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold uppercase rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Evaluating Response...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Para-Clinical Board
                  </>
                )}
              </button>
            )}

            {evaluationResult && (
               <div className="mt-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6">
                 <h3 className="text-emerald-400 font-mono font-bold uppercase mb-4 flex items-center gap-2">
                   <CheckCircle className="w-5 h-5" /> Evaluation Complete
                 </h3>
                 <p className="text-slate-300 text-sm mb-4 leading-relaxed">{evaluationResult.overallFeedback}</p>
                 <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                   <div>
                     <span className="text-emerald-300 font-bold uppercase">Strengths</span>
                     <ul className="list-disc pl-4 mt-1 text-slate-400">
                       {evaluationResult.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                     </ul>
                   </div>
                   <div>
                     <span className="text-rose-300 font-bold uppercase">Weaknesses</span>
                     <ul className="list-disc pl-4 mt-1 text-slate-400">
                       {evaluationResult.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                     </ul>
                   </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                   <span className="text-xs font-mono font-bold text-slate-500">
                     Score: <span className="text-white text-lg ml-1">{Math.floor((evaluationResult.rating/5)*100)}%</span>
                   </span>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Case Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0C10] rounded-2xl w-full max-w-sm border border-slate-800/80 shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950/90 text-white border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm font-mono uppercase tracking-wider">Select Case Source</h3>
              </div>
              <button onClick={() => setShowSourceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {!showCustomInput ? (
                <>
                  <button onClick={() => handleGenerateRandomCase(pendingGenerationType || "short")} className="w-full flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/20 text-indigo-400 transition-all font-mono">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-sm uppercase tracking-wide">UMLS Random Path</span>
                      <span className="text-[10px] text-slate-400 normal-case font-sans font-medium text-left">Generate a completely random complex case.</span>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0 opacity-50" />
                  </button>
                  <button onClick={() => setShowCustomInput(true)} className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 text-emerald-400 transition-all font-mono">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-sm uppercase tracking-wide">Custom Clinical Topic</span>
                      <span className="text-[10px] text-slate-400 normal-case font-sans font-medium text-left">Target specific disease parameters.</span>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0 opacity-50" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide">Input Specific Topic</label>
                    <input type="text" autoFocus value={customTopicInput} onChange={(e) => setCustomTopicInput(e.target.value)} placeholder="e.g. Acute Pancreatitis, DKA..." className="w-full bg-[#050608] border border-emerald-500/40 rounded-lg p-3 text-sm text-emerald-400 font-bold focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCustomInput(false)} className="flex-1 py-3 text-xs font-mono font-bold text-slate-400 border border-slate-800 rounded-lg">Back</button>
                    <button disabled={!customTopicInput.trim() || isGeneratingCase} onClick={() => handleGenerateTopicCase(pendingGenerationType || "short", customTopicInput)} className="flex-[2] py-3 text-xs font-mono font-bold text-[#050608] bg-emerald-500 disabled:opacity-50 rounded-lg">Generate Concept</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
