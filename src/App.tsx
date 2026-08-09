import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import OnboardingStep1 from "./pages/OnboardingStep1";
import OnboardingStep2 from "./pages/OnboardingStep2";
import OnboardingStep3 from "./pages/OnboardingStep3";
import OnboardingStep4 from "./pages/OnboardingStep4";
import DailyDashboard from "./pages/DailyDashboard";
import { OnboardingProvider, useOnboarding } from "./lib/OnboardingContext";
import { GlucoseDataProvider } from "./lib/GlucoseDataContext";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ROUTES } from "./lib/types";

/* ── Protected route wrapper ────────────────────────────────────────── */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate(ROUTES.AUTH, { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-teal-500"
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
          <span className="text-sm text-slate-400">Loading&hellip;</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}

/* ── Onboarding flow with route navigation callbacks ──────────────── */
function OnboardingFlow() {
  const navigate = useNavigate();
  const { setStep1Data, setStep2Data, setStep3Data } = useOnboarding();

  function handleStep1Next(data: Parameters<typeof setStep1Data>[0]) {
    setStep1Data(data);
    navigate(ROUTES.ONBOARDING_STEP2);
  }

  function handleStep2Back() {
    navigate(ROUTES.ONBOARDING_STEP1);
  }

  function handleStep2Next(data: Parameters<typeof setStep2Data>[0]) {
    setStep2Data(data);
    navigate(ROUTES.ONBOARDING_STEP3);
  }

  function handleStep3Back() {
    navigate(ROUTES.ONBOARDING_STEP2);
  }

  function handleStep3Next(data: Parameters<typeof setStep3Data>[0]) {
    setStep3Data(data);
    navigate(ROUTES.ONBOARDING_STEP4);
  }

  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/" element={<Welcome />} />
      <Route path={ROUTES.AUTH} element={<Auth />} />

      {/* Protected onboarding routes */}
      <Route
        path={ROUTES.ONBOARDING_STEP1}
        element={
          <ProtectedRoute>
            <OnboardingStep1 onNext={handleStep1Next} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ONBOARDING_STEP2}
        element={
          <ProtectedRoute>
            <OnboardingStep2 onBack={handleStep2Back} onNext={handleStep2Next} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ONBOARDING_STEP3}
        element={
          <ProtectedRoute>
            <OnboardingStep3 onBack={handleStep3Back} onNext={handleStep3Next} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ONBOARDING_STEP4}
        element={
          <ProtectedRoute>
            <OnboardingStep4 />
          </ProtectedRoute>
        }
      />

      {/* Protected dashboard */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DailyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ── Root App ───────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <GlucoseDataProvider>
            <OnboardingFlow />
          </GlucoseDataProvider>
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}