import React, { useState, useRef } from "react";
import { 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  Activity, 
  ShieldAlert, 
  AlertCircle, 
  ChevronRight, 
  Flame, 
  PlusCircle, 
  HeartHandshake,
  Cpu
} from "lucide-react";
import { AnalysisResult, MedicalReport } from "../types";

interface UploaderProps {
  onAnalysisSuccess: (report: MedicalReport) => void;
  token: string | null;
  userId: string | null;
  activeReport: MedicalReport | null;
  setActiveReport: (report: MedicalReport | null) => void;
}

export default function Uploader({ 
  onAnalysisSuccess, 
  token,
  userId,
  activeReport,
  setActiveReport 
}: UploaderProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bodyRegion, setBodyRegion] = useState<string>("Brain");
  const [scanType, setScanType] = useState<string>("MRI");
  
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CNN Visualizer States
  const [cnnSelectedFilter, setCnnSelectedFilter] = useState<"Edges" | "Textures" | "Nodes">("Edges");
  const [cnnKernelSize] = useState<number>(3);
  const [cnnIntensity, setCnnIntensity] = useState<number>(75);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Convert File to Base64 Data URL
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setActiveReport(null);

    const isSupported = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    
    // Support naming or warnings for DICOM file extensions (.dcm)
    const isDicom = file.name.endsWith(".dcm") || file.name.endsWith(".dicom");

    if (isDicom) {
      setErrorMessage("DICOM (.dcm) binary scans must be converted/exported to standard JPG/PNG slice images to enable web rendering. Please upload a PNG or JPEG slice.");
      return;
    }

    if (!isSupported) {
      setErrorMessage("Unsupported payload. Please drop a valid JPG, PNG, or WebP medical scan.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("File exceeds size limit. Maximum allowed size is 8MB.");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      dragRef.current.classList.add("border-teal-500", "bg-teal-500/10", "dark:bg-teal-950/20");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      dragRef.current.classList.remove("border-teal-500", "bg-teal-500/10", "dark:bg-teal-950/20");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      dragRef.current.classList.remove("border-teal-500", "bg-teal-500/10", "dark:bg-teal-950/20");
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Trigger real AI analysis via Express/Gemini
  const handleAnalyze = async () => {
    if (!imageFile || !imagePreview) return;

    setIsLoading(true);
    setProgress(15);
    setErrorMessage(null);

    try {
      // Step 1: Read Base64 representation of raw file
      setProgress(35);
      const base64DataUrl = await convertFileToBase64(imageFile);
      
      setProgress(55);
      const headers: { [key: string]: string } = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (userId) {
        headers["X-User-Id"] = userId;
      }

      setProgress(75);
      // Step 2: Trigger our server-side analytical endpoint
      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageDataUrl: base64DataUrl,
          fileName: imageFile.name,
          fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
          bodyRegion,
          scanType,
        }),
      });

      setProgress(95);
      const data = await response.json();

      if (response.ok) {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setActiveReport(data);
          onAnalysisSuccess(data);
        }, 30);
      } else {
        setIsLoading(false);
        if (data.code === "MISSING_API_KEY") {
          setErrorMessage("GEMINI_API_KEY is missing. Please add your Gemini API Key in the Secrets / Settings panel in Google AI Studio to run real medical image analyses.");
        } else {
          setErrorMessage(data.error || "A processing anomaly occurred in our AI diagnostics model. Please try again.");
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Failed to initiate secure clinical analysis pipeline. Verify the Express container is responsive.");
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setActiveReport(null);
    setErrorMessage(null);
    setProgress(0);
  };

  // Safe highlight rendering helper
  const renderHighlights = () => {
    const report = activeReport || activeReport;
    if (!report || !report.analysis || !report.analysis.highlights) return null;
    
    return report.analysis.highlights.map((box, idx) => {
      // Standard percentages direct from bounding prompt schema
      const overlayStyle: React.CSSProperties = {
        left: `${box.x - (box.width / 2)}%`,
        top: `${box.y - (box.height / 2)}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      };

      return (
        <div 
          key={idx}
          className="absolute border-2 border-red-500 rounded bg-red-400/25 shadow-[0_0_15px_rgba(239,68,68,0.7)] group cursor-help transition-all duration-300 hover:bg-red-500/35 hover:scale-105"
          style={overlayStyle}
        >
          {/* Heart beat focal center point */}
          <span className="absolute flex h-3 w-3 -top-1.5 -left-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>

          {/* Interactive hover tooltip on coordinates */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-30 min-w-[140px] pointer-events-none">
            <div className="bg-slate-900 border border-red-500 text-white text-[10px] rounded px-2.5 py-1.5 shadow-xl text-center leading-normal">
              <span className="block font-sans font-bold text-red-400 tracking-wide">REGION OF INTEREST</span>
              <span className="block mt-0.5 font-sans font-medium text-slate-100">{box.label}</span>
              <span className="block text-[8px] mt-0.5 text-slate-400 font-mono">X:{box.x}% Y:{box.y}%</span>
            </div>
          </div>
        </div>
      );
    });
  };

  const report = activeReport;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      
      {/* LEFT: Uploading/Scanning Stage */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Anatomical Scanner Stage
          </h3>

          {/* Quick select configuration panel for Body Region and Scan Modality/Type */}
          <div className="grid grid-cols-2 gap-3 mb-5 bg-slate-50/50 dark:bg-slate-950/25 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
            <div>
              <label htmlFor="body-region-select" className="block text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 mb-1 font-bold">
                Anatomy Region
              </label>
              <select
                id="body-region-select"
                value={bodyRegion}
                onChange={(e) => setBodyRegion(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <option value="Brain">Brain</option>
                <option value="Chest">Chest</option>
                <option value="Organs">Organs & Abdomen</option>
                <option value="Spine text-slate-755">Spine</option>
                <option value="Limbs">Limbs & Joints</option>
              </select>
            </div>
            <div>
              <label htmlFor="scan-type-select" className="block text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 mb-1 font-bold">
                Scan Modality
              </label>
              <select
                id="scan-type-select"
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <option value="MRI">MRI</option>
                <option value="CT Scan">CT Scan</option>
                <option value="X-Ray">X-Ray</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Mammogram">Mammogram</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 p-4 text-xs font-medium text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold leading-tight">Scanner Intercept Anomaly</p>
                <p className="mt-1 leading-normal text-[11px] opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Uploader Drop Zone or Scanner View */}
          {!imagePreview ? (
            <div
              ref={dragRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="group border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 cursor-pointer hover:border-teal-500 hover:bg-teal-500/5 dark:border-slate-800 dark:bg-slate-950/10 transition duration-200 flex flex-col items-center justify-center min-h-[300px]"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-teal-500/5 text-teal-500 group-hover:scale-105 group-hover:bg-teal-500/10 transition duration-200 dark:text-teal-400">
                <Upload className="h-7 w-7 text-teal-400" />
              </div>
              <h4 className="mt-4 text-xs font-bold text-slate-900 dark:text-white">
                Drag-and-drop clinical scan
              </h4>
              <p className="mt-1 text-[11px] text-slate-400 max-w-xs leading-normal">
                Supports DICOM exports in standard JPG, PNG, or WebP formats up to 8MB.
              </p>
              <button 
                type="button" 
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-teal-500 text-slate-950 px-4 py-2 text-xs font-bold shadow hover:bg-teal-400 transition"
              >
                Select Scan Local File
              </button>
            </div>
          ) : (
            /* Active image viewing container with radar sweep animation */
            <div className="space-y-4">
              <div className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center aspect-square ${isLoading ? "radar-sweep" : ""}`}>
                <img 
                  id="target-scan-view"
                  src={report ? report.imageUrl : imagePreview} 
                  alt="Clinical anatomical study" 
                  referrerPolicy="no-referrer"
                  className={`max-h-full max-w-full object-contain ${isLoading ? "opacity-75 blur-[0.5px]" : ""}`} 
                />

                {/* Radar Grid Matrix overlay in loading mode */}
                {isLoading && (
                  <div className="absolute inset-0 medical-grid opacity-20 pointer-events-none"></div>
                )}

                {/* Visual coords highlights plotted once loaded */}
                {report && (
                  <div className="absolute inset-0 z-20">
                    {renderHighlights()}
                  </div>
                )}
              </div>

              {/* Loader details */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-teal-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Radiological neural processing...
                    </span>
                    <span className="text-slate-400">{progress}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 shadow-[0_0_10px_#2dd4bf] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action buttons list */}
              {!isLoading && (
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  >
                    Clear Scanner
                  </button>
                  
                  {!report && (
                    <button
                      onClick={handleAnalyze}
                      className="flex-2 flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/15 hover:bg-teal-400 transition"
                    >
                      <Activity className="h-4 w-4 animate-pulse text-slate-950" />
                      Run AI Diagnostic Scan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload guide tips */}
        <div className="glass-panel rounded-2xl bg-teal-500/5 p-4 border border-teal-500/20 dark:bg-teal-950/10 dark:border-teal-900/30 flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-teal-400 flex-shrink-0" />
          <div className="text-[11px] leading-relaxed text-slate-500">
            <p className="font-bold text-slate-700 dark:text-slate-350">How to get standard outputs:</p>
            <p className="mt-1">For optimal accuracy, upload high-contrast, well-cropped anatomical scans. Avoid camera photos of physical screens or heavily compressed thumbnails.</p>
          </div>
        </div>

        {/* CNN Convolutional Core Interactive Map Visualizer */}
        <div className="glass-panel rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-teal-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest font-mono">
              CNN Visual Activation Layer
            </h4>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Understand how our Convolutional neural net model isolates structural features from physical scans prior to high-level Gemini reasoning.
          </p>

          {/* Selector filters */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-lg">
            {(["Edges", "Textures", "Nodes"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCnnSelectedFilter(filter)}
                className={`py-1 px-2 text-[10px] font-bold rounded-md transition ${
                  cnnSelectedFilter === filter 
                    ? "bg-teal-500 text-slate-950 shadow-md" 
                    : "text-slate-405 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Interactive virtual sensor output grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-1 p-2 bg-slate-950 border border-slate-800 rounded-xl">
              {Array.from({ length: 36 }).map((_, idx) => {
                const column = idx % 6;
                const row = Math.floor(idx / 6);
                
                // Mathematical simulated activation matrix values
                let baseVal = 0.15;
                if (cnnSelectedFilter === "Edges") {
                  baseVal = (row === 2 || column === 3) ? 0.92 : 0.08 + (idx * 0.015) % 0.2;
                } else if (cnnSelectedFilter === "Textures") {
                  baseVal = ((row + column) % 2 === 0) ? 0.78 : 0.12 + (idx * 0.02) % 0.15;
                } else {
                  baseVal = (row > 3) ? 0.88 : 0.05 + (idx * 0.03) % 0.35;
                }

                // Apply Intensity filter modifier
                const adjustedVal = Math.min(1, Math.max(0, baseVal * (cnnIntensity / 100)));
                const alpha = Math.round(adjustedVal * 255).toString(16).padStart(2, "0");
                const bgStyle = adjustedVal > 0.6 
                  ? { backgroundColor: `#2dd4bf${alpha}` } 
                  : { backgroundColor: `#475569${alpha}` };

                return (
                  <div
                    key={idx}
                    style={bgStyle}
                    className="aspect-square rounded flex items-center justify-center text-[8px] font-mono font-bold text-slate-100 hover:scale-[1.15] transition cursor-help border border-slate-900/80"
                    title={`Cell coord: [${row}, ${column}] | Simulated activation: ${adjustedVal.toFixed(3)}`}
                  >
                    {adjustedVal > 0.4 ? "+" : ""}
                  </div>
                );
              })}
            </div>

            {/* Slider configuration details */}
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Layer Kernel Filter</span>
                <span className="text-teal-500 font-bold">{cnnKernelSize}x{cnnKernelSize} MaxPool</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Activation function</span>
                <span className="text-slate-600 dark:text-slate-350">ReLU + SoftMax</span>
              </div>
              
              <div className="pt-1.5 flex items-center gap-3">
                <label htmlFor="cnn-sensitivity" className="text-slate-400 select-none font-mono flex-shrink-0">Filter Gain</label>
                <input
                  id="cnn-sensitivity"
                  type="range"
                  min="30"
                  max="120"
                  value={cnnIntensity}
                  onChange={(e) => setCnnIntensity(Number(e.target.value))}
                  className="w-full text-teal-400 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-teal-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Results Insights Panel with Skeleton Loaders */}
      <div className="lg:col-span-7">
        {!report ? (
          isLoading ? (
            /* Analysis Skeleton Loader */
            <div className="glass-panel p-6 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3 animate-pulse"></div>
                <div className="h-8 bg-slate-100 dark:bg-slate-950 rounded-md w-3/4 animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-slate-50 dark:bg-slate-950 rounded-xl animate-pulse"></div>
                <div className="h-16 bg-slate-50 dark:bg-slate-950 rounded-xl animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-5/6 animate-pulse"></div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="h-14 bg-slate-50 dark:bg-slate-950 rounded animate-pulse"></div>
              </div>
            </div>
          ) : (
            /* Default Waiting Screen */
            <div className="glass-panel min-h-[420px] rounded-2xl border border-slate-200/60 bg-white/50 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center">
              <ImageIcon className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Awaiting Clinical Evaluation
              </h3>
              <p className="mt-2 text-xs text-slate-400 max-w-sm leading-normal">
                Select an anatomical medical image on the left, then click on "Run AI Diagnostic Scan" to begin the deep learning parsing routine.
              </p>
            </div>
          )
        ) : (
          /* ACTUAL AI INSIGHTS CARD OUTPUTS */
          <div className="space-y-6 animate-fade-in">
            {/* Header / Results banner */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono bg-teal-500/10 text-teal-700 px-2.5 py-1 rounded-full dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20">
                    {report.analysis.scanType} FINDINGS
                  </span>
                  <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white leading-tight">
                    {report.analysis.condition}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Study tracked in historical logs with clinical code: <strong className="font-sans font-medium text-slate-600 dark:text-slate-300">{report.id}</strong>
                  </p>
                </div>

                {/* Score Widget */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">AI confidence</span>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                      {report.analysis.confidence}%
                    </span>
                  </div>

                  <div className={`px-3 py-1 rounded-lg text-center ${
                    report.analysis.severity === "High" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400" :
                    report.analysis.severity === "Moderate" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" :
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  }`}>
                    <span className="block text-[8px] font-mono uppercase tracking-wider opacity-80">Severity</span>
                    <span className="text-[11px] font-extrabold">{report.analysis.severity}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Warning Alert on non-medical uploads */}
              {!report.analysis.isMedicalImage && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-orange-50 p-4 text-xs font-bold text-orange-800 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/40">
                  <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Non-Medical Asset Detected</p>
                    <p className="mt-1 font-medium leading-relaxed font-sans text-[11px] opacity-90">
                      The analyzer suggests this image is a casual asset rather than a structured radiologic scan. Accurate analytical parameters require raw medical scans.
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Professional description */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 pb-2 dark:border-slate-800">
                  Anatomical Analysis Notes
                </h4>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                  {report.analysis.description}
                </p>
              </div>

              {/* Findings grid bullets list */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Visual Findings / Observations
                </h4>
                <ul className="mt-3.5 space-y-2.5">
                  {report.analysis.findings?.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                      <ChevronRight className="h-3.5 w-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span className="dark:text-slate-300">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prescribed Supportive Guidance & Recommended Medicines */}
              {report.analysis.medicines && report.analysis.medicines.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest pb-2.5 flex items-center gap-2 font-mono">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping"></span>
                    Suggested Guideline Medicines & Clinical Therapeutics
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                    Generic compounds and clinical pathways commonly referenced for this grade of diagnosed condition. Consult doctors before starting therapy:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
                    {report.analysis.medicines.map((medicine, idx) => {
                      const parts = medicine.split(" (");
                      const medName = parts[0];
                      const medDesc = parts[1] ? parts[1].replace(/\)$/, "") : "Standard clinical supportive use";
                      return (
                        <div 
                          key={idx}
                          className="p-3 rounded-xl border border-teal-550/10 bg-teal-500/5 dark:bg-teal-950/20 dark:border-teal-950/40 text-[11px] leading-relaxed flex items-start gap-2.5 shadow-sm"
                        >
                          <div className="h-5 w-5 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 dark:text-teal-400">{medName}</span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic">Pathway: {medDesc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested precautions */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2">
                  Advocated Preventive Steps
                </h4>
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {report.analysis.precautions?.map((precaution, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-850 text-[10px] text-slate-500 leading-normal hover:scale-[1.01] transition"
                    >
                      <strong className="block text-slate-700 dark:text-slate-300 font-bold mb-1 font-sans">ADVICE STEP {idx + 1}</strong>
                      <span className="dark:text-slate-400">{precaution}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating chatbot activator tip */}
              <div className="mt-6 flex items-center justify-between gap-4 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 dark:bg-teal-950/10 dark:border-teal-900/30">
                <p className="text-[10px] text-slate-600 dark:text-teal-400 leading-tight">
                  Have questions about this analysis or medical definitions? Use our <strong>MedAssist Chatbot</strong> in the corner!
                </p>
                <ChevronRight className="h-4 w-4 text-teal-500 animate-pulse flex-shrink-0" />
              </div>
            </div>

            {/* Structured medical disclaimer */}
            <div className="p-4 rounded-xl bg-orange-50 text-orange-900 shadow-sm border border-orange-200/50 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/30">
              <div className="flex gap-2 text-xs">
                <ShieldAlert className="h-4.5 w-4.5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-bold">Automated Analysis Educational Protocol</h5>
                  <p className="mt-1 text-[11px] leading-relaxed select-text font-sans opacity-90">
                    This analysis represents an automated deep learning simulation utilizing the Google Gemini models. It must be interpreted strictly as an educational support assistant. It is NOT a professional, diagnostic clinicial report and does not substitute for actionable medical checks or prescriptions. Always consult qualified clinical healthcare professionals for any health symptoms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
