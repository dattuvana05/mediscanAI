import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, AlertCircle, Info } from "lucide-react";
import { AnalysisResult } from "../types";

interface ChatBotProps {
  activeReport: AnalysisResult | null;
}

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function ChatBot({ activeReport }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am your MedAssist AI assistant. I can help explain radiologic findings, clarify medical definitions, or answer general scan questions. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Alert user when they attach/change active report
  useEffect(() => {
    if (activeReport) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `📎 Study Loaded: I've synced with your "${activeReport.scanType}" report detecting "${activeReport.condition}". Feel free to ask me specifics, like "What does ${activeReport.condition} mean?" or "Explain the confidence rating."`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [activeReport]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          reportContext: activeReport,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.error || "I'm sorry, I encountered an issue retrieving analysis notes. Please ensure your Gemini API Key is configured.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Network transmission error. Verify the server dev backend is listening.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Bubble */}
      {!isOpen && (
        <button
          id="chat-bubble-toggle"
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/35 hover:bg-teal-400 hover:scale-105 transition duration-200 focus:outline-none"
        >
          <MessageSquare className="h-6 w-6 text-slate-950" />
          {activeReport && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white animate-pulse">
              1
            </span>
          )}
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          id="chat-window-panel"
          className="glass-panel flex h-[500px] w-80 sm:w-96 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl transition duration-300 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-950 border-b border-teal-500/20 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">MedAssist Consulting AI</h3>
                <span className="text-[10px] text-teal-400 font-mono">Educational Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active Context Banner */}
          {activeReport && (
            <div className="flex items-center gap-2 bg-emerald-50/80 px-3 py-1.5 text-[11px] text-emerald-800 border-b border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
              <Info className="h-3 w-3 flex-shrink-0" />
              <p className="truncate">
                Synced with <strong>{activeReport.condition}</strong> {activeReport.scanType}
              </p>
            </div>
          )}

          {/* Message List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 dark:bg-slate-950/40"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-teal-500 text-slate-950 font-bold rounded-br-none"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="mt-1 text-[9px] text-slate-400 font-mono tracking-tight px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Bot className="h-4 w-4 animate-bounce text-teal-400" />
                <span>AI Radiologist is consulting...</span>
              </div>
            )}
          </div>

          {/* Disclaimer footer inside chat */}
          <div className="bg-slate-50 dark:bg-slate-950 px-3 py-1 text-[9px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1">
            <AlertCircle className="h-2.5 w-2.5 text-amber-500" />
            <span>Consulting AI simulation. Not primary medical advice.</span>
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-slate-150 p-3 bg-white dark:bg-slate-900 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about radiological findings..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center rounded-lg bg-teal-500 p-2 text-slate-950 hover:bg-teal-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
