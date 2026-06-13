# Medical Image Analysis using AI 🩺🧬

Interactive healthcare-themed web application that integrates standard **Google Gemini 3.5 Flash** vision parsing to analyze clinical medical scans (X-Rays, Brain MRIs, orthopedic CT sections) to spot visual anomalies, compute diagnostic confidence levels, pinpoint coordinates for bounding highlights, and present educational patient assistance guides.

---

## 🎨 Key Features & Visual Architecture

### 🌙 High-Contrast Healthcare Theme
- Supports seamless **Dark Mode** and **Light Mode** options with local-storage preference persistence.
- Built on a modern visual aesthetic incorporating glassmorphic panel headers, subtle grid background matrix designs, and dynamic hover effects.

### 📤 Anatomical Scanner Zone
- Handles drag-and-drop file imports for standard slide images (JPEG, PNG, WebP).
- Simulates real-time analytics with active **radar-sweeping scanner animations** and fluid percentage processing states.
- **Pixel-Matched Highlight Boundary Mapping:** Maps relative coordinates from deep learning vision analysis directly on top of the original study. Hover targets show coordinates and localized anatomical findings.

### 🤖 Gemini Educational Consulting Assistant
- Fully automated clinical chatbot syncing in real-time with scanned results.
- Patients can ask about findings, medical definitions, or scan recommendations (protected by strict clinical education disclaimers).

### 📈 Clinical Logs & Dashboard
- Standard user registry and authentication flow (Login/Signup, Remember email, Password assistance).
- Persists scanned history and charts trends (finitude breakdowns and confidence averages) visually using Recharts.

---

## 🏗️ Folder Structure
```
├── server.ts                 # Full-stack Express server with Vite middleware integration
├── database.json             # Persistent local JSON registry database
├── package.json              # System configuration and dependency manifest
├── tsconfig.json             # TypeScript rules configuration
├── vite.config.ts            # Client assets asset configuration
├── src/
│   ├── main.tsx              # React mounting root
│   ├── App.tsx               # Master App router and notification coordinator
│   ├── index.css             # Global styles, fonts, and grid matrix animations
│   ├── types.ts              # Strongly typed interfaces (User, Report, Analysis)
│   ├── server/
│   │   └── db.ts             # File database helper
│   └── components/
│       ├── AuthScreen.tsx    # Responsive Login/Signup modules
│       ├── LandingPage.tsx   # Feature overview homepage
│       ├── Uploader.tsx      # Target scanner, progress loops, and pixel highlights
│       ├── DashboardHistory.tsx # Recharts-rendered metrics, trends list, and profiles
│       └── ChatBot.tsx       # Floating context-aware clinical assistant chatbot
```

---

## 🚀 Speed-Run Quick Start (Local Setup)

To execute the full-stack container workspace locally:

### 1. Configure Secrets / Environment
Ensure you have created a `.env` file at your project's root based on `.env.example`:
```env
GEMINI_API_KEY="your_real_gemini_api_key"
APP_URL="http://localhost:3000"
```

### 2. Install Project Dependencies
Run standard package installation commands in the project directory:
```bash
npm install
```

### 3. Initiate Dev Backend
Run the full-stack development environment. Express starts on port 3000 serving client assets via hot Vite middleware:
```bash
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

---

## 🌐 Complete Hosting Deployment Guide

### A. Deploying Backend & Database (using Render or Railway)

Since the application utilizes a structured full-stack Express server to handle API proxies (insulating precious Gemini API keys) and persists metrics, we must deploy the backend code to a platform supporting Node runtimes:

1. **Connect Repository:** Link your exported GitHub repository to **Render.com** (as a Web Service) or **Railway.app**.
2. **Configure Environment Variables:** Add your secret injection keys:
   - Sets `NODE_ENV` as `production`.
   - Sets `GEMINI_API_KEY` to your verified Google AI Studio API Secret token.
3. **Specify Build & Start Commands:**
   - **Build Command:** `npm run build` (This bundles client assets to `dist/` and compiles TypeScript server to production-ready CJS `dist/server.cjs`).
   - **Start Command:** `npm run start` (Launches node container `node dist/server.cjs`).

### B. Single Bundle Hosting (Vercel & Netlify)

Vercel/Netlify can host custom Node backends using standard Serverless functions (e.g. configuring `vercel.json` to pipe routing to `/api/*`), but since client assets compiled in `dist/` are served natively by the built Express engine, **Render or Railway is highly recommended** for single-click, zero-config full-stack container environments.

---

## ⚠️ Important Legal & Medical Disclaimer

"This application is strictly for academic and educational simulation purposes only and does NOT replace the diagnosis, prescriptions, consultation, or clinical checkups of a Board-Certified radiologist or medical professional. Never use AI-generated insights to override qualified clinical health advocacy."
