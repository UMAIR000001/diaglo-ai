import { useState, useMemo } from "react";
import InputField from "../components/InputField";
import ProgressSteps from "../components/ProgressSteps";
import BmiPreviewCard from "../components/BmiPreviewCard";

interface Props {
  onNext: (data: OnboardingStep1Data) => void;
}

export interface OnboardingStep1Data {
  age: string;
  gender: string;
  height: string;
  weight: string;
}

const GENDERS = ["Male", "Female", "Other"] as const;

function validate(data: OnboardingStep1Data): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.age || Number(data.age) < 1 || Number(data.age) > 120) {
    errors.age = "Please enter a valid age (1–120).";
  }
  if (!data.gender) {
    errors.gender = "Please select your gender.";
  }
  if (!data.height || Number(data.height) < 50 || Number(data.height) > 300) {
    errors.height = "Please enter a valid height (50–300 cm).";
  }
  if (!data.weight || Number(data.weight) < 10 || Number(data.weight) > 500) {
    errors.weight = "Please enter a valid weight (10–500 kg).";
  }

  return errors;
}

export default function OnboardingStep1({ onNext }: Props) {
  const [form, setForm] = useState<OnboardingStep1Data>({
    age: "",
    gender: "",
    height: "",
    weight: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const isValid = useMemo(() => Object.keys(validate(form)).length === 0, [form]);

  function updateField(field: keyof OnboardingStep1Data, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    // Clear error on change if already touched
    if (touched.has(field)) {
      const errs = validate(next);
      setErrors((prev) => {
        const copy = { ...prev };
        if (errs[field]) copy[field] = errs[field];
        else delete copy[field];
        return copy;
      });
    }
  }

  function handleBlur(field: keyof OnboardingStep1Data) {
    setTouched((prev) => new Set(prev).add(field));
    const errs = validate(form);
    setErrors((prev) => {
      const copy = { ...prev };
      if (errs[field]) copy[field] = errs[field];
      else delete copy[field];
      return copy;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(new Set(["age", "gender", "height", "weight"]));
    if (Object.keys(errs).length === 0) {
      onNext(form);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      {/* Top spacing */}
      <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-3xl mx-auto w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <ProgressSteps currentStep={1} totalSteps={4} />
          <p className="text-center text-xs text-slate-400 mt-3 font-medium tracking-wide">
            Step 1 of 4
          </p>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Let's get to know you
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            We'll use this to personalize your diabetes care plan. Your data stays private and secure.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 flex flex-col gap-5">
          <InputField
            label="Age"
            name="age"
            type="number"
            value={form.age}
            onChange={(v) => updateField("age", v)}
            onBlur={() => handleBlur("age")}
            placeholder="e.g. 45"
            min={1}
            max={120}
            suffix="years"
            error={touched.has("age") ? errors.age : undefined}
            required
            inputMode="numeric"
          />

          {/* Gender select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Gender <span className="text-destructive ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Gender">
              {GENDERS.map((g) => {
                const selected = form.gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      updateField("gender", g);
                      setTouched((prev) => new Set(prev).add("gender"));
                    }}
                    onBlur={() => handleBlur("gender")}
                    className={`
                      rounded-xl border-2 py-3 px-2 text-sm font-medium
                      transition-all duration-150 ease-out
                      ${selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-slate-700"
                      }
                    `}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            {touched.has("gender") && errors.gender && (
              <p role="alert" className="text-xs text-destructive mt-0.5">{errors.gender}</p>
            )}
          </div>

          {/* Height & Weight side by side */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Height"
              name="height"
              type="number"
              value={form.height}
              onChange={(v) => updateField("height", v)}
              onBlur={() => handleBlur("height")}
              placeholder="e.g. 170"
              min={50}
              max={300}
              suffix="cm"
              error={touched.has("height") ? errors.height : undefined}
              required
              inputMode="numeric"
            />
            <InputField
              label="Weight"
              name="weight"
              type="number"
              value={form.weight}
              onChange={(v) => updateField("weight", v)}
              onBlur={() => handleBlur("weight")}
              placeholder="e.g. 72"
              min={10}
              max={500}
              suffix="kg"
              error={touched.has("weight") ? errors.weight : undefined}
              required
              inputMode="decimal"
            />
          </div>

          {/* Real-time BMI Preview Card */}
          <BmiPreviewCard heightCm={form.height} weightKg={form.weight} />

          {/* Next button */}
          <button
            type="submit"
            disabled={!isValid && touched.size === 4}
            className={`
              mt-4 w-full rounded-full py-4 font-heading font-semibold text-base
              transition-all duration-300 ease-out
              active:scale-[0.97]
              ${isValid
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }
            `}
          >
            Next
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 pb-6">
        Your information is encrypted and never shared.
      </p>
    </div>
  );
}