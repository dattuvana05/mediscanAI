import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, Loader2, Heart, ShieldAlert, Key } from "lucide-react";
import { User } from "../types";

interface AuthScreenProps {
  onSuccess: (user: User, token: string) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!email || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }
    if (!isLogin && !name) {
      setErrorMessage("Please provide your full professional or patient name.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Security password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { email, password } : { email, password, name };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem("remember_email", email);
        } else {
          localStorage.removeItem("remember_email");
        }
        setSuccessMessage(isLogin ? "Welcome back!" : "Account registered successfully.");
        // Short timeout for visual feedback
        setTimeout(() => {
          onSuccess(data.user, data.token);
        }, 1000);
      } else {
        setErrorMessage(data.error || "Authentication procedure failed.");
      }
    } catch {
      setErrorMessage("Connection to healthcare API failed. Ensure the server is active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Please input your registered email address first.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message);
      } else {
        setErrorMessage(data.error);
      }
    } catch {
      setErrorMessage("Failed to initiate automated password assistance loop.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 medical-grid">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Heart className="h-8 w-8 animate-pulse text-teal-500" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans sm:text-3xl">
            {isLogin ? "Medical AI Hub Login" : "Create Healthcare Account"}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {isLogin
              ? "Gain secure clinical-grade analysis of scans"
              : "Register professional or patient credentials"}
          </p>
        </div>

        {/* Authentication Card Grid */}
        <div className="glass-panel mt-8 rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/60">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-rose-50 p-3.5 text-xs font-medium text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Loader2 className="h-4.5 w-4.5 flex-shrink-0 text-emerald-500 animate-spin" />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Jordan West / Patient Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@healthcare.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Security Password
                </label>
              </div>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs text-slate-600 dark:text-slate-400 selection:bg-transparent cursor-pointer"
                >
                  Remember Email
                </label>
              </div>

              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="flex items-center gap-1.5 text-xs font-semibold text-teal-500 hover:text-teal-400 dark:text-teal-400 font-mono hover:underline"
                >
                  <Key className="h-3 w-3 text-teal-400" />
                  Forgot?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-teal-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/15 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Sign In Credentials"
              ) : (
                "Complete Verification registration"
              )}
            </button>
          </form>

          {/* Prompt Toggle */}
          <div className="mt-6 text-center border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-medium text-slate-600 hover:text-teal-500 dark:text-slate-400"
            >
              {isLogin ? (
                <>
                  New analyst here?{" "}
                  <span className="text-teal-500 dark:text-teal-400 font-bold underline">
                    Create a scanner profile
                  </span>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <span className="text-teal-500 dark:text-teal-400 font-bold underline">
                    Sign in here
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
