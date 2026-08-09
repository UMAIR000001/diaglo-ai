import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import ProgressSteps from "../components/ProgressSteps";
import { useOnboarding } from "../lib/OnboardingContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../lib/types";

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  lightly: "Lightly active",
  moderately: "Moderately active",
  very: "Very active",
  extremely: "Extremely active",
};

const DIABETES_LABELS: Record<string, string> = {
  type1: "Type 1",
  type2: "Type 2",
  gestational: "Gestational",
  prediabetes: "Pre-diabetes",
  other: "Other",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg">
      <h3 className="text-sm font-heading font-bold text-slate-700 uppercase tracking-wide mb-4">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 text-right max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  );
}

export default function OnboardingStep4() {
  const { data } = useOnboarding();
  const navigate = useNavigate();
  const { user } = useAuth();
  const s1 = data.step1;
  const s2 = data.step2;
  const s3 = data.step3;

  // If data is missing, redirect back to step 1
  if (!s1 || !s2 || !s3) {
    navigate(ROUTES.ONBOARDING_STEP1, { replace: true });
    return null;
  }

  async function handleSubmit() {
    if (!user) {
      console.error("No authenticated user found");
      navigate(ROUTES.AUTH, { replace: true });
      return;
    }
    if (!s1 || !s2 || !s3) {
      console.error("Onboarding data incomplete");
      navigate(ROUTES.ONBOARDING_STEP1, { replace: true });
      return;
    }

    // Collect final payload
    const payload = { step1: s1, step2: s2, step3: s3 };
    console.log("🎉 Onboarding complete! Final payload:", payload);

    // Save to profiles table (upsert)
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      age: s1.age,
      gender: s1.gender,
      height_cm: s1.height,
      weight_kg: s1.weight,
      diabetes_type: s2.diabetesType,
      diabetes_other: s2.diabetesOther || null,
      medications: s2.medications || null,
      symptoms: s2.symptoms || [],
      health_conditions: s2.healthConditions || [],
      activity_level: s3.activityLevel,
      sleep_hours: s3.sleepHours,
      sleep_quality: s3.sleepQuality,
      hydration_cups: s3.hydrationCups,
      dietary_preferences: s3.dietaryPreferences || [],
      dietary_other: s3.dietaryOther || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to save profile:", error);
    }

    navigate(ROUTES.DASHBOARD, { replace: true });
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col px-5 py-8 max-w-3xl mx-auto w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <ProgressSteps currentStep={4} totalSteps={4} />
          <p className="text-center text-xs text-slate-400 mt-3 font-medium tracking-wide">
            Step 4 of 4
          </p>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-teal-600"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Review & Submit
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            Please review your information before we create your personalized care plan.
          </p>
        </div>

        {/* Summary cards container */}
        <div className="flex flex-col gap-4 mb-8 overflow-y-auto max-h-[50vh]">
          {/* Personal Info */}
          <Section title="Personal Info">
            <Row label="Age" value={`${s1.age} years`} />
            <Row label="Gender" value={s1.gender} />
            <Row label="Height" value={`${s1.height} cm`} />
            <Row label="Weight" value={`${s1.weight} kg`} />
          </Section>

          {/* Medical Baseline */}
          <Section title="Medical Baseline">
            <Row
              label="Diabetes Type"
              value={DIABETES_LABELS[s2.diabetesType] || s2.diabetesType}
            />
            {s2.diabetesType === "other" && s2.diabetesOther && (
              <Row label="Specified as" value={s2.diabetesOther} />
            )}
            <Row label="Medications" value={s2.medications} />
            <Row
              label="Symptoms"
              value={s2.symptoms.length > 0 ? s2.symptoms.join(", ") : "None"}
            />
            <Row
              label="Health Conditions"
              value={
                s2.healthConditions.length > 0
                  ? s2.healthConditions.join(", ")
                  : "None"
              }
            />
          </Section>

          {/* Lifestyle & Routine */}
          <Section title="Lifestyle & Routine">
            <Row
              label="Activity Level"
              value={ACTIVITY_LABELS[s3.activityLevel] || s3.activityLevel}
            />
            <Row label="Sleep Hours" value={`${s3.sleepHours} hrs`} />
            <Row label="Sleep Quality" value={s3.sleepQuality} />
            <Row label="Water Intake" value={`${s3.hydrationCups} cups/day`} />
            <Row
              label="Dietary Preferences"
              value={
                s3.dietaryPreferences.length > 0
                  ? s3.dietaryPreferences.join(", ")
                  : "—"
              }
            />
            {s3.dietaryPreferences.includes("Other") && s3.dietaryOther && (
              <Row label="Specified as" value={s3.dietaryOther} />
            )}
          </Section>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ONBOARDING_STEP3)}
            className="
              rounded-full border-2 border-slate-200 py-4 font-heading font-semibold text-base
              text-slate-600 bg-white
              transition-all duration-300 ease-out
              hover:border-teal-500/30 hover:text-teal-600 hover:bg-teal-50/50
              active:scale-[0.97]
            "
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="
              rounded-full py-4 font-heading font-semibold text-base
              bg-teal-500 text-white
              shadow-lg shadow-teal-500/25
              transition-all duration-300 ease-out
              hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02]
              active:scale-[0.97]
            "
          >
            Submit
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 pb-6">
        Your information is encrypted and never shared.
      </p>
    </div>
  );
}