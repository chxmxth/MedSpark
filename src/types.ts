export interface Message {
  id: string;
  sender: "user" | "patient" | "system" | "assistant";
  text: string;
  timestamp: string;
}

export interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  oxygenSat: number;
  respRate: number;
}

export interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  complaint: string;
  avatar: string;
  historyOfPresentIllness: string;
  vitals: VitalSigns;
  ecgDescription: string;
  labs: {
    fbc: string;
    ue: string;
    lft: string;
    troponin: string;
  };
  imaging: {
    cxr: string;
    ct: string;
  };
  physicalExamPrompt: string;
  correctAnswers: {
    differential: string[];
    finalDiagnosis: string;
    management: string[];
  };
  opentargets_data?: Record<string, any>;
  rxnav_data?: Record<string, any>;
  umls_data?: Record<string, any>;
}

export interface CaseEvaluation {
  id: string;
  caseName: string;
  caseId: string;
  patientName: string;
  studentSubmission: {
    historyFindings: string;
    physicalFindings: string;
    differentialDiagnosis: string;
    finalDiagnosis: string;
    managementPlan: string;
  };
  aiFeedback: {
    overallFeedback: string;
    historyRating: number;   // out of 5
    examRating: number;      // out of 5
    diagnosticRating: number;// out of 5
    managementRating: number;// out of 5
    strengths: string[];
    weaknesses: string[];
  };
  score: number; // 0 to 100
  createdAt: string;
}

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "pro" | "faculty";
  casesCompleted: number;
  assistantQueriesUsed: number;
  subscriptionActive: boolean;
  subscriptionPlan: "Free Tier" | "Resident Pro" | "Faculty Advisor";
  topics?: string[];
  preferredQuestions?: string[];
}
