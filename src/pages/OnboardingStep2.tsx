import { useState, useMemo } from "react";
import ProgressSteps from "../components/ProgressSteps";

interface Props {
  onBack: () => void;
  onNext: (data: OnboardingStep2Data) => void;
}

export interface OnboardingStep2Data {
  diabetesType: string;
  diabetesOther: string;
  medications: string;
  symptoms: string[];
  healthConditions: string[];
}

const DIABETES_TYPES = [
  { value: "type1", label: "Type 1" },
  { value: "type2", label: "Type 2" },
  { value: "gestational", label: "Gestational" },
  { value: "prediabetes", label: "Pre-diabetes" },
  { value: "other", label: "Other" },
] as const;

const SYMPTOM_OPTIONS = [
  "Frequent urination",
  "Excessive thirst",
  "Increased hunger",
  "Fatigue",
  "Blurred vision",
  "Slow-healing wounds",
  "Numbness / tingling",
  "Unexplained weight loss",
  "Frequent infections",
  "None of the above",
] as const;

const CONDITION_OPTIONS = [
  "Hypertension (High BP)",
  "High cholesterol",
  "Thyroid disorder",
  "Kidney disease",
  "Heart disease",
  "Asthma",
  "Anemia",
  "Arthritis",
  "Depression / Anxiety",
  "None",
  "Other",
] as const;

function validate(data: OnboardingStep2Data): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.diabetesType) {
    errors.diabetesType = "Please select your diabetes type.";
  }
  if (data.diabetesType === "other" && !data.diabetesOther.trim()) {
    errors.diabetesOther = "Please specify your diabetes type.";
  }
  if (!data.medications.trim()) {
    errors.medications = "Please list your current medications.";
  }
  if (data.symptoms.length === 0) {
    errors.symptoms = "Please select any symptoms you're experiencing.";
  }
  if (data.healthConditions.length === 0) {
    errors.healthConditions = "Please select any relevant health conditions.";
  }

  return errors;
}

function ChipGroup<T extends string>({
  options,
  selected,
  onChange,
  label,
  required,
  error,
  touched,
}: {
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
  label: string;
  required?: boolean;
  error?: string;
  touched: boolean;
}) {
  function toggle(option: T) {
    if (option === "None" as T || option === "None of the above" as T) {
      onChange([option]);
      return;
    }
    // Clear "None" / "None of the above" if another option is selected
    const filtered = selected.filter(
      (s) => s !== "None" as T && s !== "None of the above" as T
    );
    if (filtered.includes(option)) {
      onChange(filtered.filter((s) => s !== option));
    } else {
      onChange([...filtered, option]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(option)}
              className={`
                rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium
                transition-all duration-150 ease-out
                ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-slate-700"
                }
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
      {touched && error && (
        <p role="alert" className="text-xs text-destructive mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

export default function OnboardingStep2({ onBack, onNext }: Props) {
  const [form, setForm] = useState<OnboardingStep2Data>({
    diabetesType: "",
    diabetesOther: "",
    medications: "",
    symptoms: [],
    healthConditions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const isValid = useMemo(
    () => Object.keys(validate(form)).length === 0,
    [form]
  );

  function updateField<K extends keyof OnboardingStep2Data>(
    field: K,
    value: OnboardingStep2Data[K]
  ) {
    const next = { ...form, [field]: value };
    setForm(next);
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

  function handleBlur(field: keyof OnboardingStep2Data) {
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
    setTouched(
      new Set([
        "diabetesType",
        "diabetesOther",
        "medications",
        "symptoms",
        "healthConditions",
      ])
    );
    if (Object.keys(errs).length === 0) {
      onNext(form);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-3xl mx-auto w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <ProgressSteps currentStep={2} totalSteps={4} />
          <p className="text-center text-xs text-slate-400 mt-3 font-medium tracking-wide">
            Step 2 of 4
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Medical Baseline
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            Help us understand your condition so we can tailor your care plan
            effectively.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 flex flex-col gap-5">
          {/* Diabetes Type — styled select */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="diabetes-type"
              className="text-sm font-medium text-slate-700"
            >
              Diabetes Type <span className="text-destructive ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                id="diabetes-type"
                value={form.diabetesType}
                onChange={(e) => updateField("diabetesType", e.target.value)}
                onBlur={() => handleBlur("diabetesType")}
                aria-invalid={
                  touched.has("diabetesType") && errors.diabetesType
                    ? "true"
                    : undefined
                }
                className={`
                  w-full appearance-none rounded-xl border bg-slate-50 px-4 py-3.5
                  text-foreground transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                  ${
                    errors.diabetesType && touched.has("diabetesType")
                      ? "border-destructive ring-1 ring-destructive/20"
                      : "border-border"
                  }
                  ${!form.diabetesType ? "text-foreground/40" : ""}
                `}
              >
                <option value="" disabled>
                  Select type...
                </option>
                {DIABETES_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
            {touched.has("diabetesType") && errors.diabetesType && (
              <p role="alert" className="text-xs text-destructive mt-0.5">
                {errors.diabetesType}
              </p>
            )}

            {/* "Other" specification */}
            {form.diabetesType === "other" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={form.diabetesOther}
                  onChange={(e) =>
                    updateField("diabetesOther", e.target.value)
                  }
                  onBlur={() => handleBlur("diabetesOther")}
                  placeholder="Please specify..."
                  aria-invalid={
                    touched.has("diabetesOther") && errors.diabetesOther
                      ? "true"
                      : undefined
                  }
                  className={`
                    w-full rounded-xl border bg-slate-50 px-4 py-3
                    text-foreground placeholder:text-foreground/30
                    transition-all duration-150 ease-out
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                    ${
                      errors.diabetesOther && touched.has("diabetesOther")
                        ? "border-destructive ring-1 ring-destructive/20"
                        : "border-border"
                    }
                  `}
                />
                {touched.has("diabetesOther") && errors.diabetesOther && (
                  <p role="alert" className="text-xs text-destructive mt-1">
                    {errors.diabetesOther}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Current Medications & Schedule */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="medications"
              className="text-sm font-medium text-slate-700"
            >
              Current Medications & Schedule{" "}
              <span className="text-destructive ml-0.5">*</span>
            </label>
            <textarea
              id="medications"
              value={form.medications}
              onChange={(e) => updateField("medications", e.target.value)}
              onBlur={() => handleBlur("medications")}
              placeholder='e.g. Metformin 500mg — twice daily (breakfast & dinner)&#10;Insulin Glargine 10U — once daily at bedtime'
              rows={4}
              aria-invalid={
                touched.has("medications") && errors.medications
                  ? "true"
                  : undefined
              }
              className={`
                w-full rounded-xl border bg-slate-50 px-4 py-3.5
                text-foreground placeholder:text-foreground/30
                transition-all duration-150 ease-out resize-none
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                ${
                  errors.medications && touched.has("medications")
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-border"
                }
              `}
            />
            {touched.has("medications") && errors.medications && (
              <p role="alert" className="text-xs text-destructive mt-0.5">
                {errors.medications}
              </p>
            )}
          </div>

          {/* Existing Symptoms — multi-select chips */}
          <ChipGroup
            label="Existing Symptoms"
            options={SYMPTOM_OPTIONS}
            selected={form.symptoms}
            onChange={(next) => updateField("symptoms", next)}
            required
            error={errors.symptoms}
            touched={touched.has("symptoms")}
          />

          {/* Relevant Health Conditions — multi-select chips */}
          <ChipGroup
            label="Relevant Health Conditions"
            options={CONDITION_OPTIONS}
            selected={form.healthConditions}
            onChange={(next) => updateField("healthConditions", next)}
            required
            error={errors.healthConditions}
            touched={touched.has("healthConditions")}
          />

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              type="button"
              onClick={onBack}
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
              type="submit"
              className={`
                rounded-full py-4 font-heading font-semibold text-base
                transition-all duration-300 ease-out
                active:scale-[0.97]
                ${
                  isValid
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }
              `}
            >
              Next
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 pb-6">
        Your information is encrypted and never shared.
      </p>
    </div>
  );
}