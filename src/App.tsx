import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import OnboardingStep1 from "./pages/OnboardingStep1";
import OnboardingStep2 from "./pages/OnboardingStep2";
import OnboardingStep3 from "./pages/OnboardingStep3";
import OnboardingStep4 from "./pages/OnboardingStep4";
import DailyDashboard from "./pages/DailyDashboard";
import { OnboardingProvider, useOnboarding } from "./lib/OnboardingContext";
import { GlucoseDataProvider } from "./lib/GlucoseDataContext";
import { ROUTES } from "./lib/types";

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
      <Route path="/" element={<Welcome />} />

      <Route
        path={ROUTES.ONBOARDING_STEP1}
        element={<OnboardingStep1 onNext={handleStep1Next} />}
      />
      <Route
        path={ROUTES.ONBOARDING_STEP2}
        element={
          <OnboardingStep2 onBack={handleStep2Back} onNext={handleStep2Next} />
        }
      />
      <Route
        path={ROUTES.ONBOARDING_STEP3}
        element={
          <OnboardingStep3 onBack={handleStep3Back} onNext={handleStep3Next} />
        }
      />
      <Route
        path={ROUTES.ONBOARDING_STEP4}
        element={<OnboardingStep4 />}
      />

      <Route path={ROUTES.DASHBOARD} element={<DailyDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <OnboardingProvider>
        <GlucoseDataProvider>
          <OnboardingFlow />
        </GlucoseDataProvider>
      </OnboardingProvider>
    </BrowserRouter>
  );
}