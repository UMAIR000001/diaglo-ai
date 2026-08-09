import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ROUTES } from "../lib/types";
import { useAuth } from "../lib/AuthContext";
import { HeartPulse } from "lucide-react";

type AuthMode = "login" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If already logged in, redirect to onboarding
  useEffect(() => {
    if (session) {
      navigate(ROUTES.ONBOARDING_STEP1, { replace: true });
    }
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError) throw signInError;
        // Auth state listener will react and redirect
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;

        if (data?.session) {
          // Signed in immediately (no email confirmation)
          // Auth listener will redirect
        } else {
          // Email confirmation required
          setMessage(
            "Account created! Check your email for a confirmation link before signing in.",
          );
          setMode("login");
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-gradient-to-b from-teal-50/60 via-white to-slate-50 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-teal-200/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-amber-200/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full z-10">
        {/* Brand */}
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-pulse" />
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-xl shadow-teal-500/30" />
            <div className="absolute inset-2 rounded-full bg-white" />
            <HeartPulse
              size={26}
              className="relative text-teal-600"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-slate-900">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {mode === "login"
              ? "Sign in to your Diaglo AI account"
              : "Start your personalised diabetes care journey"}
          </p>
        </div>

        {/* Glass card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/80 shadow-lg shadow-slate-200/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="
                  w-full rounded-xl border border-slate-200 bg-slate-50
                  px-4 py-3 text-slate-900 placeholder:text-slate-400
                  text-base
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                "
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                className="
                  w-full rounded-xl border border-slate-200 bg-slate-50
                  px-4 py-3 text-slate-900 placeholder:text-slate-400
                  text-base
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                "
              />
              {mode === "signup" && (
                <p className="text-xs text-slate-400 mt-1.5">
                  At least 6 characters
                </p>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success message (e.g. after signup with email confirmation) */}
            {message && (
              <div className="flex items-start gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full rounded-full py-3.5 font-heading font-semibold text-base
                transition-all duration-300 ease-out
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-teal-500 focus-visible:ring-offset-2
                ${
                  loading
                    ? "bg-teal-400 text-white/80 cursor-wait"
                    : "bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Please wait&hellip;
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                  setMessage(null);
                }}
                className="ml-1 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; Back to home
          </button>
        </div>
      </div>
    </div>
  );
}