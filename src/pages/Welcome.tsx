import { useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { ROUTES } from "../lib/types";

export default function Welcome() {
  const navigate = useNavigate();

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

      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full z-10">
        {/* Icon — animated in */}
        <div className="flex justify-center mb-8 animate-welcome-fadeIn">
          <div className="relative flex items-center justify-center w-24 h-24">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-pulse" />
            {/* Outer ring */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-xl shadow-teal-500/30" />
            {/* Inner fill */}
            <div className="absolute inset-2 rounded-full bg-white" />
            {/* Icon */}
            <HeartPulse
              size={40}
              className="relative text-teal-600"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center text-4xl font-heading font-bold text-slate-900 mb-2 animate-welcome-slideUp"
          style={{ animationDelay: "150ms", animationFillMode: "both" }}
        >
          Welcome to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
            Diaglo AI
          </span>
        </h1>

        {/* Motto */}
        <p
          className="text-center text-teal-600 font-heading font-semibold text-base mb-8 animate-welcome-slideUp"
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          Your culturally aware diabetes care assistant.
        </p>

        {/* Trust & Transparency Card */}
        <div
          className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/80 shadow-lg shadow-slate-200/50 p-6 mb-10 animate-welcome-slideUp"
          style={{ animationDelay: "450ms", animationFillMode: "both" }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-teal-600"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-heading font-bold text-slate-800 mb-1">
                Your privacy matters
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                To generate highly accurate, personalized health insights, we need
                to understand your unique baseline. In the next steps, we will
                collect your basic medical and lifestyle information. This ensures
                your AI recommendations are tailored exactly to you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA — fixed at bottom */}
      <div
        className="px-6 pb-8 pt-4 max-w-md mx-auto w-full z-10 animate-welcome-slideUp"
        style={{ animationDelay: "600ms", animationFillMode: "both" }}
      >
        <button
          onClick={() => navigate(ROUTES.ONBOARDING_STEP1)}
          className="w-full rounded-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-heading font-semibold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 ease-out"
        >
          Get Started
        </button>
        <p className="text-center text-xs text-slate-400 mt-4">
          Secure &bull; Private &bull; HIPAA-compliant
        </p>
      </div>
    </div>
  );
}