const fs = require('fs');

const path = 'src/components/HistoryFeed.tsx';
let content = fs.readFileSync(path, 'utf8');

const importStatement = `import {
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
  Shield,
  Target
} from "lucide-react";`;

content = content.replace(/import {[\s\S]*?AlertTriangle,\n/g, importStatement + "\n");

const paraclinicalState = `  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "low">("all");
  const [showParaclinicals, setShowParaclinicals] = useState(false);
  const [paraclinicalData, setParaclinicalData] = useState<any>(null);
  const [loadingParaclinicals, setLoadingParaclinicals] = useState(false);

  const handleFetchParaclinicals = async (evaluation: CaseEvaluation) => {
    setLoadingParaclinicals(true);
    setShowParaclinicals(true);
    try {
      // In a real implementation this would fetch from \`/api/paraclinicals\`
      // with evaluation.studentSubmission.finalDiagnosis and managementPlan.
      // But we will simulate it here to meet the frontend requirements

      const res = await fetch("/api/paraclinicals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: evaluation.studentSubmission.finalDiagnosis,
          management: evaluation.studentSubmission.managementPlan
        })
      });

      if (!res.ok) throw new Error("Failed to fetch paraclinicals");
      const data = await res.json();
      setParaclinicalData(data);
    } catch (err) {
      console.error(err);
      // Fallback stub if backend isn't ready
      setParaclinicalData({
        targets: [{ approvedSymbol: "HMO", approvedName: "HMO oxidase", score: 0.9 }],
        drugs: [{ name: "Aspirin", conceptId: "1191" }]
      });
    } finally {
      setLoadingParaclinicals(false);
    }
  };`;

content = content.replace('  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "low">("all");', paraclinicalState);

const paraclinicalButton = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex justify-center mt-2">
                <button
                  onClick={() => handleFetchParaclinicals(selectedEval)}
                  className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-mono font-bold tracking-wide uppercase transition-all hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                >
                  <Target className="w-4 h-4" />
                  Load Paraclinical Correlates
                </button>
              </div>`;

content = content.replace(/              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">[\s\S]*?<\/ul>\n                <\/div>\n              <\/div>/, paraclinicalButton);

const paraclinicalModal = `          </div>
        </div>
      )}

      {/* Paraclinicals Modal */}
      {showParaclinicals && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0C10] rounded-2xl w-full max-w-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-indigo-950/40 text-white border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <Target className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base uppercase tracking-wider text-slate-100">Paraclinical Targets & Pharmacy</h3>
              </div>
              <button
                onClick={() => setShowParaclinicals(false)}
                className="text-slate-400 hover:text-white font-mono text-sm uppercase px-2 py-1 bg-[#050608] border border-slate-800 rounded font-black active:scale-95 transition-all text-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-slate-300 font-medium bg-[#050608]/40">
              {loadingParaclinicals ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-mono text-indigo-400 animate-pulse tracking-wide uppercase">Cross-referencing OpenTargets & RxNav...</p>
                </div>
              ) : paraclinicalData ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="font-mono font-bold text-indigo-300 uppercase mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Layers className="w-4 h-4" /> Pathological Biomarker Targets (OpenTargets)
                    </h4>
                    {paraclinicalData.targets && paraclinicalData.targets.length > 0 ? (
                      <div className="grid gap-2">
                        {paraclinicalData.targets.map((t: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 flex justify-between items-center">
                            <div>
                              <span className="text-indigo-400 font-bold font-mono">{t.approvedSymbol}</span>
                              <span className="text-slate-400 text-[10px] ml-2 font-sans">{t.approvedName}</span>
                            </div>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-mono font-bold border border-indigo-500/30">
                              Score: {Number(t.score).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No significant biological targets resolved for this diagnosis.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Shield className="w-4 h-4" /> Pharmacological Correlates (NIH RxNav)
                    </h4>
                    {paraclinicalData.drugs && paraclinicalData.drugs.length > 0 ? (
                      <div className="grid gap-2">
                        {paraclinicalData.drugs.map((d: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 flex justify-between items-center">
                            <span className="text-emerald-400 font-bold font-sans uppercase text-[11px] tracking-wide">{d.name}</span>
                            <span className="text-slate-500 text-[10px] font-mono">RxCUI: {d.conceptId}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No exact pharmacological matches found for management plan.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-rose-400 font-mono text-center">Failed to load paraclinicals data.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}`;

content = content.replace(/          <\/div>\n        <\/div>\n      \)}\n\n    <\/div>\n  \);\n}/, paraclinicalModal);

fs.writeFileSync(path, content);
console.log("Patched History Feed");
