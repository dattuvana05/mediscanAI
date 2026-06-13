import React, { useState, useEffect } from "react";
import { 
  Heart, 
  ShieldAlert, 
  Sun, 
  Moon, 
  LogOut, 
  Activity, 
  History, 
  Home, 
  User as UserIcon, 
  Menu, 
  X, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { User, MedicalReport, AuthState } from "./types";
import LandingPage from "./components/LandingPage";
import Uploader from "./components/Uploader";
import DashboardHistory from "./components/DashboardHistory";
import AuthScreen from "./components/AuthScreen";
import ChatBot from "./components/ChatBot";

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function App() {
  // Navigation: "home" | "scanner" | "dashboard"
  const [activeTab, setActiveTab] = useState<"home" | "scanner" | "dashboard">("home");
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Auth State
  const [auth, setAuth] = useState<AuthState>(() => {
    const guestUser: User = {
      id: "guest_user",
      email: "clinician@mediscan.org",
      name: "MediScan Clinician",
      createdAt: new Date().toISOString()
    };
    return {
      user: guestUser,
      token: "mock_guest_token",
    };
  });

  // Reports Log lists
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [activeReport, setActiveReport] = useState<MedicalReport | null>(null);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<Toast | null>(null);

  // Apply dark mode theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Sync profile details and fetch database logs on boot
  useEffect(() => {
    if (auth.token && auth.user) {
      fetchReportsHistory();
    }
  }, [auth.token, auth.user]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchReportsHistory = async () => {
    if (!auth.token || !auth.user) return;
    setIsReportsLoading(true);
    try {
      const response = await fetch("/api/reports/history", {
        headers: {
          "Authorization": `Bearer ${auth.token}`,
          "X-User-Id": auth.user.id
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        const errData = await response.json();
        showToast(errData.error || "Failed to load log history.", "error");
      }
    } catch {
      showToast("Backend connection offline.", "error");
    } finally {
      setIsReportsLoading(false);
    }
  };

  const handleAuthSuccess = (user: User, token: string) => {
    setAuth({ user, token });
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    showToast(`Successfully signed in as ${user.name}`);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setAuth({ user: null, token: null });
    setReports([]);
    setActiveReport(null);
    showToast("Signed out successfully.", "info");
    setActiveTab("home");
  };

  // Callback once uploader gets results back
  const handleAnalysisSuccess = (newReport: MedicalReport) => {
    showToast(`AI diagnostic sweep completed! Condition flagged: ${newReport.analysis.condition}`);
    setReports((prev) => [newReport, ...prev]);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!auth.token || !auth.user) return;
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${auth.token}`,
          "X-User-Id": auth.user.id
        }
      });
      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (activeReport?.id === reportId) {
          setActiveReport(null);
        }
        showToast("Report permanently cleared from study logs.");
      } else {
        showToast("Failed to remove historical report.", "error");
      }
    } catch {
      showToast("Error clearing log entry.", "error");
    }
  };

  const handleSelectReport = (report: MedicalReport) => {
    setActiveReport(report);
    setActiveTab("scanner");
    showToast(`Viewing scan profile details.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* 1. Global Toast Notifications banner */}
      {toast && (
        <div 
          id="global-toast-notification"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl px-5 py-3 text-xs font-semibold shadow-xl border ${
            toast.type === "error" 
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-900" 
              : toast.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-900"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-900"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-rose-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-500 animate-pulse" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 2. Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/50 dark:bg-slate-950/70 dark:border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo brand */}
            <div 
              onClick={() => setActiveTab("home")} 
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.4)] group-hover:scale-105 transition duration-200">
                <Heart className="h-5 w-5 fill-current text-slate-950 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">MediScanAI</h1>
                <p className="text-[9px] font-mono tracking-wider text-teal-500 uppercase">CLINICAL EDUCATION MODULE</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setActiveTab("home")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:text-teal-500 transition ${
                  activeTab === "home" ? "bg-teal-500/10 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20" : ""
                }`}
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => setActiveTab("scanner")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:text-teal-500 transition ${
                  activeTab === "scanner" ? "bg-teal-500/10 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20" : ""
                }`}
              >
                <Activity className="h-4 w-4" />
                AI Diagnostics Scanner
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:text-teal-500 transition ${
                  activeTab === "dashboard" ? "bg-teal-500/10 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20" : ""
                }`}
              >
                <History className="h-4 w-4" />
                Dashboard Logbook
              </button>
            </nav>

            {/* Right Header Panel Actions */}
            <div className="flex items-center gap-4">
              
              {/* Theme toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-500 dark:text-slate-400 dark:hover:bg-slate-900 transition"
                title="Theme preference"
              >
                {darkMode ? <Sun className="h-4 w-5" /> : <Moon className="h-4 w-5" />}
              </button>

              {/* User Account State bubble */}
              <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-xs uppercase border border-teal-500/20">
                    M
                  </div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
                    MediScan Clinician
                  </span>
                </div>
              </div>

              {/* Mobile Menu Action */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-500 dark:hover:bg-slate-900 transition"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 p-4 dark:border-slate-900 bg-white/95 dark:bg-slate-950/95 space-y-2">
            <button
              onClick={() => {
                setActiveTab("home");
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-teal-500 dark:text-slate-300"
            >
              <Home className="h-4 w-4" /> Home
            </button>
            <button
              onClick={() => {
                setActiveTab("scanner");
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-teal-500 dark:text-slate-300"
            >
              <Activity className="h-4 w-4" /> AI Diagnostics Scanner
            </button>
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-teal-500 dark:text-slate-300"
            >
              <History className="h-4 w-4" /> Dashboard Logbook
            </button>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-xs font-bold pl-3 text-slate-500 font-sans">MediScan Clinician</span>
              <span className="text-[10px] font-mono font-medium text-teal-500 px-2 py-0.5 rounded bg-teal-500/10">Active Role</span>
            </div>
          </div>
        )}
      </header>

      {/* 3. Main Stage Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === "home" && (
          <LandingPage 
            onStartUploading={() => setActiveTab("scanner")} 
            isAuthenticated={!!auth.user} 
            onNavigateToAuth={() => setActiveTab("dashboard")} 
          />
        )}

        {activeTab === "scanner" && (
          <Uploader 
            token={auth.token}
            userId={auth.user?.id || null}
            activeReport={activeReport}
            setActiveReport={setActiveReport}
            onAnalysisSuccess={handleAnalysisSuccess}
          />
        )}

        {activeTab === "dashboard" && (
          auth.user ? (
            <DashboardHistory 
              user={auth.user}
              reports={reports}
              isLoading={isReportsLoading}
              onSelectReport={handleSelectReport}
              onDeleteReport={handleDeleteReport}
            />
          ) : (
            <AuthScreen onSuccess={handleAuthSuccess} />
          )
        )}
      </main>

      {/* 4. Conversational Chatbot Assistant Overlay */}
      <ChatBot activeReport={activeReport?.analysis || null} />

      {/* 5. Corporate Footer with Medical Disclaimer bar */}
      <footer className="mt-auto border-t border-slate-200/50 bg-white/40 dark:bg-slate-950/40 dark:border-slate-900 select-none">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-[10px] sm:text-xs text-slate-400 max-w-3xl mx-auto leading-relaxed font-sans">
            <strong>Educational Protocol Notice:</strong> This study suite maps and simulates radiologic analysis of X-Rays, MRIs, and computerized tomography. It uses artificial intelligence algorithms exclusively for education, teaching illustration, and student clinical research templates. Under no conditions should patient users take diagnostic, health prescription, or pharmacological action based on reports. Consult certified doctors for any healthcare symptoms.
          </p>
          <div className="text-[10px] text-slate-500 font-mono flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span>© {new Date().getFullYear()} MedAssist AI Inc. All rights reserved.</span>
            <span className="hover:underline cursor-pointer">Security Protocol Policy</span>
            <span className="hover:underline cursor-pointer">Radiology Training Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
