import { PatientCase, CaseEvaluation } from "./types";

export const PRESET_CASES: PatientCase[] = [
  {
    id: "john-doe-65",
    name: "John Doe",
    age: 65,
    gender: "M",
    complaint: "Acute Shortness of Breath",
    avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80",
    historyOfPresentIllness: "Mr. Doe is a 65-year-old male presenting with a 12-hour history of worsening shortness of breath, worse when lying flat (orthopnea). He reports swelling in his ankles over the past week and a mild, non-productive cough. He denies retrosternal crushing pain, but has some chest discomfort because of breathing struggle. Past medical history includes Hypertension and Type 2 Diabetes.",
    vitals: {
      heartRate: 112,
      bloodPressure: "145/90",
      oxygenSat: 88,
      respRate: 24,
    },
    ecgDescription: "Sinus Tachycardia at 112 bpm, normal axis. No acute ST-elevation or T-wave inversions. Left ventricular hypertrophy voltage criteria met.",
    labs: {
      fbc: "Hb: 13.8 g/dL, WBC: 7.2 x 10^9/L, Plt: 220 x 10^9/L (All within normal reference ranges).",
      ue: "Sodium: 136 mmol/L, Potassium: 4.1 mmol/L, Urea: 9.2 mmol/L (slightly elevated), Creatinine: 115 μmol/L (mild impairment).",
      lft: "Bilirubin: 17 μmol/L, ALT: 35 U/L, ALP: 90 U/L (Within normal ranges).",
      troponin: "Troponin I: 0.12 ng/mL (Reference: < 0.04 ng/mL). Mild elevation indicating myocardial strain or micro-injury without definitive occlusive myocardial infarction.",
    },
    imaging: {
      cxr: "Chest X-Ray: Bilateral alveolar infiltrates in 'batwing' distribution, cardiomegaly (prominent heart silhouette), upper lobe venous diversion, and small bilateral pleural effusions. Highly suggestive of Acute Decompensated Heart Failure (Pulmonary Edema).",
      ct: "CT Pulmonic Angiogram (CTPA): No evidence of pulmonary embolus. Heart enlargement and moderate bilateral pleural effusions seen with interstitial congestion.",
    },
    physicalExamPrompt: "GCS 15. JVP is elevated (5 cm above sternal angle). Bilateral coarse crackles at lung bases reaching mid-zones. Apex beat displaced laterally, 3+ pitting edema of both ankles up to mid-shin.",
    correctAnswers: {
      differential: ["Acute Decompensated Heart Failure", "NSTEMI", "Pneumonia", "Acute COPD Exacerbation"],
      finalDiagnosis: "Acute Decompensated Heart Failure / Fluid Overload / Mild Non-STEMI Type II",
      management: [
        "High-flow active oxygen therapy to raise SpO2 above 92%",
        "Intravenous Furosemide (diuretic) 40mg or 80mg bolus",
        "Sublingual Glyceryl Trinitrate (GTN) for preload reduction",
        "Strict fluid restriction and vital chart monitoring",
        "Echocardiogram once stabilized to evaluate ejection fraction",
      ],
    },
  },
  {
    id: "sarah-connor-28",
    name: "Sarah Connor",
    age: 28,
    gender: "F",
    complaint: "Sharp Left-sided Chest Pain",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150&auto=format&fit=crop&q=80",
    historyOfPresentIllness: "Sarah Connor is a 28-year-old female medical student who presented with sudden-onset sharp pain on the left side of her chest, which started 4 hours ago. The pain is severe, made worse by deep inspiration (pleuritic) and lying flat. She also has a dry cough and some mild shortness of breath. No past cardiovascular history. She returned 3 days ago from an 11-hour flight from Tokyo and is on oral contraceptive pills.",
    vitals: {
      heartRate: 104,
      bloodPressure: "115/75",
      oxygenSat: 91,
      respRate: 26,
    },
    ecgDescription: "Sinus Tachycardia at 104 bpm. Prominent S wave in lead I, Q-wave in lead III, inverted T-wave in lead III (Classic S1Q3T3 pattern indicating right ventricular strain).",
    labs: {
      fbc: "Hb: 12.5 g/dL, WBC: 10.5 x 10^9/L (borderline high), Plt: 310 x 10^9/L.",
      ue: "Sodium: 140 mmol/L, Potassium: 4.0 mmol/L, Urea: 4.5 mmol/L, Creatinine: 70 μmol/L. (All normal).",
      lft: "Bilirubin: 12 μmol/L, ALT: 22 U/L, ALP: 60 U/L (All normal).",
      troponin: "Troponin I: < 0.01 ng/mL (Normal).",
    },
    imaging: {
      cxr: "Chest X-Ray: Clear lung fields, normal heart size. No consolidation or pneumothorax visible.",
      ct: "CT Pulmonic Angiogram (CTPA): Documented filling defect in the left main pulmonary artery segment, confirming acute segmentary Pulmonary Embolism (PE). No infarction of lung parenchyma noted.",
    },
    physicalExamPrompt: "Lungs are entirely clear to auscultation. Heart sounds regular S1, S2, no murmurs. Left calf is tender, warm, swollen (+2 cm compared to right calf circumference). Inguinal lymph nodes normal.",
    correctAnswers: {
      differential: ["Pulmonary Embolism", "Pneumonitis", "Pericarditis", "Pneumothorax"],
      finalDiagnosis: "Acute Left Segmentary Pulmonary Embolism secondary to deep vein thrombosis (DVT)",
      management: [
        "Therapeutic anticoagulation with Low Molecular Weight Heparin (e.g. Enoxaparin) or direct oral anticoagulant (e.g. Apixaban)",
        "Oxygen therapy to support oxygenation and relieve respiratory distress",
        "Discontinuance of oral contraceptive pills",
        "Bedside counseling on safe travel routines and mobilization",
      ],
    },
  },
  {
    id: "robert-chin-45",
    name: "Robert Chin",
    age: 45,
    gender: "M",
    complaint: "Retro-sternal Crushing Pain",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    historyOfPresentIllness: "Mr. Chin is a 45-year-old software architect who presents with sudden, crushing central chest pressure that 'feels like an elephant is sitting on my chest.' The pain radiated to his left shoulder and jaw, starting 1.5 hours ago while shoveling snow. He is extremely sweaty (diaphoretic) and nauseated. He has a 20-pack-year smoking history and positive familial history of premature ischemic heart disease.",
    vitals: {
      heartRate: 98,
      bloodPressure: "135/85",
      oxygenSat: 95,
      respRate: 19,
    },
    ecgDescription: "Sinus Rhythm with ST-segment elevation of 3mm in Leads II, III, and aVF, with reciprocal ST-segment depression in Lead I and aVL. Conspicuously diagnostic of Acute Inferior STEMI.",
    labs: {
      fbc: "Hb: 14.2 g/dL, WBC: 11.2 x 10^9/L, Plt: 240 x 10^9/L.",
      ue: "Sodium: 139 mmol/L, Potassium: 3.8 mmol/L, Urea: 5.6 mmol/L, Creatinine: 82 μmol/L.",
      lft: "Bilirubin: 14 μmol/L, ALT: 28 U/L, ALP: 74 U/L.",
      troponin: "Troponin I: 1.85 ng/mL (Highly elevated; Reference: < 0.04).",
    },
    imaging: {
      cxr: "Chest X-Ray: Normal heart size, clear lungs, no signs of aortic dissection flap or mediastinal widening.",
      ct: "CT Angiogram of Aorta: No aortic dissection. Normal heart structure with minimal pericardial fluid.",
    },
    physicalExamPrompt: "Patient appears cool, clammy, and highly distressed. Heart sounds S1, S2, with a soft S4 audible at the apex. Breathing is vesicular, no rales. Peripheral pulses normal.",
    correctAnswers: {
      differential: ["Acute Inferior STEMI", "Aortic Dissection", "Acute Myocarditis", "Esophageal Spasm"],
      finalDiagnosis: "Acute Inferior ST-Elevation Myocardial Infarction (STEMI)",
      management: [
        "Immediate referral for Primary Percutaneous Coronary Intervention (PCI) within 90 minutes",
        "Loading dose of Chewable Aspirin 300mg",
        "Loading dose of P2Y12 inhibitor (e.g. Ticagrelor 180mg or Clopidogrel 300mg)",
        "Intravenous Heparin injection bolus",
        "Sublingual Nitroglycerin or IV Morphine for pain control if blood pressure permits",
      ],
    },
  },
];

export const PRESEEDED_HISTORY: CaseEvaluation[] = [];
