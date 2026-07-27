import { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { getApiUrl } from "../lib/api";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  BookOpen, 
  Check, 
  Copy, 
  HelpCircle,
  FileText,
  Activity,
  Heart
} from "lucide-react";

interface AssistantProps {
  hasAssistantQueries: () => boolean;
  userProfile: any;
}

export default function ClinicalAssistant({ hasAssistantQueries, userProfile }: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "assist-start",
      sender: "assistant",
      text: "Clinical Assistant initialized. Ready to query pediatric or adult clinical guidelines, normal reference ranges, or assist with forming differential diagnoses for complex presentations. What are we researching today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotResponding]);

  const handleSendQuery = async (prePrompt?: string) => {
    const rawQuery = prePrompt || inputText;
    if (!rawQuery.trim() || isBotResponding) return;

    // Check usage query limits
    const isOk = hasAssistantQueries();
    if (!isOk) {
      alert("AI Query limit reached on your current Free Tier (10 queries/mo)! Upgrade to Resident Pro or Faculty Advisor Plan inside the Settings panel to unlock up to 1,000 queries.");
      return;
    }

    const userMsg: Message = {
      id: `assist-msg-${Date.now()}`,
      sender: "user",
      text: rawQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!prePrompt) setInputText("");
    setIsBotResponding(true);

    try {
      const response = await fetch(getApiUrl("/api/assistant/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawQuery,
          chatHistory: messages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch from the server.");
      }

      const botMsg: Message = {
        id: `assist-msg-reply-${Date.now()}`,
        sender: "assistant",
        text: data.text || "No active medical references retrieved. Check connection structure.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: `assist-msg-err-${Date.now()}`,
        sender: "assistant",
        text: err.message || "Error querying server-side Guidelines agent. Please confirm that your environment variables are set in Settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsBotResponding(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  // Preset clinical research helpers
  const helperFabs = [
    { label: "Check ACLS Guidelines", prompt: "Summarize the latest standard ACLS clinical algorithms step-by-step for Adult Tachycardia and VF/Pulseless VT cardiac arrest." },
    { label: "Lab Reference Ranges", prompt: "Please provide a standard reference table for full blood count (FBC), Urea and Electrolytes (U&Es), and Liver Function Tests (LFTs) with SI units." },
    { label: "Differential DX for CP", prompt: "Generate a complete structured differential diagnostic list for acute central chest pain, divided into cardiac, pulmonary, gastrointestinal, and musculoskeletal causes." },
    { label: "NICE Stroke Guidelines", prompt: "What are the latest NICE guidelines regarding thrombolysis and thrombectomy windows in acute stroke suspect presentations?" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-full">
      
      {/* LEFT SIDE: Evidence Resource Shortcut Cards */}
      <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-4">
        <div className="bg-[#0A0C10] rounded-xl border border-slate-800/60 p-4 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-emerald-450 text-emerald-455" />
            <h4 className="font-bold font-mono tracking-wider text-xs uppercase text-white">Research shortcuts</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed font-semibold">
            Select an evidence-based clinical preset prompt to compile updated standards directly from medical guidelines:
          </p>

          <div className="flex flex-col gap-2">
            {helperFabs.map((fab, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendQuery(fab.prompt)}
                disabled={isBotResponding}
                className="w-full text-left p-3 bg-[#050608] hover:bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-lg text-xs font-semibold text-slate-300 transition-all active:scale-[0.98] cursor-pointer"
              >
                {fab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="bg-[#050608] rounded-xl border border-slate-800 p-4 text-white shadow-inner">
          <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-450 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Double Check Guidelines
          </h5>
          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
            This Assistant evaluates clinical papers and references. Standard clinical judgements should always be validated locally against specific local center protocol.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Chats Console */}
      <div className="flex-grow flex flex-col bg-[#0A0C10] border border-slate-800/60 rounded-xl shadow-lg min-h-[500px]">
        {/* Header */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-450 animate-spin" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wide">Evidence Guidelines Chatbot</h3>
          </div>
          <button
            onClick={() => setMessages([
              {
                id: "assist-start",
                sender: "assistant",
                text: "Session cleared. What clinical guideline or blood lab reference ranges are we checking?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ])}
            className="flex items-center gap-1 text-xs text-rose-450 hover:text-rose-450 uppercase font-mono border border-transparent hover:border-slate-800 hover:bg-slate-900 rounded-lg p-2 active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        </div>

        {userProfile && userProfile.subscriptionPlan === "Free Tier" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[10px] text-amber-300 font-bold font-mono animate-fade-in shrink-0 gap-1.5">
            <span className="flex items-center gap-1.5">
              ⚠️ FREE PLAN ENFORCED — GATED TO 10 ASSISTANT QUERIES/MO (USED: {userProfile.assistantQueriesUsed}/10)
            </span>
            <span className="text-slate-400 font-semibold font-sans">Upgrade to Resident Pro or Faculty to get 1,000 queries</span>
          </div>
        )}

        {/* Conversation flow */}
        <div className="flex-grow p-4 md:p-6 overflow-y-auto max-h-[380px] flex flex-col gap-4 bg-[#050608]">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col self-${isUser ? 'end' : 'start'} max-w-[90%] gap-1.5`}
              >
                <div className={`p-4 rounded-2xl shadow-sm leading-relaxed text-sm ${
                  isUser 
                    ? 'bg-emerald-500/10 text-emerald-100 border-l-2 border-emerald-500 rounded-tr-xs font-semibold' 
                    : 'bg-slate-900/40 border border-slate-800 text-slate-200 rounded-tl-xs whitespace-pre-line'
                }`}>
                  <p>{msg.text}</p>
                  
                  {/* Action controls inside assistant reply */}
                  {!isUser && msg.id !== "assist-start" && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#050608] hover:bg-slate-900 text-slate-300 font-mono text-[10px] rounded border border-slate-800 active:scale-95 transition-all uppercase"
                      >
                        {copiedTextId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" /> Copy Summary
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-mono font-medium text-slate-500 self-${isUser ? 'end' : 'start'} px-1`}>
                  {isUser ? "You" : "Advisor Assistant"} • {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isBotResponding && (
            <div className="self-start flex gap-2 items-center bg-slate-950/40 border border-slate-800 p-4 rounded-2xl rounded-tl-xs shadow-md text-xs text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-450 animate-pulse animate-spin" />
              Searching references and compiling guidelines...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/60 bg-[#0A0C10]">
          <div className="relative flex items-center gap-2">
            <textarea
              className="flex-grow bg-[#050608] border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-100 placeholder:text-slate-550 placeholder:text-slate-500 focus:bg-[#050608] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none resize-none max-h-32 min-h-[46px] scrollbar-none font-semibold text-xs"
              placeholder="Ask guidelines, references or search definitions..."
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuery();
                }
              }}
            />
            <button 
              onClick={() => handleSendQuery()}
              disabled={isBotResponding || !inputText.trim()}
              className="p-3 bg-emerald-600 border border-emerald-700 hover:bg-emerald-555 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-900 disabled:border-slate-800/60 disabled:text-slate-700 text-[#050608] rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0 flex items-center justify-center font-bold"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
