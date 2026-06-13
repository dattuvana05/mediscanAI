import React from "react";
import { PlayCircle, ShieldAlert, Cpu, Database, UserCheck, Sparkles, Activity, FileCheck, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onStartUploading: () => void;
  isAuthenticated: boolean;
  onNavigateToAuth: () => void;
}

export default function LandingPage({ onStartUploading, isAuthenticated, onNavigateToAuth }: LandingPageProps) {
  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 medical-grid">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center lg:py-12">
            
            {/* Sparkling Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
              <Sparkles className="h-4 w-4 text-teal-400 animate-bounce" />
              <span>Deep-Learning Medical Consultation Assistant</span>
            </div>

            {/* Title & Tagline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl max-w-4xl leading-tight">
              Medical Image Analysis <br/>
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(45,212,191,0.15)]">
                using Advanced AI
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-base text-slate-500 dark:text-slate-400 sm:text-lg">
              AI-powered early disease detection from medical images. Securely scan Chest X-Rays, Brain MRIs, and CT sections to isolate micro-pathologies and map physical anomalies instantly.
            </p>

            {/* Clinical Disclaimer badge */}
            <div className="mx-auto mt-4 max-w-xl flex items-start gap-2 rounded-xl bg-orange-50/75 p-3 text-left text-[11px] text-orange-850 border border-orange-100 dark:bg-amber-955/10 dark:text-amber-300 dark:border-amber-900/30">
              <ShieldAlert className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Educational Simulation Disclaimer:</strong> This application utilizes advanced generative vision AI for simulated analysis. It does NOT provide formal, actionable clinical diagnoses. Consult with a Board-Certified Radiologist for official healthcare findings.
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button
                onClick={onStartUploading}
                className="group flex items-center gap-2 rounded-xl bg-teal-500 px-7 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-teal-500/20 hover:bg-teal-400 hover:scale-[1.02] transition duration-205 focus:outline-none"
              >
                Launch Diagnostic AI
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-16 bg-slate-50 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
                About the AI Diagnostics Project
              </h2>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                Medical Image Analysis using AI represents the next frontier in supportive software for healthcare. Our platform allows clinical researchers, students, and practitioners to upload anonymized medical scans (ranging from pulmonary lung X-Rays to orthopedic extremity images) and analyze them using multi-modal AI models.
              </p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                By modeling anomaly percentages, calculating severity estimations, and supplying localized pixel highlights, our assistant aims to illustrate standard supportive workflows that help flag critical points of interest before formal review loops.
              </p>
              
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-mono font-medium text-slate-600 dark:text-slate-350">
                <span className="rounded-full bg-teal-500/10 px-3.5 py-1 text-teal-600 dark:text-teal-400 border border-teal-500/20">Chest X-Ray Support</span>
                <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Brain MRI Support</span>
                <span className="rounded-full bg-cyan-500/10 px-3.5 py-1 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">Orthopedic Study Support</span>
              </div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center p-8">
              {/* Artistic scan overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-slate-950 to-indigo-950/30 opacity-70"></div>
              <div className="absolute inset-0 medical-grid opacity-15"></div>
              <div className="absolute left-[30%] right-[30%] top-0 bottom-0 border-x border-blue-500/10 animate-pulse"></div>
              <div className="absolute left-0 right-0 top-[40%] h-[1px] bg-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-bounce"></div>
              
              {/* Abstract medical elements */}
              <div className="relative z-10 flex flex-col items-center text-center gap-3">
                <Activity className="h-10 w-10 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-400 tracking-wider">AI DIAGNOSTIC SCAN ENGINE</span>
                <span className="text-[10px] font-mono text-emerald-400">STATUS: ACTIVE // MODEL v3.5-FLASH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-section" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Platform Features
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-500">
              Equipped with deep analytical indicators, visual highlights, and interactive consult dialogs.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:scale-[1.01] transition duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-450 border border-teal-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Multimodal Vision Parsing</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Processes DICOM/PNG/JPG directly. Identifies type of scan anatomical frame and parses potential pathologies using localized neural vectors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:scale-[1.01] transition duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white font-sans">Visual Anomaly Overlay</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Our model defines percentage-based focal positions, casting interactive box annotations highlighting lesions, densities, or infiltration sites.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:scale-[1.01] transition duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-450 border border-cyan-500/20">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Persistent Analysis Log</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Log reports securely to track changes in scanned studies. Access previous calculations, comparative records, or download patient documentation files.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Flow */}
      <section id="how-it-works" className="py-16 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              How it Works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-500">
              Analyze scans in three intuitive steps using a fully HIPAA-aligned secure sandbox pipeline.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-slate-950 font-mono text-sm font-black shadow-md shadow-teal-500/30">
                1
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Secure Upload</h3>
              <p className="mt-2 max-w-xs text-xs text-slate-500">
                Drag-and-drop or select any clinical medical imaging scan (JPG/PNG). Image remains securely hosted inside container instance.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-slate-950 font-mono text-sm font-black shadow-md shadow-teal-500/30">
                2
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Pixel-sweep AI Analysis</h3>
              <p className="mt-2 max-w-xs text-xs text-slate-500">
                Our specialized multimodal prompt inspects radiological findings, calculates diagnosis rates, and locates area bounds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-slate-950 font-mono text-sm font-black shadow-md shadow-teal-500/30">
                3
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white font-sans">Educational Review</h3>
              <p className="mt-2 max-w-xs text-xs text-slate-500">
                Study visual highlights directly, plot trends via metric graphs, or converse live with MedAssist chatbot to learn definitions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
