const fs = require('fs');

const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const topicEndpoint = `// Custom Topic endpoint
app.post("/api/cases/generate-topic", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "Gemini AI API key not configured." });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(503).json({ error: "Gemini AI client failed to initialize." });
  }

  const { type, topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "A topic string is required." });
  }

  try {
    const generatedId = \`topic-\${Date.now()}\`;

    // Avatar pools reflecting demographic distribution
    const maleAvatars = [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
    ];

    const femaleAvatars = [
      "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    ];

    const systemPrompt = "You are a senior clinical examiner designing simulated OSCE medical cases. Your role is to write clean, clinical profiles in perfectly validated raw JSON conforming exactly to the requested schema. Do not output markdown blocks or extra text.";

    const promptText = \`Generate a simulated medical patient OSCE case profile focusing on the specific clinical topic: "\${topic}".
Format the case specifically as a \${type === "short" ? "focused, problem-oriented BRIEF Case ('short')" : "comprehensive detail-oriented ROBUST Case ('long')"}.
- For a 'short' case, focus mostly on the acute presenting complaint with clear findings and a brief history.
- For a 'long' case, include rich details about past medical history, family cardiac or respiratory issues, active home drug therapies, social status, and systemic reviews.

Your output must be a single JSON object conforming exactly to this TypeScript interface template structure:
{
  "id": "\${generatedId}",
  "name": "random realistic patient name",
  "age": 45,
  "gender": "M",
  "complaint": "brief 2-4 word primary clinical symptom presentation reflecting \${topic}",
  "avatar": "Unsplash image URL based on gender",
  "historyOfPresentIllness": "detailed medical narrative appropriate to case type (\${type}).",
  "vitals": {
    "heartRate": 80,
    "bloodPressure": "125/82",
    "oxygenSat": 98,
    "respRate": 16
  },
  "ecgDescription": "electrocardiogram clinical reading details matching the pathophysiology of \${topic}",
  "labs": {
    "fbc": "realistic Full Blood Count description",
    "ue": "realistic Urea and Electrolytes description",
    "lft": "realistic Liver Function Tests description",
    "troponin": "realistic cardiac Troponin assay value and explanation"
  },
  "imaging": {
    "cxr": "Chest X-Ray lung fields report matching the pathophysiology of \${topic}",
    "ct": "CT scan report matching the pathophysiology of \${topic}"
  },
  "physicalExamPrompt": "patient orientation (GCS 15), specific thoracic/abdominal exam, etc.",
  "correctAnswers": {
    "differential": ["Differential diagnosis 1", "Differential diagnosis 2", "Differential diagnosis 3", "Differential diagnosis 4"],
    "finalDiagnosis": "the definitive final working diagnosis matching the topic \${topic}",
    "management": [
      "stepwise therapy guideline 1"
    ]
  }
}

Output ONLY valid, parsed JSON.\`;

    let textResponse = "{}";
    let success = false;
    let retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.8,
            responseMimeType: "application/json"
          }
        });
        textResponse = response.text?.trim() || "{}";
        success = true;
        break;
      } catch (genErr: any) {
        console.warn(\`Attempt \${i + 1} failed generating Topic case:\`, genErr.message || genErr);
        const errObj = genErr.error || genErr;
        const isTransient = errObj.status === 503 || errObj.code === 503 || errObj.status === "UNAVAILABLE" || genErr.message?.includes("503") || genErr.message?.toLowerCase().includes("unavailable") || genErr.message?.toLowerCase().includes("high demand") || genErr.message?.toLowerCase().includes("overloaded");
        if (isTransient && i < retries - 1) {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        } else {
          break;
        }
      }
    }

    if (!success) {
      throw new Error("Failed to generate Topic case due to Gemini generation failure after retries.");
    }

    let cleanJson = textResponse;
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith("\`\`\`")) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith("\`\`\`")) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsedCase = JSON.parse(cleanJson);
      // Ensure key identifiers are locked in
      parsedCase.id = generatedId;
      if (!parsedCase.name) parsedCase.name = "Simulated Patient";
      if (!parsedCase.vitals) parsedCase.vitals = { heartRate: 75, bloodPressure: "120/80", oxygenSat: 98, respRate: 16 };
      if (!parsedCase.correctAnswers) parsedCase.correctAnswers = { differential: [topic], finalDiagnosis: topic, management: ["Treat symptoms standard-of-care"] };
      if (!parsedCase.avatar || parsedCase.avatar.includes("gender")) {
         parsedCase.avatar = parsedCase.gender === "M" ? maleAvatars[0] : femaleAvatars[0];
      }

      res.json(parsedCase);
    } catch (parseError) {
      console.error("JSON parsing failure from Gemini. Raw output of Gemini was:", textResponse);
      res.status(500).json({ error: "Failed to parse generated clinical JSON template correctly. Please try again." });
    }

  } catch (error: any) {
    console.error("Dynamic topic case compilation error:", error);
    res.status(500).json({ error: error.message || "Dynamic compilation failed." });
  }
});

app.post("/api/paraclinicals", async (req, res) => {
  const { diagnosis, management } = req.body;
  if (!diagnosis || !management) {
    return res.status(400).json({ error: "Diagnosis and management plan are required." });
  }

  try {
    const targets: any[] = [];
    const drugs: any[] = [];

    // Attempt to search Open Targets GraphQL for the diagnosis disease name
    try {
      // Basic fuzzy matching via search endpoint
      const openTargetsQuery = \`
        query searchDisease($queryString: String!) {
          search(queryString: $queryString, entityNames: ["disease"], page: { index: 0, size: 1 }) {
            hits {
              id
              name
              description
            }
          }
        }
      \`;

      const searchRes = await fetch("https://api.opentargets.io/api/v4/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: openTargetsQuery, variables: { queryString: diagnosis } })
      });
      const searchData = await searchRes.json();

      const hits = searchData?.data?.search?.hits;
      if (hits && hits.length > 0) {
        const diseaseId = hits[0].id;

        // Fetch associated targets for this disease
        const targetsQuery = \`
          query getDiseaseTargets($efoId: String!) {
            disease(efoId: $efoId) {
              associatedTargets(page: { index: 0, size: 3 }) {
                rows {
                  target {
                    approvedSymbol
                    approvedName
                  }
                  score
                }
              }
            }
          }
        \`;

        const targetsRes = await fetch("https://api.opentargets.io/api/v4/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: targetsQuery, variables: { efoId: diseaseId } })
        });
        const targetsData = await targetsRes.json();
        const rows = targetsData?.data?.disease?.associatedTargets?.rows;
        if (rows) {
          rows.forEach((row: any) => {
            targets.push({
              approvedSymbol: row.target.approvedSymbol,
              approvedName: row.target.approvedName,
              score: row.score
            });
          });
        }
      }
    } catch (otErr) {
      console.error("Open Targets query failed", otErr);
    }

    // Attempt to parse out basic drug names from management and query RxNav
    try {
      // A simple heuristic: take the first long word in management plan as a drug search query
      const potentialDrug = management.split(" ").find((w: string) => w.length > 5 && !['patient','management','treatment'].includes(w.toLowerCase()));
      if (potentialDrug) {
        const rxNavUrl = \`https://rxnav.nlm.nih.gov/REST/drugs.json?name=\${encodeURIComponent(potentialDrug)}\`;
        const rxNavRes = await fetch(rxNavUrl);
        const rxNavData = await rxNavRes.json();

        const conceptGroup = rxNavData?.drugGroup?.conceptGroup;
        if (conceptGroup) {
          // Find the first concept group with properties
          const groupWithProps = conceptGroup.find((g: any) => g.conceptProperties && g.conceptProperties.length > 0);
          if (groupWithProps) {
            const prop = groupWithProps.conceptProperties[0];
            drugs.push({
              name: prop.name,
              conceptId: prop.rxcui
            });
          }
        }
      }
    } catch (rxErr) {
      console.error("RxNav query failed", rxErr);
    }

    // Fallbacks if external APIs fail to yield any results
    if (targets.length === 0) {
      targets.push({ approvedSymbol: "UNKNOWN", approvedName: "Could not map to specific OpenTargets disease pathway", score: 0.0 });
    }
    if (drugs.length === 0) {
      drugs.push({ name: "Generic Supportive Care / Unrecognized", conceptId: "0000" });
    }

    res.json({ targets, drugs });

  } catch (error: any) {
    console.error("Paraclinicals backend error:", error);
    res.status(500).json({ error: error.message || "Paraclinicals generation failed." });
  }
});

`;

content = content.replace('// Endpoint to securely fetch public RevenueCat keys', topicEndpoint + '// Endpoint to securely fetch public RevenueCat keys');

fs.writeFileSync(path, content);
console.log("Patched server.ts");
