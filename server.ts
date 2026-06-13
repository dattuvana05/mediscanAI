import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { db } from "./src/server/db";
import { AnalysisResult, MedicalReport } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper: Lazy initialization of Gemini Client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined. Please add your Gemini API Key in the Secrets / Settings menu in Google AI Studio.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Robust helper to call generateContent with retry and fallback model upon transient 503 / high demand errors
  async function generateContentWithRetry(
    client: GoogleGenAI,
    params: {
      model: string;
      contents: any;
      config?: any;
    }
  ): Promise<any> {
    const maxRetries = 3;
    let delay = 1000;
    let lastError: any = null;

    // Define fallback models in case the primary one is completely overloaded
    const modelsToTry = [
      params.model,
      "gemini-flash-latest",
      "gemini-3.5-flash"
    ];

    // Remove duplicates
    const uniqueModels = Array.from(new Set(modelsToTry));

    for (const modelToUse of uniqueModels) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[AI] Generating content with model: ${modelToUse} (Attempt ${attempt}/${maxRetries})`);
          const response = await client.models.generateContent({
            ...params,
            model: modelToUse,
          });
          return response;
        } catch (error: any) {
          lastError = error;
          const errString = error?.message || String(error);
          const isTransient = errString.includes("503") || 
                              errString.includes("UNAVAILABLE") || 
                              errString.includes("high demand") || 
                              errString.includes("temp") ||
                              (error?.status && (error.status === 503 || error.status === 429));
          
          console.warn(`[AI] Attempt ${attempt} with model ${modelToUse} failed: ${errString}. (isTransient=${isTransient})`);
          
          if (isTransient && attempt < maxRetries) {
            console.log(`[AI] Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 1.5;
          } else {
            break;
          }
        }
      }
    }
    throw lastError || new Error("Failed to generate content after retries and fallback.");
  }

  // --- API ROUTES ---

  // 1. Health & Config endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // 2. Authentication: Register
  app.post("/api/auth/register", (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required." });
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists." });
      }

      // Simple password store (hashed/stored directly for demo robustness)
      const user = db.createUser({ email, password, name });
      const token = `tok_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

      res.status(201).json({ user, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Registration failed." });
    }
  });

  // 3. Authentication: Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = db.verifyUser(email, password);
      if (!user) {
        return res.status(412).json({ error: "Invalid email or password combination." });
      }

      const token = `tok_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      res.json({ user, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Login failed." });
    }
  });

  // 4. Reset Password Simulation
  app.post("/api/auth/forgot", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }
      const existing = db.findUserByEmail(email);
      if (!existing) {
        return res.status(404).json({ error: "No account found with this email." });
      }
      res.json({ message: "A test password reset link has been simulated. Please proceed to login with a new mock registration if desired." });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to initiate reset." });
    }
  });

  // Helper middleware to get authenticated user from Authorization header
  function authenticateToken(req: any, res: any, next: any) {
    const userId = req.headers["x-user-id"] || "guest_user";
    let u = db.findUserById(userId);
    if (!u) {
      u = {
        id: "guest_user",
        email: "clinician@mediscan.org",
        name: "MediScan Clinician",
        createdAt: new Date().toISOString()
      };
    }
    req.user = u;
    return next();
  }

  // 5. Reports: Get history for active user
  app.get("/api/reports/history", authenticateToken, (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = db.getReports(userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fetching reports history failed." });
    }
  });

  // 6. Reports: Analyze Medical Image using Gemini
  app.post("/api/reports/analyze", authenticateToken, async (req: any, res) => {
    try {
      const { imageDataUrl, fileName, fileSize, bodyRegion, scanType } = req.body;
      if (!imageDataUrl) {
        return res.status(400).json({ error: "Image data is required for analysis." });
      }

      // Check if API key exists before triggering
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not defined. Please add your Gemini API Key in the Secrets / Settings menu in Google AI Studio to enable live AI analysis.",
          code: "MISSING_API_KEY"
        });
      }

      // Extract raw base64 data and mimeType from data URL
      const matches = imageDataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid image data format. Must be a valid Data URL." });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const client = getGeminiClient();

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          isMedicalImage: {
            type: Type.BOOLEAN,
            description: "True if the image is a medical image like a scan, X-Ray, MRI, CT scan, ultrasound, pathology slide, or bone photo. False if it is a generic photo of a house, food, sky, street, or common animal."
          },
          scanType: {
            type: Type.STRING,
            description: "Type of scan, e.g., 'Chest X-Ray', 'Brain MRI', 'Spinal CT Scan', 'Knee Joint Scan'. Specify 'None' if not a medical scan."
          },
          condition: {
            type: Type.STRING,
            description: "Detected condition name or finding designation (e.g., 'Pneumonia', 'Lobar Infiltration', 'Normal Study', 'Fractured Fibula', 'Healthy Brain Scan')."
          },
          confidence: {
            type: Type.INTEGER,
            description: "Diagnostic confidence estimate from 0 to 100."
          },
          severity: {
            type: Type.STRING,
            description: "Urgency of finding: 'None', 'Low', 'Moderate', or 'High'."
          },
          description: {
            type: Type.STRING,
            description: "A highly descriptive, educational interpretation of what the AI model identifies in the image scan. State findings clearly and emphasize educational, simulated radiologic review."
          },
          findings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3 to 4 specific logical medical findings seen in the scan."
          },
          precautions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3 helpful precautions or next advocacy steps for the patient (e.g. consult professional doctor, get additional view scan)."
          },
          highlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER, description: "X percentage from left of image (0-100) where anomaly lies." },
                y: { type: Type.NUMBER, description: "Y percentage from top of image (0-100) where anomaly lies." },
                width: { type: Type.NUMBER, description: "Highlight boundary width as a percentage (10-40)." },
                height: { type: Type.NUMBER, description: "Highlight boundary height as a percentage (10-40)." },
                label: { type: Type.STRING, description: "Short helper label (e.g., 'Consolidation center', 'Focal density')." }
              },
              required: ["x", "y", "width", "height", "label"]
            },
            description: "Coordinates for drawing high-contrast boxes targeting anomalies. Return empty list if perfectly normal/healthy or if non-medical image."
          },
          medicines: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 2 to 3 standard supportive therapeutics or clinical guideline medicines commonly referenced for this specific condition (e.g., 'Amoxicillin (if bacterial etiology is confirmed)', 'OTC Acetaminophen for thermal regulation & symptom control'). Provide informative context with professional supervision notes."
          }
        },
        required: ["isMedicalImage", "scanType", "condition", "confidence", "severity", "description", "findings", "precautions", "highlights", "medicines"]
      };

      const systemPrompt = `You are a clinical AI radiologist teaching assistant.
Analyze this medical scan image strictly with academic rigour. If the image is not a medical imaging scan (e.g., it is a household object, casual selfie, landscape, text, etc.), mark isMedicalImage as false, condition as "Non-Medical Asset Detected", and use the description to guide the user to upload a valid X-ray, MRI, or CT scan.
Otherwise, classify the scan, suspect findings, estimate diagnostic confidence, provide typical guideline-recommended medication routes/medicines (such as supportive OTC or standard prescription compounds for education), and locate 1-2 bounding areas using relative percentage coordinates (0-100) on the scan so we can paint highlight boundaries directly onto the image.
Follow the output schema exactly. Present all insights in a highly clinical, yet easy-to-understand educational manner. Do not include actual prescriptive claims. Always note simulation guidelines.`;

      const userCategoryPrompt = (bodyRegion && scanType)
        ? `\n\nUSER SCAN CLASSIFICATION CONTEXT: The user tags this as a ${scanType} scan of the ${bodyRegion} anatomy region. Evaluate the clinical image with analytical focus as a ${scanType} highlighting any irregularities within the ${bodyRegion}.`
        : "";

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: systemPrompt + userCategoryPrompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
          temperature: 0.2, // Low temperature for high analytical consistency
        },
      });

      if (!response.text) {
        throw new Error("No response content generated from Gemini model.");
      }

      const apiResult: AnalysisResult = JSON.parse(response.text.trim());

      // Save report in user context
      const newReport = db.createReport({
        userId: req.user.id,
        fileName: fileName || "scan_image.png",
        fileSize: fileSize || "Unknown size",
        imageUrl: imageDataUrl, // Storing image locally/base64
        analysis: apiResult,
      });

      res.status(200).json(newReport);
    } catch (error: any) {
      console.error("Gemini Analysis failing:", error);
      res.status(500).json({ error: error.message || "An error occurred during medical AI image analysis." });
    }
  });

  // 7. Reports: Remove report from historical records
  app.delete("/api/reports/:id", authenticateToken, (req: any, res) => {
    try {
      const reportId = req.params.id;
      const userId = req.user.id;
      const success = db.deleteReport(reportId, userId);
      if (!success) {
        return res.status(404).json({ error: "Report not found or permission denied." });
      }
      res.json({ message: "Report deleted successfully.", id: reportId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Deletion failed." });
    }
  });

  // 8. Chatbot Assistant: Context-aware interactive educational guide
  app.post("/api/chatbot/ask", async (req: any, res) => {
    try {
      const { message, reportContext } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined. Please verify secrets config." });
      }

      const client = getGeminiClient();
      let context = `You are "MedAssist AI", an interactive clinical radiological assistant.
Your goal is to answer health/scan related questions using clear, non-prescriptive, educational language.
IMPORTANT MEDICAL DISCLAIMER: Always add a subtle reassurance and a soft disclaimer reminding the patient that you are an AI assistant doing clinical education simulation. This never replaces professional diagnosis. Never prescribe treatments.

`;

      if (reportContext) {
        context += `Current Scan Context being discussed with the patient:
- Scan: ${reportContext.scanType}
- Suspected finding: ${reportContext.condition}
- Severity: ${reportContext.severity}
- Finding Description: ${reportContext.description}
- Stated findings: ${reportContext.findings?.join(", ") || "None"}
- Standard precautions: ${reportContext.precautions?.join(", ") || "None"}

Please align your response with this context if the user's question relates to it. Keep answers empathetic, clear, scannable, and under 150 words.
`;
      } else {
        context += `Default educational mode (no scan uploaded yet). Teach the patient how X-Ray, MRI, or CT imaging works or answer their basic diagnostics query. Keep it under 150 words.`;
      }

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.5-flash",
        contents: [
          { text: context },
          { text: `Patient Question: "${message}"` }
        ],
        config: {
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text || "I was unable to formulate a response. Feel free to rephrase." });
    } catch (error: any) {
      console.error("Chatbot assistant error:", error);
      res.status(500).json({ error: error.message || "Chatbot retrieval failed." });
    }
  });

  // --- VITE / STATIC CLIENT DIRECTORY SERVING ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port 3000 and 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to boot server:", err);
});
