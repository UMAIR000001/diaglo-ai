import { useState, useMemo } from "react";
import ProgressSteps from "../components/ProgressSteps";

interface Props {
  onBack: () => void;
  onNext: (data: OnboardingStep3Data) => void;
}

export interface OnboardingStep3Data {
  activityLevel: string;
  sleepHours: number;
  sleepQuality: string;
  hydrationCups: number;
  dietaryPreferences: string[];
  dietaryOther: string;
}

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { value: "lightly", label: "Lightly active", desc: "Light exercise 1–3 days/week" },
  { value: "moderately", label: "Moderately active", desc: "Moderate exercise 3–5 days/week" },
  { value: "very", label: "Very active", desc: "Hard exercise 6–7 days/week" },
  { value: "extremely", label: "Extremely active", desc: "Intense daily or physical job" },
] as const;

const SLEEP_QUALITY_OPTIONS = ["Poor", "Fair", "Good", "Excellent"] as const;

const DIETARY_OPTIONS = [
  "Balanced",
  "Low-carb",
  "Keto",
  "Mediterranean",
  "Vegetarian",
  "Vegan",
  "Intermittent fasting",
  "No restrictions",
  "Other",
] as const;

function validate(data: OnboardingStep3Data): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.activityLevel) {
    errors.activityLevel = "Please select your activity level.";
  }
  if (!data.sleepHours || data.sleepHours < 1 || data.sleepHours > 24) {
    errors.sleepHours = "Please enter a valid number of sleep hours.";
  }
  if (!data.sleepQuality) {
    errors.sleepQuality = "Please rate your sleep quality.";
  }
  if (!data.hydrationCups || data.hydrationCups < 1 || data.hydrationCups > 20) {
    errors.hydrationCups = "Please enter your daily water intake.";
  }
  if (data.dietaryPreferences.length === 0) {
    errors.dietaryPreferences = "Please select your dietary preferences.";
  }
  if (data.dietaryPreferences.includes("Other") && !data.dietaryOther.trim()) {
    errors.dietaryOther = "Please specify your dietary preference.";
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
  singleSelect,
}: {
  options: readonly T[] | readonly { value: T; label: string; desc: string }[];
  selected: T | T[];
  onChange: (next: T | T[]) => void;
  label: string;
  required?: boolean;
  error?: string;
  touched: boolean;
  singleSelect?: boolean;
  description?: (value: T) => string | undefined;
}) {
  const isMulti = Array.isArray(selected);

  function getLabel(option: T | { value: T; label: string; desc: string }): string {
    return typeof option === "string" ? option : option.label;
  }

  function getValue(option: T | { value: T; label: string; desc: string }): T {
    return typeof option === "string" ? option : option.value;
  }

  function getDesc(option: T | { value: T; label: string; desc: string }): string | undefined {
    if (typeof option === "string") return undefined;
    return option.desc;
  }

  function handleToggle(optionVal: T) {
    if (singleSelect) {
      onChange(optionVal);
      return;
    }
    const arr = selected as T[];
    if (optionVal === ("No restrictions" as T)) {
      onChange([optionVal]);
      return;
    }
    const filtered = arr.filter(
      (s) => s !== ("No restrictions" as T)
    );
    if (filtered.includes(optionVal)) {
      onChange(filtered.filter((s) => s !== optionVal));
    } else {
      onChange([...filtered, optionVal]);
    }
  }

  function isSelected(optionVal: T): boolean {
    if (isMulti) return (selected as T[]).includes(optionVal);
    return selected === optionVal;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const val = getValue(option);
          const sel = isSelected(val);
          const desc = getDesc(option);
          return (
            <button
              key={val}
              type="button"
              role={singleSelect ? "radio" : "checkbox"}
              aria-checked={sel}
              onClick={() => handleToggle(val)}
              className={`
                rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium
                transition-all duration-150 ease-out text-left
                ${sel
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-slate-700"
                }
                ${desc ? "flex flex-col items-start gap-0.5" : ""}
              `}
            >
              <span>{getLabel(option)}</span>
              {desc && (
                <span className="text-[11px] font-normal text-slate-400 leading-tight">
                  {desc}
                </span>
              )}
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

export default function OnboardingStep3({ onBack, onNext }: Props) {
  const [form, setForm] = useState<OnboardingStep3Data>({
    activityLevel: "",
    sleepHours: 7,
    sleepQuality: "",
    hydrationCups: 6,
    dietaryPreferences: [],
    dietaryOther: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const isValid = useMemo(
    () => Object.keys(validate(form)).length === 0,
    [form]
  );

  function updateField<K extends keyof OnboardingStep3Data>(
    field: K,
    value: OnboardingStep3Data[K]
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

  function handleBlur(field: keyof OnboardingStep3Data) {
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
        "activityLevel",
        "sleepHours",
        "sleepQuality",
        "hydrationCups",
        "dietaryPreferences",
        "dietaryOther",
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
          <ProgressSteps currentStep={3} totalSteps={4} />
          <p className="text-center text-xs text-slate-400 mt-3 font-medium tracking-wide">
            Step 3 of 4
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
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Lifestyle & Routine
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            Your daily habits shape your health. Tell us about your routine so we
            can build a plan that fits your life.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 flex flex-col gap-5">
          {/* Activity Level — single-select chips */}
          <ChipGroup
            label="Activity Level"
            options={ACTIVITY_LEVELS}
            selected={form.activityLevel}
            onChange={(val) => {
              updateField("activityLevel", val as string);
              setTouched((prev) => new Set(prev).add("activityLevel"));
            }}
            required
            singleSelect
            error={errors.activityLevel}
            touched={touched.has("activityLevel")}
          />

          {/* Sleep Hours — slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sleep-hours"
                className="text-sm font-medium text-slate-700"
              >
                Sleep Hours{" "}
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {form.sleepHours} hrs
              </span>
            </div>
            <div className="relative px-0.5">
              <input
                id="sleep-hours"
                type="range"
                min={4}
                max={12}
                step={0.5}
                value={form.sleepHours}
                onChange={(e) =>
                  updateField("sleepHours", parseFloat(e.target.value))
                }
                onBlur={() => handleBlur("sleepHours")}
                aria-describedby="sleep-hours-labels"
                aria-invalid={
                  touched.has("sleepHours") && errors.sleepHours
                    ? "true"
                    : undefined
                }
                className="
                  w-full h-2 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-teal-500
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-teal-500
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:shadow-teal-500/30
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:duration-150
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:active:scale-95
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-teal-500
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:shadow-teal-500/30
                "
              />
              <div
                id="sleep-hours-labels"
                className="flex justify-between text-[11px] text-slate-400 mt-1 select-none"
              >
                <span>4h</span>
                <span>8h</span>
                <span>12h</span>
              </div>
            </div>
            {touched.has("sleepHours") && errors.sleepHours && (
              <p role="alert" className="text-xs text-destructive mt-0.5">
                {errors.sleepHours}
              </p>
            )}
          </div>

          {/* Sleep Quality — single-select chips */}
          <ChipGroup
            label="Sleep Quality"
            options={SLEEP_QUALITY_OPTIONS}
            selected={form.sleepQuality}
            onChange={(val) => {
              updateField("sleepQuality", val as string);
              setTouched((prev) => new Set(prev).add("sleepQuality"));
            }}
            required
            singleSelect
            error={errors.sleepQuality}
            touched={touched.has("sleepQuality")}
          />

          {/* Hydration — slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="hydration"
                className="text-sm font-medium text-slate-700"
              >
                Daily Water Intake{" "}
                <span className="text-destructive ml-0.5">*</span>
              </label>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {form.hydrationCups} cups
              </span>
            </div>
            <div className="relative px-0.5">
              <input
                id="hydration"
                type="range"
                min={1}
                max={15}
                step={1}
                value={form.hydrationCups}
                onChange={(e) =>
                  updateField("hydrationCups", parseInt(e.target.value))
                }
                onBlur={() => handleBlur("hydrationCups")}
                aria-describedby="hydration-labels"
                aria-invalid={
                  touched.has("hydrationCups") && errors.hydrationCups
                    ? "true"
                    : undefined
                }
                className="
                  w-full h-2 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-teal-500
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-teal-500
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:shadow-teal-500/30
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:duration-150
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:active:scale-95
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-teal-500
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:shadow-teal-500/30
                "
              />
              <div
                id="hydration-labels"
                className="flex justify-between text-[11px] text-slate-400 mt-1 select-none"
              >
                <span>1</span>
                <span>8</span>
                <span>15</span>
              </div>
            </div>
            {touched.has("hydrationCups") && errors.hydrationCups && (
              <p role="alert" className="text-xs text-destructive mt-0.5">
                {errors.hydrationCups}
              </p>
            )}
          </div>

          {/* Dietary Preferences — multi-select chips */}
          <ChipGroup
            label="Dietary Preferences"
            options={DIETARY_OPTIONS}
            selected={form.dietaryPreferences}
            onChange={(next) => updateField("dietaryPreferences", next as string[])}
            required
            error={errors.dietaryPreferences}
            touched={touched.has("dietaryPreferences")}
          />

          {/* "Other" specification for dietary preferences */}
          {form.dietaryPreferences.includes("Other") && (
            <div className="mt-0">
              <input
                type="text"
                value={form.dietaryOther}
                onChange={(e) => updateField("dietaryOther", e.target.value)}
                onBlur={() => handleBlur("dietaryOther")}
                placeholder="Please specify your diet..."
                aria-invalid={
                  touched.has("dietaryOther") && errors.dietaryOther
                    ? "true"
                    : undefined
                }
                className={`
                  w-full rounded-xl border bg-slate-50 px-4 py-3
                  text-foreground placeholder:text-slate-400
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                  ${
                    errors.dietaryOther && touched.has("dietaryOther")
                      ? "border-destructive ring-1 ring-destructive/20"
                      : "border-border"
                  }
                `}
              />
              {touched.has("dietaryOther") && errors.dietaryOther && (
                <p role="alert" className="text-xs text-destructive mt-1">
                  {errors.dietaryOther}
                </p>
              )}
            </div>
          )}

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