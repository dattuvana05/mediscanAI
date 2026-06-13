import React from "react";
import { User, MedicalReport } from "../types";
import { 
  History, 
  User as UserIcon, 
  Trash2, 
  ChevronRight, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Layers, 
  FileCheck 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

interface DashboardHistoryProps {
  user: User;
  reports: MedicalReport[];
  onSelectReport: (report: MedicalReport) => void;
  onDeleteReport: (id: string) => void;
  isLoading: boolean;
}

export default function DashboardHistory({ 
  user, 
  reports, 
  onSelectReport, 
  onDeleteReport,
  isLoading 
}: DashboardHistoryProps) {

  // Prepare simple chart metrics
  const getChartData = () => {
    if (reports.length === 0) return [];
    
    // Reverse files to chronological order to plot left-to-right
    return [...reports]
      .reverse()
      .slice(-8) // Take last 8 studies
      .map((rep) => ({
        date: new Date(rep.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
        confidence: rep.analysis.confidence,
        scan: rep.analysis.scanType,
        condition: rep.analysis.condition,
      }));
  };

  const getConditionBreakdown = () => {
    const counts: { [key: string]: number } = {};
    reports.forEach((r) => {
      const cond = r.analysis.condition || "Other";
      counts[cond] = (counts[cond] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  };

  const chartData = getChartData();
  const breakdownData = getConditionBreakdown();

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header Profile Widget */}
      <div className="glass-panel rounded-2xl border border-slate-200/60 bg-white/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <UserIcon className="h-7 w-7 text-teal-450" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-500 dark:text-teal-400">
                Authorized Lab Clinician
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {user.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 divide-x divide-slate-200 dark:divide-slate-800">
            <div className="text-center px-4">
              <span className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Total Scans
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {reports.length}
              </span>
            </div>
            <div className="text-center px-4">
              <span className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Joined Date
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {reports.length > 0 ? (
        <>
          {/* 2. Visual Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analysis Confidence Trend */}
            <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Diagnostic Confidence Trace
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Percentage confidence history across uploaded studies
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-teal-400" />
              </div>
              
              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(45,212,191,0.2)", borderRadius: "12px", color: "#fff" }}
                      itemStyle={{ color: "#2dd4bf" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#2dd4bf" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorConfidence)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pathological Category Distribution */}
            <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pathological Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Occurrences per categorized detection label
                  </p>
                </div>
                <Layers className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", color: "#fff" }}
                      itemStyle={{ color: "#34d399" }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. History List */}
          <div className="space-y-4">
            <h3 className="text-md font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-teal-400" />
              Analytic Scan History
            </h3>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Syncing database assets...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <div 
                    key={report.id}
                    className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 hover:border-teal-500/50 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Tiny visual image preview in left hand margin */}
                    <div className="flex items-start gap-3.5">
                      <div className="h-14 w-14 flex-shrink-0 bg-slate-900 rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-800">
                        <img 
                          src={report.imageUrl} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono bg-teal-500/10 text-teal-700 px-2.0 py-0.5 rounded-full dark:text-teal-400 border border-teal-500/25 truncate max-w-[120px]">
                            {report.analysis.scanType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="mt-1.5 text-xs font-bold text-slate-900 dark:text-white truncate">
                          {report.analysis.condition}
                        </h4>
                        
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                          File: {report.fileName} ({report.fileSize})
                        </p>
                      </div>
                    </div>

                    {/* Footer / Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{report.analysis.confidence}%</span>
                        
                        <span className="ml-2 text-slate-400">Severity:</span>
                        <span className={`font-extrabold ${
                          report.analysis.severity === "High" ? "text-rose-500" :
                          report.analysis.severity === "Moderate" ? "text-amber-500" : "text-emerald-500"
                        }`}>{report.analysis.severity}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick View */}
                        <button
                          onClick={() => onSelectReport(report)}
                          className="flex items-center gap-1 text-[11px] font-bold text-teal-550 hover:text-teal-400 dark:text-teal-400"
                        >
                          View Results
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to permanently erase this report from database registry?")) {
                              onDeleteReport(report.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:text-slate-500 transition"
                          title="Erase registry log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="glass-panel py-12 rounded-2xl border text-center dark:border-slate-800 bg-white dark:bg-slate-900 border-slate-200">
          <FileCheck className="h-10 w-10 text-slate-400 mx-auto animate-pulse" />
          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            No diagnostic reports recorded
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
            Click on "Launch Diagnostic AI" and drop or select an X-Ray, MRI, or CT scan to register your first healthcare study!
          </p>
        </div>
      )}
    </div>
  );
}
