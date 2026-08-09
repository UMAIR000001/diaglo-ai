import { useMemo } from "react";

interface BmiPreviewCardProps {
  heightCm: string;
  weightKg: string;
}

// ── BMI category definitions ──────────────────────────────────────────
interface BmiCategory {
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  textColor: string;
}

const BMI_MAX = 40; // scale caps at 40 for visual consistency
const BMI_MIN = 10;

const CATEGORIES: BmiCategory[] = [
  { label: "Underweight", min: BMI_MIN, max: 18.5,  color: "#3B82F6", bgColor: "bg-blue-100",  textColor: "text-blue-700" },
  { label: "Normal",      min: 18.5,   max: 25,    color: "#16A34A", bgColor: "bg-green-100", textColor: "text-green-700" },
  { label: "Overweight",  min: 25,     max: 30,    color: "#D97706", bgColor: "bg-amber-100", textColor: "text-amber-700" },
  { label: "Obese",       min: 30,     max: BMI_MAX, color: "#DC2626", bgColor: "bg-red-100",  textColor: "text-red-700" },
];

function getCategory(bmi: number): BmiCategory {
  for (const cat of CATEGORIES) {
    if (bmi >= cat.min && bmi < cat.max) return cat;
  }
  // bmi === BMI_MAX or beyond — return last category
  return CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Map a BMI value to a 0–1 scale position using quarter-based segments.
 * Each category (Underweight / Normal / Overweight / Obese) occupies
 * exactly 25 % of the bar width, matching the standard clinical scale.
 *
 *   Underweight  (BMI < 18.5)   →  0.00 – 0.25
 *   Normal       (BMI 18.5–24.9) →  0.25 – 0.50
 *   Overweight   (BMI 25–29.9)   →  0.50 – 0.75
 *   Obese        (BMI ≥ 30)      →  0.75 – 1.00
 */
function bmiToPercent(bmi: number): number {
  const clamped = Math.min(BMI_MAX, Math.max(BMI_MIN, bmi));

  if (clamped < 18.5) {
    // Underweight: BMI 10–18.49 → 0.00–0.25
    return ((clamped - BMI_MIN) / (18.5 - BMI_MIN)) * 0.25;
  }
  if (clamped < 25) {
    // Normal: BMI 18.5–24.99 → 0.25–0.50
    return 0.25 + ((clamped - 18.5) / (25 - 18.5)) * 0.25;
  }
  if (clamped < 30) {
    // Overweight: BMI 25–29.99 → 0.50–0.75
    return 0.5 + ((clamped - 25) / (30 - 25)) * 0.25;
  }
  // Obese: BMI 30–40 → 0.75–1.00
  return Math.min(1, 0.75 + ((clamped - 30) / (BMI_MAX - 30)) * 0.25);
}

export default function BmiPreviewCard({ heightCm, weightKg }: BmiPreviewCardProps) {
  const bmi = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return null;
    return w / (h / 100) ** 2;
  }, [heightCm, weightKg]);

  const show = bmi !== null && isFinite(bmi);

  if (!show) return null;

  const safeBmi = Math.max(BMI_MIN, Math.min(BMI_MAX, bmi!));
  const category = getCategory(safeBmi);
  const percent = bmiToPercent(safeBmi);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Your BMI is ${bmi!.toFixed(1)} — ${category.label}`}
      className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/50 animate-[fadeIn_200ms_ease-out]"
    >
      {/* ── Header row: BMI value + badge ─────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground/60">BMI</span>
          <span className="text-3xl font-bold font-heading text-foreground tracking-tight">
            {bmi!.toFixed(1)}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${category.bgColor} ${category.textColor}`}
        >
          {category.label}
        </span>
      </div>

      {/* ── Scale section (bar + labels + pointer) ─────────────── */}
      <div className="relative">
        {/* ── Visual scale bar ────────────────────────────────── */}
        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          {/* Coloured segments */}
          <div className="absolute inset-0 flex">
            {CATEGORIES.map((cat) => {
              const leftPct = bmiToPercent(cat.min);
              const rightPct = bmiToPercent(cat.max);
              const widthPct = (rightPct - leftPct) * 100;
              return (
                <div
                  key={cat.label}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: cat.color,
                    opacity: 0.25,
                  }}
                />
              );
            })}
          </div>

          {/* Active range highlight */}
          <div
            className="absolute top-0 h-full rounded-full transition-all duration-300 ease-out"
            style={{
              left: `${Math.max(0, percent * 100 - 2)}%`,
              width: "4%",
              backgroundColor: category.color,
              opacity: 0.7,
            }}
          />
        </div>

        {/* ── Scale labels ────────────────────────────────────── */}
        <div className="relative mt-1.5 h-4">
          {/* Tick marks + labels for each category midpoint */}
          {CATEGORIES.map((cat) => {
            const mid = (Math.max(cat.min, BMI_MIN) + Math.min(cat.max, BMI_MAX)) / 2;
            const leftPct = bmiToPercent(mid) * 100;
            return (
              <span
                key={cat.label}
                className="absolute -translate-x-1/2 text-[10px] font-medium text-foreground/40 whitespace-nowrap"
                style={{ left: `${leftPct}%` }}
              >
                {cat.label}
              </span>
            );
          })}
        </div>

        {/* ── Pointer / marker ────────────────────────────────── */}
        <div
          className="absolute -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ left: `${Math.max(0, Math.min(100, percent * 100))}%`, top: "28px" }}
        >
          <div className="flex flex-col items-center">
            {/* Triangle pointer */}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M5 6L0 0h10L5 6Z" fill={category.color} />
            </svg>
            {/* Dot */}
            <div
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: category.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
