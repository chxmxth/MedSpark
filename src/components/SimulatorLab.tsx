import { useState, useEffect, useRef } from "react";
import { PatientCase, Message, CaseEvaluation } from "../types";
import { PRESET_CASES } from "../casesData";
import { getApiUrl } from "../lib/api";
import VitalsWaveform from "./VitalsWaveform";
import { 
  Heart, 
  Activity, 
  Zap, 
  TrendingUp, 
  Clipboard, 
  Send, 
  Search, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  RotateCcw,
  Lock,
  ShieldAlert,
  Mic,
  MicOff
} from "lucide-react";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

interface LabProps {
  onEvaluationCompleted: (evaluation: CaseEvaluation) => void;
  userProfile: any;
  decreaseAvailableCases: () => boolean;
  onUpgrade: () => void;
}

export default function SimulatorLab({ onEvaluationCompleted, userProfile, decreaseAvailableCases, onUpgrade }: LabProps) {
  // Scenario Selection state
  const [casesList, setCasesList] = useState<PatientCase[]>(PRESET_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("john-doe-65");
  const caseData = casesList.find(c => c.id === selectedCaseId) || casesList[0];
  const [isHpiExpanded, setIsHpiExpanded] = useState(false);

  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [generationType, setGenerationType] = useState<"short" | "long" | null>(null);

  const handleGenerateRandomCase = async (type: "short" | "long") => {
    if (isGeneratingCase) return;

    const isFree = userProfile && userProfile.subscriptionPlan === "Free Tier";

    if (type === "long" && isFree) {
      alert("OSCE Long Cases are blocked entirely on the Free Tier! Please upgrade to Resident Pro or Faculty Advisor Plan in the Settings panel to simulate comprehensive Long Cases.");
      onUpgrade();
      return;
    }

    // Check plan limits first
    const isOk = decreaseAvailableCases();
    if (!isOk) {
      alert("Scenario Limit Reached! Your Free Tier is gated to 3 cases. Please upgrade to Resident Pro inside the Settings panel to simulate up to 200 cases!");
      onUpgrade();
      return;
    }

    setIsGeneratingCase(true);
    setGenerationType(type);

    try {
      const resp = await fetch(getApiUrl("/api/cases/generate-random"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to generate dynamic case");
      }

      const newCase: PatientCase = await resp.json();
      
      // Update case list reactively
      setCasesList(prev => [newCase, ...prev]);
      setSelectedCaseId(newCase.id);
    } catch (err: any) {
      console.error(err);
      alert(`UMLS Concept Retrieval can fail during transient timeouts. Error: ${err.message || "Ensure server is running."}`);
    } finally {
      setIsGeneratingCase(false);
      setGenerationType(null);
    }
  };

  // Chat conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [inputMessage, setInputMessage] = useState("");
  const [isPatientTyping, setIsPatientTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);

  // Diagnostic states
  const [orderedDiagnostics, setOrderedDiagnostics] = useState<{ [key: string]: "pending" | "completed" }>({});
  const [loadingDiagnostic, setLoadingDiagnostic] = useState<string | null>(null);
  const [selectedDiagnosticData, setSelectedDiagnosticData] = useState<{ title: string; text: string } | null>(null);

  // Physical Exam State
  const [showPhysicalExamResults, setShowPhysicalExamResults] = useState(false);

  // Board Submission Form States
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [historyFindings, setHistoryFindings] = useState("");
  const [physicalFindings, setPhysicalFindings] = useState("");
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState("");
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [managementPlan, setManagementPlan] = useState("");

  // Scored Board result state
  const [evaluationResult, setEvaluationResult] = useState<CaseEvaluation | null>(null);

  // Restart scenario
  useEffect(() => {
    // Reset scenario-specific states
    setMessages([
      {
        id: "greet-1",
        sender: "system",
        text: `OSCE Scenario: "${caseData.complaint}" has started. Introduce yourself to the patient and begin taking their clinical history.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setOrderedDiagnostics({});
    setLoadingDiagnostic(null);
    setSelectedDiagnosticData(null);
    setShowPhysicalExamResults(false);
    setEvaluationResult(null);
    setIsHpiExpanded(false);

    // Form states reset
    setHistoryFindings("");
    setPhysicalFindings("");
    setDifferentialDiagnosis("");
    setFinalDiagnosis("");
    setManagementPlan("");
  }, [selectedCaseId]);

  // Scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPatientTyping]);

  // Suggestive questions to speed up user flow on desktop/mobile
  const questionSuggestions = [
    "Tell me about your breathing difficulty.",
    "Do you have any chest pain?",
    "Do you take any medications?",
    "When did these symptoms first start?",
    "Do you have any swelling in your body?"
  ];

  const startListening = async () => {
    try {
      const { speechRecognition } = await SpeechRecognition.checkPermissions();
      if (speechRecognition !== 'granted') {
        const req = await SpeechRecognition.requestPermissions();
        if (req.speechRecognition !== 'granted') {
          alert('Speech recognition permission denied.');
          return;
        }
      }

      setIsListening(true);
      await SpeechRecognition.start({
        language: "en-US",
        maxResults: 1,
        prompt: "Say something",
        partialResults: false,
        popup: false,
      });

      SpeechRecognition.addListener('partialResults', (data: any) => {
        if (data.matches && data.matches.length > 0) {
          setInputMessage(data.matches[0]);
          setIsListening(false);
          handleSendChat(data.matches[0]);
          SpeechRecognition.removeAllListeners();
        }
      });
    } catch (e) {
      console.error(e);
      alert("Speech recognition is not available or failed.");
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await SpeechRecognition.stop();
      setIsListening(false);
      SpeechRecognition.removeAllListeners();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle typing send
  const handleSendChat = async (textToSend?: string) => {
    const rawText = textToSend || inputMessage;
    if (!rawText.trim() || isPatientTyping) return;

    // Stop listening if it was active
    if (isListening) {
        stopListening();
    }

    // Build message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsPatientTyping(true);

    try {
      const response = await fetch(getApiUrl("/api/patient/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseContext: caseData,
          messages: messagesRef.current,
          latestMessage: rawText,
        }),
      });

      const data = await response.json();
      const patientResponse: Message = {
        id: `msg-reply-${Date.now()}`,
        sender: "patient",
        text: data.text || "I am feeling too fatigued to speak clearly now, Doctor...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, patientResponse]);

      try {
        await TextToSpeech.speak({
          text: patientResponse.text,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
        startListening();
      } catch(ttsError) {
        console.error("TTS error:", ttsError);
      }
    } catch (err) {
      console.error(err);
      const errResponse: Message = {
        id: `msg-reply-${Date.now()}`,
        sender: "patient",
        text: "I didn't hear you clearly... direct breathing is quite hard right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errResponse]);

      try {
        await TextToSpeech.speak({
          text: errResponse.text,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
        startListening();
      } catch(ttsError) {
        console.error("TTS error:", ttsError);
      }
    } finally {
      setIsPatientTyping(false);
    }
  };

  // Perform physical examination tool
  const triggerPhysicalExam = () => {
    setShowPhysicalExamResults(true);
    const examMsg: Message = {
      id: `exam-${Date.now()}`,
      sender: "system",
      text: `PHYSICAL EXAMINATION: ${caseData.physicalExamPrompt}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, examMsg]);
  };

  // Order diagnostics laboratory/imaging
  const handleOrderDiagnostic = (type: string, name: string) => {
    if (orderedDiagnostics[type]) {
      // Already simulated. Just show again.
      showLabReportPanel(type, name);
      return;
    }

    setLoadingDiagnostic(type);
    setTimeout(() => {
      setOrderedDiagnostics(prev => ({ ...prev, [type]: "completed" }));
      setLoadingDiagnostic(null);
      showLabReportPanel(type, name);

      // Add notification to chat feed
      setMessages(prev => [
        ...prev,
        {
          id: `diag-ready-${Date.now()}`,
          sender: "system",
          text: `DIAGNOSTIC REPORT ACTIVE: "${name}" ordered and completed. Click to view detailed analysis report.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }, 1500); // 1.5 second high-fidelity simulation analysis wait
  };

  const showLabReportPanel = (type: string, name: string) => {
    let text = "";
    if (type === "fbc") text = caseData.labs.fbc;
    else if (type === "ue") text = caseData.labs.ue;
    else if (type === "lft") text = caseData.labs.lft;
    else if (type === "troponin") text = caseData.labs.troponin;
    else if (type === "cxr") text = caseData.imaging.cxr;
    else if (type === "ct") text = caseData.imaging.ct;
    else if (type === "ecg") text = caseData.ecgDescription;

    setSelectedDiagnosticData({ title: name, text });
  };

  // Submit Evaluation to clinical Board
  const triggerFormSubmission = async () => {
    // Check if limits exceeded
    const isOk = decreaseAvailableCases();
    if (!isOk) {
      alert("Scenario Limit Reached! Your Free Tier is gated to 3 cases. Please change tier to PRO in the Profile panel to simulate unlimited cases!");
      return;
    }

    setIsSubmittingForm(true);
    try {
      const response = await fetch(getApiUrl("/api/board/evaluate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseContext: caseData,
          submission: {
            historyFindings,
            physicalFindings,
            differentialDiagnosis,
            finalDiagnosis,
            managementPlan,
          }
        }),
      });

      const grade = await response.json();
      const finalEval: CaseEvaluation = {
        id: `eval-${Date.now()}`,
        caseId: caseData.id,
        caseName: caseData.complaint,
        patientName: caseData.name,
        studentSubmission: {
          historyFindings,
          physicalFindings,
          differentialDiagnosis,
          finalDiagnosis,
          managementPlan
        },
        aiFeedback: {
          overallFeedback: grade.overallFeedback || "Evaluation processed fully.",
          historyRating: grade.historyRating || 4,
          examRating: grade.examRating || 4,
          diagnosticRating: grade.diagnosticRating || 4,
          managementRating: grade.managementRating || 4,
          strengths: grade.strengths || ["Cohesive medical overview"],
          weaknesses: grade.weaknesses || ["Could refine therapy sequence"]
        },
        score: grade.score || 80,
        createdAt: new Date().toISOString()
      };

      setEvaluationResult(finalEval);
      onEvaluationCompleted(finalEval);
      setShowFormModal(false);
    } catch (err) {
      console.error(err);
      alert("Error contacting the OSCE AI Board. Check server logs.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Vitals Warnings Flags based on case data thresholds
  const heartRateHigh = caseData.vitals.heartRate > 100;
  const bpHigh = parseInt(caseData.vitals.bloodPressure.split("/")[0]) > 140;
  const spo2Dangerous = caseData.vitals.oxygenSat < 90;
  const respRateHigh = caseData.vitals.respRate > 20;

  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-full xl:min-w-0">
      {/* LEFT SIDE: Clinical Case Dashboard (Vitals, ECG Monitors) */}
      <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6">
        
        {/* Scenario Selection Selector */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 p-4 shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-center pb-1 border-b border-slate-900">
            <label className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">Select Practice Case</label>
            <span className="text-[9px] text-[#10B981] font-bold font-mono uppercase bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/25">
              10k+ UMLS Cases
            </span>
          </div>
          
          <select 
            className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:outline-none transition-all cursor-pointer"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
          >
            {casesList.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-[#0A0C10] text-slate-200">
                {preset.id.startsWith("umls-") ? "🧬 [UMLS] " : ""} {preset.name} - {preset.complaint} ({preset.gender}, {preset.age})
              </option>
            ))}
          </select>

          {/* Random UMLS Case Generation Buttons */}
          <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-slate-900/60">
            <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">Generate Random UMLS Case:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                disabled={isGeneratingCase}
                onClick={() => handleGenerateRandomCase("short")}
                className="py-2 px-3 border border-slate-800 bg-[#050608] hover:bg-slate-900 text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wide rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                {isGeneratingCase && generationType === "short" ? (
                  <span className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
                Short Case
              </button>

              {userProfile && userProfile.subscriptionPlan === "Free Tier" ? (
                <button
                  onClick={() => handleGenerateRandomCase("long")}
                  className="py-2 px-3 border border-rose-950/45 bg-rose-950/15 hover:bg-rose-900/10 text-rose-350 font-mono font-bold uppercase text-[10px] tracking-wide rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-450 animate-pulse" />
                  Long [Locked]
                </button>
              ) : (
                <button
                  disabled={isGeneratingCase}
                  onClick={() => handleGenerateRandomCase("long")}
                  className="py-2 px-3 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-emerald-400 font-mono font-bold uppercase text-[10px] tracking-wide rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer hover:border-emerald-500/30"
                >
                  {isGeneratingCase && generationType === "long" ? (
                    <span className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  )}
                  Long Case
                </button>
              )}
            </div>
            
            {isGeneratingCase && (
              <p className="text-[9px] text-amber-500/95 font-mono animate-pulse text-center mt-1">
                Querying UTS Metathesaurus & compiling AI patient profile...
              </p>
            )}
          </div>
        </div>

        {/* Patient Portrait Display */}
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 shadow-md overflow-hidden flex flex-col">
          <div className="bg-slate-950/40 p-4 flex items-center gap-4 border-b border-slate-800/50">
            <img 
              src={caseData.avatar} 
              alt={caseData.name} 
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-700/65 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{caseData.name}, {caseData.age}{caseData.gender}</h3>
              <span className="text-[10px] text-rose-450 font-bold uppercase tracking-wider font-mono">{caseData.complaint}</span>
            </div>
          </div>
          <div className="p-4 bg-slate-950/20">
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
        </div>

        {/* Vitals Signs High Density Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* HR */}
          <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all shadow-md ${
            heartRateHigh ? 'bg-red-950/20 border-red-500/40 text-red-100' : 'bg-[#0A0C10] border-slate-800/60 text-slate-100'
          }`}>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase">Pulse</span>
              <Heart className={`w-4 h-4 ${heartRateHigh ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight">{caseData.vitals.heartRate}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400">bpm</span>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all shadow-md ${
            bpHigh ? 'bg-amber-950/20 border-amber-500/40 text-amber-100' : 'bg-[#0A0C10] border-slate-800/60 text-slate-100'
          }`}>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase font-black">BP</span>
              <Activity className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tracking-tight">{caseData.vitals.bloodPressure}</span>
              <span className="text-[9px] font-mono text-slate-400">mmHg</span>
            </div>
          </div>

          {/* SpO2 */}
          <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all shadow-md ${
            spo2Dangerous ? 'bg-red-950/20 border-rose-500/40 text-red-100' : 'bg-[#0A0C10] border-slate-800/60 text-slate-100'
          }`}>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase">SpO2</span>
              <TrendingUp className={`w-4 h-4 ${spo2Dangerous ? 'text-rose-500 animate-bounce' : 'text-slate-500'}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight">{caseData.vitals.oxygenSat}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400">%</span>
            </div>
          </div>

          {/* RR */}
          <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all shadow-md ${
            respRateHigh ? 'bg-red-950/20 border-red-500/40 text-red-100' : 'bg-[#0A0C10] border-slate-800/60 text-slate-100'
          }`}>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase">RESP</span>
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight">{caseData.vitals.respRate}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400">/min</span>
            </div>
          </div>
        </div>

        {/* Real-Time Waveform Graph Monitors */}
        <VitalsWaveform heartRate={caseData.vitals.heartRate} breathingRate={caseData.vitals.respRate} />

      </div>

      {/* CENTER: Simulated Conversation Console & Submissions */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#0A0C10] border border-slate-800/60 rounded-xl shadow-lg overflow-hidden min-h-[580px]">
        {/* Interaction Header */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wide">Clinical History Interview</h3>
          </div>
          <button 
            onClick={() => {
              setMessages([
                {
                  id: "greet-1",
                  sender: "system",
                  text: `Simulation restarted. Introduce yourself and consult ${caseData.name} about their presenting condition.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-emerald-400 active:scale-95 transition-all font-mono uppercase border border-transparent hover:border-slate-800 rounded-lg hover:bg-slate-900/50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart Session
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-grow p-4 md:p-6 overflow-y-auto max-h-[350px] flex flex-col gap-4 bg-[#050608]">
          {messages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="self-center bg-emerald-555 bg-emerald-500/5 rounded-lg px-4 py-2 border border-emerald-500/20 max-w-[90%] text-center shadow-md">
                  <p className="text-[11px] text-emerald-400 font-mono flex items-center justify-center gap-1.5 leading-relaxed">
                    <Clipboard className="w-3 h-3 text-emerald-555 text-emerald-400" />
                    {msg.text}
                  </p>
                </div>
              );
            }

            const isUser = msg.sender === "user";
            return (
              <div 
                key={msg.id} 
                className={`self-${isUser ? 'end' : 'start'} max-w-[85%] flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {!isUser && (
                  <img 
                    src={caseData.avatar} 
                    alt="Patient Profile" 
                    className="w-7 h-7 rounded-full object-cover shadow-xs border border-slate-800 mt-1"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className={`p-3.5 rounded-2xl shadow-sm leading-relaxed text-sm ${
                  isUser 
                    ? 'bg-emerald-500/10 text-emerald-100 border-l-2 border-emerald-500 rounded-tr-xs' 
                    : 'bg-slate-900/40 border border-slate-800 text-slate-200 rounded-tl-xs'
                }`}>
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })}

          {isPatientTyping && (
            <div className="self-start flex gap-2.5 items-center">
              <img 
                src={caseData.avatar} 
                alt="Patient Profile" 
                className="w-7 h-7 rounded-full object-cover shadow-xs border border-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="bg-slate-900/30 border border-slate-800/80 p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-100"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-200"></span>
                {caseData.name} is speaking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Prompts Row */}
        <div className="p-3 border-t border-slate-800/60 bg-[#0A0C10] overflow-x-auto flex gap-2 whitespace-nowrap scrollbar-none scroll-smooth shrink-0">
          {questionSuggestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(q)}
              className="px-3.5 py-1.5 bg-slate-900/60 hover:bg-emerald-500/10 border border-slate-800/80 hover:border-emerald-500/30 rounded-full text-xs font-bold text-slate-300 active:scale-95 transition-all text-left font-mono"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Floating Glassmorphic Input panel */}
        <div className="p-4 border-t border-slate-800/60 bg-[#0A0C10] shrink-0">
          <div className="relative flex items-center gap-2">
            <textarea
              className="flex-grow bg-[#050608] border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-[#050608] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none resize-none max-h-32 min-h-[46px] scrollbar-none"
              placeholder={`Ask ${caseData.name} about symptoms, triggers, medications, or medical history...`}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
            />
            <button
              onClick={toggleListening}
              className={`p-3 border rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center font-bold ${
                isListening
                  ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => handleSendChat()}
              disabled={isPatientTyping || !inputMessage.trim()}
              className="p-3 bg-emerald-600 border border-emerald-700 hover:bg-emerald-555 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-900 disabled:border-slate-800/60 disabled:text-slate-600 text-slate-950 hover:text-slate-950 disabled:shadow-none rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0 flex items-center justify-center font-bold"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

        {/* Action Panel: Tooling and Diagnostic Testing */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={triggerPhysicalExam}
              className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                showPhysicalExamResults 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Perform Physical Exam
            </button>

            {/* Diagnostic trigger drop buttons */}
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none shrink-0">
              {[
                { type: "fbc", label: "FBC" },
                { type: "ue", label: "U&Es" },
                { type: "lft", label: "LFTs" },
                { type: "troponin", label: "Troponin" },
                { type: "cxr", label: "Chest X-Ray" },
                { type: "ct", label: "CTPA" },
              ].map((lab) => {
                const status = orderedDiagnostics[lab.type];
                return (
                  <button
                    key={lab.type}
                    onClick={() => handleOrderDiagnostic(lab.type, lab.label)}
                    disabled={loadingDiagnostic !== null}
                    className={`px-2.5 py-2 text-[10px] font-bold font-mono uppercase rounded-lg border transition-all active:scale-95 flex items-center gap-1 shadow-md shrink-0 ${
                      status === "completed"
                        ? "bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.1)]"
                        : loadingDiagnostic === lab.type
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold"
                        : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {loadingDiagnostic === lab.type ? "⚙️..." : lab.label}
                    {status === "completed" && <span className="text-[8px] bg-sky-200/20 px-1 rounded text-sky-300">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => setShowFormModal(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 font-mono active:scale-95 transition-all text-[#050608] text-xs font-black uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center gap-1.5"
          >
            <Clipboard className="w-3.5 h-3.5" /> Submit OSCE Evaluation
          </button>
        </div>

        {/* Dynamic Display of diagnostic reports */}
        {selectedDiagnosticData && (
          <div className="p-4 bg-sky-950/25 border-t border-slate-800/80 relative">
            <button 
              onClick={() => setSelectedDiagnosticData(null)}
              className="absolute top-2.5 right-3 text-sky-400 hover:text-sky-200 font-bold text-xs font-mono"
            >
              ✕ Hide
            </button>
            <h4 className="text-xs font-bold font-mono tracking-wider text-sky-300 uppercase flex items-center gap-1 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              {selectedDiagnosticData.title} Diagnostic Findings
            </h4>
            <div className="text-xs text-sky-100 font-medium bg-[#050608] p-3 rounded-lg border border-slate-800 shadow-md leading-relaxed whitespace-pre-wrap">
              {selectedDiagnosticData.text}
            </div>
          </div>
        )}

      </div>

      {/* Structured Evaluation Results Panel modal overlay (If active) */}
      {evaluationResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0C10] rounded-2xl w-full max-w-2xl border border-slate-800/80 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-base font-mono tracking-wide uppercase">OSCE Clinical Board Evaluator Feedback</h3>
              </div>
              <button 
                onClick={() => setEvaluationResult(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close Report
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Score Meter Banner */}
              <div className="flex flex-col md:flex-row items-center gap-6 bg-[#050608] p-6 rounded-xl border border-slate-800 shadow-inner">
                {/* Visual scorecard */}
                <div className="relative flex items-center justify-center shrink-0 w-28 h-28 bg-[#0A0C10] rounded-full border border-slate-800 shadow-lg text-white">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Score</span>
                    <span className={`text-4xl font-extrabold font-mono ${evaluationResult.score >= 80 ? 'text-emerald-400' : evaluationResult.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {evaluationResult.score}/100
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-300 font-mono tracking-wider text-xs uppercase mb-1">Chief Examiners Overall Feedback</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                    {evaluationResult.aiFeedback.overallFeedback}
                  </p>
                </div>
              </div>

              {/* Sub-Ratings Matrix */}
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono mb-3">OSCE Core Competencies Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950/35 rounded-lg border border-slate-800/80 flex flex-col items-center text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide font-black">History-Taking</span>
                    <span className="text-lg font-extrabold text-white mt-1">{evaluationResult.aiFeedback.historyRating}/5</span>
                  </div>
                  <div className="p-3 bg-slate-950/35 rounded-lg border border-slate-800/80 flex flex-col items-center text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide font-black">Physical exam</span>
                    <span className="text-lg font-extrabold text-white mt-1">{evaluationResult.aiFeedback.examRating}/5</span>
                  </div>
                  <div className="p-3 bg-slate-950/35 rounded-lg border border-slate-800/80 flex flex-col items-center text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide font-black">Diagnostics</span>
                    <span className="text-lg font-extrabold text-white mt-1">{evaluationResult.aiFeedback.diagnosticRating}/5</span>
                  </div>
                  <div className="p-3 bg-slate-950/35 rounded-lg border border-slate-800/80 flex flex-col items-center text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide font-black">Management</span>
                    <span className="text-lg font-extrabold text-white mt-1">{evaluationResult.aiFeedback.managementRating}/5</span>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses Bullets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-950/15 rounded-xl border border-emerald-900/30">
                  <h5 className="text-xs font-bold uppercase text-emerald-300 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Key Strengths Demonstrated
                  </h5>
                  <ul className="text-xs list-disc list-inside text-emerald-100/90 space-y-2 font-medium leading-relaxed">
                    {evaluationResult.aiFeedback.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-rose-950/15 rounded-xl border border-rose-900/30">
                  <h5 className="text-xs font-bold uppercase text-rose-300 flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-450 text-rose-400" />
                    Crucial Omissions / Mistakes
                  </h5>
                  <ul className="text-xs list-disc list-inside text-rose-100/90 space-y-2 font-medium leading-relaxed">
                    {evaluationResult.aiFeedback.weaknesses.map((weak, i) => (
                      <li key={i}>{weak}</li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800/90 flex justify-end">
              <button 
                onClick={() => setEvaluationResult(null)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 font-mono text-xs font-black text-[#050608] uppercase active:scale-95 transition-all text-center rounded-lg shadow-md"
              >
                Accept Grade & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Submit Entry Form Modal overlay */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0C10] rounded-2xl w-full max-w-xl border border-slate-800/80 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/90 text-white border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="font-bold text-base font-mono uppercase tracking-wider">Board Submission Evaluator Form</h3>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs font-sans">
              <p className="text-slate-400 font-medium leading-relaxed">
                Document your findings carefully. This is submitted to the AI board of examiners for assessment. Evaluate critical safety, therapeutic prioritizations, and correct final diagnosis.
              </p>

              {/* History */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">1. Critical History taking Findings</label>
                <textarea
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 focus:outline-none placeholder:text-slate-600 leading-relaxed font-semibold"
                  placeholder="Example: Chest pain, orthopnea, ankle swelling, smoker..."
                  rows={2}
                  value={historyFindings}
                  onChange={(e) => setHistoryFindings(e.target.value)}
                />
              </div>

              {/* Physical findings */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">2. Key Physical Examination Findings</label>
                <textarea
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 focus:outline-none placeholder:text-slate-600 leading-relaxed font-semibold"
                  placeholder="Example: Elevated JVP, basal wet crackles, warm lower extremities..."
                  rows={2}
                  value={physicalFindings}
                  onChange={(e) => setPhysicalFindings(e.target.value)}
                />
              </div>

              {/* Differentials */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">3. Differential Diagnoses List</label>
                <textarea
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 focus:outline-none placeholder:text-slate-600 leading-relaxed font-semibold"
                  placeholder="Example: 1. Heart Failure, 2. COPD Exacerbation, 3. Pulmonary Embolism..."
                  rows={2}
                  value={differentialDiagnosis}
                  onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                />
              </div>

              {/* Final Diagnosis */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">4. Working Final Diagnosis</label>
                <input
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 focus:outline-none placeholder:text-slate-600 font-semibold text-xs"
                  placeholder="Example: Acute Decompensated Congestive Heart Failure"
                  value={finalDiagnosis}
                  onChange={(e) => setFinalDiagnosis(e.target.value)}
                />
              </div>

              {/* Management */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold font-mono tracking-wide uppercase text-slate-500">5. Management and Treatment Plan</label>
                <textarea
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 focus:outline-none placeholder:text-slate-600 leading-relaxed font-semibold"
                  placeholder="Example: High flow oxygen, IV Furosemide, ECG, Troponin, fluid chart restrict..."
                  rows={3}
                  value={managementPlan}
                  onChange={(e) => setManagementPlan(e.target.value)}
                />
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800/90 flex justify-between items-center">
              <button 
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 border border-slate-800 text-slate-400 font-mono uppercase text-xs rounded-lg active:scale-95 transition-all text-center hover:bg-slate-900"
              >
                Cancel
              </button>

              <button 
                onClick={triggerFormSubmission}
                disabled={isSubmittingForm || !finalDiagnosis.trim()}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-450 disabled:bg-slate-900 disabled:border-slate-800/60 disabled:text-slate-600 font-mono text-xs font-black uppercase text-[#050608] tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0 flex items-center justify-center gap-1.5"
              >
                {isSubmittingForm ? "Grading Case..." : "Verify & Submit Form"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
