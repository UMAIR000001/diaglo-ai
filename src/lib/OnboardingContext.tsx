import { createContext, useContext, useState, type ReactNode } from "react";

export interface OnboardingStep1Data {
  age: string;
  gender: string;
  height: string;
  weight: string;
}

export interface OnboardingStep2Data {
  diabetesType: string;
  diabetesOther: string;
  medications: string;
  symptoms: string[];
  healthConditions: string[];
}

export interface OnboardingStep3Data {
  activityLevel: string;
  sleepHours: number;
  sleepQuality: string;
  hydrationCups: number;
  dietaryPreferences: string[];
  dietaryOther: string;
}

export interface OnboardingData {
  step1: OnboardingStep1Data | null;
  step2: OnboardingStep2Data | null;
  step3: OnboardingStep3Data | null;
}

interface OnboardingContextType {
  data: OnboardingData;
  setStep1Data: (data: OnboardingStep1Data) => void;
  setStep2Data: (data: OnboardingStep2Data) => void;
  setStep3Data: (data: OnboardingStep3Data) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    step1: null,
    step2: null,
    step3: null,
  });

  function setStep1Data(step1: OnboardingStep1Data) {
    setData((prev) => ({ ...prev, step1 }));
  }

  function setStep2Data(step2: OnboardingStep2Data) {
    setData((prev) => ({ ...prev, step2 }));
  }

  function setStep3Data(step3: OnboardingStep3Data) {
    setData((prev) => ({ ...prev, step3 }));
  }

  return (
    <OnboardingContext.Provider value={{ data, setStep1Data, setStep2Data, setStep3Data }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return ctx;
}