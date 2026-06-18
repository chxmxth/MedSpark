const fs = require('fs');

const path = 'src/components/SimulatorLab.tsx';
let content = fs.readFileSync(path, 'utf8');

const handleGenerateTopicCase = `  const handleGenerateTopicCase = async (type: "short" | "long", topic: string) => {
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
      // Create endpoint payload
      const payload = { type, topic };

      const response = await fetch(getApiUrl("api/cases/generate-topic"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(\`Server returned \${response.status}\`);
      }

      const generatedCase: PatientCase = await response.json();

      // Inject the generated case into the active list and select it
      setCasesList(prev => [generatedCase, ...prev]);
      setSelectedCaseId(generatedCase.id);

    } catch (err) {
      console.error("Failed to generate topic case:", err);
      alert("Failed to generate case from the backend AI service. It may be overloaded. Trying fallback generator...");
      handleGenerateRandomCase(type); // Fallback to random case generator
    } finally {
      setIsGeneratingCase(false);
      setGenerationType(null);
    }
  };

  const handleGenerateRandomCase`;

content = content.replace('  const handleGenerateRandomCase', handleGenerateTopicCase);

const caseGenerationButtons = `
          {/* Custom Topic Case Generation */}
          {(userProfile?.topics && userProfile.topics.length > 0) && (
            <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-slate-900/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider">Generate Custom Topic Case:</span>
              <div className="grid grid-cols-1 gap-2 text-xs mb-2">
                <select
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:outline-none transition-all cursor-pointer"
                  id="topic-selector"
                >
                  {userProfile.topics.map((topic, i) => (
                    <option key={i} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  disabled={isGeneratingCase}
                  onClick={() => {
                    const topic = (document.getElementById('topic-selector') as HTMLSelectElement).value;
                    handleGenerateTopicCase("short", topic);
                  }}
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
                    onClick={() => {
                      const topic = (document.getElementById('topic-selector') as HTMLSelectElement).value;
                      handleGenerateTopicCase("long", topic);
                    }}
                    className="py-2 px-3 border border-rose-950/45 bg-rose-950/15 hover:bg-rose-900/10 text-rose-350 font-mono font-bold uppercase text-[10px] tracking-wide rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-450 animate-pulse" />
                    Long [Locked]
                  </button>
                ) : (
                  <button
                    disabled={isGeneratingCase}
                    onClick={() => {
                      const topic = (document.getElementById('topic-selector') as HTMLSelectElement).value;
                      handleGenerateTopicCase("long", topic);
                    }}
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
            </div>
          )}

          {/* Random UMLS Case Generation Buttons */}`;

content = content.replace('{/* Random UMLS Case Generation Buttons */}', caseGenerationButtons);

fs.writeFileSync(path, content);
console.log("Patched Simulator Lab");
