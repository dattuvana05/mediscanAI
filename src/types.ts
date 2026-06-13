/**
 * Shared Type Definitions for Medical Image Analysis App
 */

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  createdAt: string;
}

export interface HighlightArea {
  x: number;      // percentage from left (0 - 100)
  y: number;      // percentage from top (0 - 100)
  width: number;  // percentage width (0 - 100)
  height: number; // percentage height (0 - 100)
  label: string;  // name or observation of the area
}

export interface AnalysisResult {
  scanType: string;       // "Chest X-Ray", "Brain MRI", "Lung CT Scan", etc.
  condition: string;      // "Normal", "Pneumonia", "Brain Tumor", "Fracture", etc.
  confidence: number;     // 0 - 100
  severity: "None" | "Low" | "Moderate" | "High";
  description: string;    // Brief professional description
  findings: string[];     // Bullet points of visual findings
  precautions: string[];  // Suggested standard precautions (with clinical disclaimer)
  highlights: HighlightArea[]; // Bounding boxes for highlighting anomalies
  isMedicalImage: boolean; // Flag to check if uploaded image is actually medical
  medicines?: string[];   // Recommended supportive medicines / therapeutic guidance
}

export interface MedicalReport {
  id: string;
  userId: string;
  fileName: string;
  fileSize: string;
  imageUrl: string; // Base64 or local server path
  analysis: AnalysisResult;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
