import { useState } from "react";
import { useOnboarding } from "../lib/OnboardingContext";
import { useGlucoseData } from "../lib/GlucoseDataContext";
import Trends from "./Trends";

const MEAL_OPTIONS = [
  "1 Roti + Daal (Lentils)",
  "1 Roti + Sabzi (Vegetables)",
  "1 Roti + Chicken / Meat Salan",
  "2+ Rotis + Any Curry",
  "Daal Chawal (Lentils & Rice)",
  "Chicken / Beef Biryani",
  "Pulao (Chicken / Mutton / Veg)",
  "Paratha + Egg + Chai",
  "Naan + Karahi / Kebab",
  "Chai + Biscuits / Snacks (Samosa / Pakora)",
  "Fast Food (Burger / Shawarma)",
  "None (Fasting / Roza)",
  "Other (Custom)",
] as const;

/** Build a comprehensive LLM prompt from onboarding + current vitals */
function buildPrompt(
  onboarding: ReturnType<typeof useOnboarding>["data"],
  glucose: string,
  meal: string,
  medicationTaken: boolean,
): string {
  const s1 = onboarding.step1;
  const s2 = onboarding.step2;
  const s3 = onboarding.step3;

  const bmi =
    s1 && Number(s1.weight) > 0 && Number(s1.height) > 0
      ? (
          Number(s1.weight) /
          ((Number(s1.height) / 100) * (Number(s1.height) / 100))
        ).toFixed(1)
      : "N/A";

  const lines: string[] = [
    "You are a compassionate, evidence-based diabetes care assistant. Use the patient profile below to generate a personalised daily insight.",
    "",
    "--- PATIENT PROFILE ---",
    `Age: ${s1?.age ?? "N/A"}`,
    `Gender: ${s1?.gender ?? "N/A"}`,
    `Height: ${s1?.height ?? "N/A"} cm`,
    `Weight: ${s1?.weight ?? "N/A"} kg`,
    `BMI: ${bmi}`,
    `Diabetes Type: ${s2?.diabetesType ?? "N/A"}${s2?.diabetesOther ? ` (${s2.diabetesOther})` : ""}`,
    `Current Medications: ${s2?.medications || "None specified"}`,
    `Symptoms reported: ${s2?.symptoms?.length ? s2.symptoms.join(", ") : "None"}`,
    `Health Conditions: ${s2?.healthConditions?.length ? s2.healthConditions.join(", ") : "None"}`,
    `Activity Level: ${s3?.activityLevel ?? "N/A"}`,
    `Sleep: ${s3?.sleepHours ?? "N/A"} hrs (Quality: ${s3?.sleepQuality ?? "N/A"})`,
    `Hydration: ${s3?.hydrationCups ?? "N/A"} cups/day`,
    `Dietary Preferences: ${s3?.dietaryPreferences?.length ? s3.dietaryPreferences.join(", ") : "None specified"}`,
    "",
    "--- TODAY'S LOG ---",
    `Current Blood Glucose: ${glucose || "Not logged"} mg/dL`,
    `Recent Meal: ${meal || "Not logged"}`,
    `Scheduled Medication Taken: ${medicationTaken ? "Yes" : "No"}`,
    "",
    "Provide a brief, actionable insight (2-3 sentences) focused on glucose management and daily well-being. Be encouraging and specific.",
  ];

  return lines.join("\n");
}

type Tab = "today" | "trends";

export default function DailyDashboard() {
  const { data } = useOnboarding();
  const { addGlucoseReading } = useGlucoseData();
  const [activeTab, setActiveTab] = useState<Tab>("today");

  const [glucose, setGlucose] = useState("");
  const [meal, setMeal] = useState("");
  const [customMeal, setCustomMeal] = useState("");
  const [medicationTaken, setMedicationTaken] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  // Pull onboarding data in the background so it's ready to bundle
  const onboardingData = data;

  async function handleGenerateInsight() {
    // Append today's glucose reading to the trend data
    const glucoseNum = Number(glucose);
    if (glucoseNum > 0) {
      addGlucoseReading(glucoseNum);
    }

    // Resolve meal label — use customMeal if "Other (Custom)" is selected and non-empty
    const mealLabel =
      meal === "Other (Custom)"
        ? customMeal.trim() || "Other (Custom)"
        : meal;

    // Build the prompt
    const prompt = buildPrompt(onboardingData, glucose, mealLabel, medicationTaken);

    // Log the exact prompt for verification
    console.log("=".repeat(72));
    console.log("🧠 DIAGLO AI — LLM PROMPT");
    console.log("=".repeat(72));
    console.log(prompt);
    console.log("=".repeat(72));

    setIsGenerating(true);
    setInsight(null);

    try {
      const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer c41e97be3f058aac871e74dc1199ec28",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI/ML API error: ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data?.choices?.[0]?.message?.content ??
        "I wasn't able to generate an insight right now. Please try again.";
      setInsight(reply);
    } catch (error) {
      console.error("Failed to generate insight:", error);
      setInsight(
        "We couldn't connect right now — please check your connection and try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  // Build a contextual greeting
  const hasAllData = !!(data.step1 && data.step2 && data.step3);

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Header */}
      <header className="px-5 pt-8 pb-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-100">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-teal-600"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">
              Daily Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Log your vitals and get personalised insights.
            </p>
          </div>
        </div>

        {/* Context chip (background) */}
        {hasAllData && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium bg-emerald-50 rounded-full px-3 py-1.5 w-fit">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Your profile data is loaded &mdash; insights will be tailored to you.
          </div>
        )}
      </header>

      {/* Tab Navigation — Today's Log / 7-Day Trends */}
      <nav className="px-5 max-w-3xl mx-auto mb-5" role="tablist" aria-label="Dashboard views">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            onClick={() => setActiveTab("today")}
            className={`
              flex-1 rounded-lg px-4 py-2.5 text-sm font-heading font-semibold
              transition-all duration-300 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
              ${
                activeTab === "today"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Today&rsquo;s Log
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "trends"}
            onClick={() => setActiveTab("trends")}
            className={`
              flex-1 rounded-lg px-4 py-2.5 text-sm font-heading font-semibold
              transition-all duration-300 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
              ${
                activeTab === "trends"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              7-Day Trends
            </span>
          </button>
        </div>
      </nav>

      {/* Main content — tab-dependent */}
      {activeTab === "trends" ? (
        <main className="px-5 pb-10 max-w-3xl mx-auto flex flex-col gap-4">
          <Trends />
        </main>
      ) : (
      <main className="px-5 pb-10 max-w-3xl mx-auto flex flex-col gap-4">
        {/* Card 1: Blood Glucose */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-2.5 mb-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent shrink-0"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <label
              htmlFor="glucose"
              className="text-sm font-medium text-slate-700"
            >
              Current Blood Glucose
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                id="glucose"
                type="number"
                inputMode="decimal"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
                placeholder="e.g. 120"
                min={0}
                max={600}
                aria-describedby="glucose-unit"
                className="
                  w-full rounded-xl border border-slate-200 bg-slate-50
                  px-4 py-3.5 text-slate-900 placeholder:text-slate-400
                  text-base font-medium tabular-nums
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                  [appearance:textfield]
                  [&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                "
              />
            </div>
            <span
              id="glucose-unit"
              className="text-sm font-semibold text-amber-600 whitespace-nowrap"
            >
              mg/dL
            </span>
          </div>
        </div>

        {/* Card 2: Meal Log */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-2.5 mb-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-teal-500 shrink-0"
              aria-hidden="true"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            <label
              htmlFor="meal"
              className="text-sm font-medium text-slate-700"
            >
              Recent Meal
            </label>
          </div>

          <select
            id="meal"
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            className="
              w-full rounded-xl border border-slate-200 bg-slate-50
              px-4 py-3.5 text-slate-900 text-base
              transition-all duration-150 ease-out
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
              appearance-none
              bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230d9488%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
              bg-[length:20px] bg-[right_16px_center] bg-no-repeat
              pr-12
            "
          >
            <option value="" disabled>
              Select a meal...
            </option>
            {MEAL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {/* Dynamic "Other" input — appears when "Other (Custom)" is selected */}
          {meal === "Other (Custom)" && (
            <div className="mt-3 animate-[fadeIn_200ms_ease-out]">
              <input
                id="custom-meal"
                type="text"
                value={customMeal}
                onChange={(e) => setCustomMeal(e.target.value)}
                placeholder="Type your custom meal (e.g., 2 slices brown bread, Haleem, etc.)..."
                className="
                  w-full rounded-xl border border-slate-200 bg-slate-50
                  px-4 py-3.5 text-slate-900 placeholder:text-slate-400
                  text-base
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                "
              />
            </div>
          )}
        </div>

        {/* Card 3: Medication Check */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="2"
                  width="16"
                  height="20"
                  rx="2"
                  ry="2"
                />
                <line x1="9" y1="22" x2="9" y2="2" />
              </svg>
              <span className="text-sm font-medium text-slate-700 leading-relaxed">
                Did you take your scheduled medication today?
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={medicationTaken}
              onClick={() => setMedicationTaken(!medicationTaken)}
              className={`
                relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full
                border-2 border-transparent
                transition-colors duration-200 ease-in-out
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-teal-500 focus-visible:ring-offset-2
                ${medicationTaken ? "bg-teal-500" : "bg-slate-200"}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-6 w-6 rounded-full
                  bg-white shadow-md ring-0
                  transition-transform duration-200 ease-in-out
                  ${medicationTaken ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Generate Insight CTA + Insight Card */}
        <div className="mt-3 space-y-4">
          <button
            type="button"
            onClick={handleGenerateInsight}
            disabled={isGenerating}
            className={`
              w-full rounded-full py-4 px-6 font-heading font-semibold text-base
              flex items-center justify-center gap-2.5
              transition-all duration-300 ease-out
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-teal-500 focus-visible:ring-offset-2
              ${
                isGenerating
                  ? "bg-teal-400 text-white/80 cursor-wait"
                  : "bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
              }
            `}
          >
            {isGenerating ? (
              <>
                {/* Spinner */}
                <svg
                  className="animate-spin h-5 w-5"
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
                Analyzing&hellip;
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Generate My Daily Insight
              </>
            )}
          </button>

          {/* Insight Card (appears after generation) */}
          {insight && (
            <div
              className="rounded-2xl bg-gradient-to-br from-teal-50 via-white to-blue-50 border border-teal-200/60 p-5 shadow-lg shadow-teal-500/10
                          animate-[fadeIn_300ms_ease-out]"
            >
              <div className="flex items-start gap-3">
                {/* Sparkle icon with glow */}
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10 shrink-0 mt-0.5 ring-1 ring-teal-500/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-teal-600"
                    aria-hidden="true"
                  >
                    <path d="M12 2l1.09 5.18L18 4l-2.18 4.91L20 12l-4.18 1.09L18 18l-4.91-2.18L12 20l-1.09-5.18L6 18l2.18-4.91L4 12l4.18-1.09L6 6l4.91 2.18L12 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-heading font-bold text-slate-900">
                      Today&rsquo;s Insight
                    </h2>
                    <span className="text-[10px] text-teal-500 font-semibold uppercase tracking-wider">
                      AI Powered
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {insight}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            Your data is encrypted and never shared.
          </p>
        </div>
      </main>
      )}
    </div>
  );
}