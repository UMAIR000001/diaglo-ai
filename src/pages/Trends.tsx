import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { useGlucoseData } from "../lib/GlucoseDataContext";
import { useOnboarding } from "../lib/OnboardingContext";
import { supabase } from "../lib/supabaseClient";
import { buildWeeklyPrompt } from "../lib/GlucoseDataContext";
import type { WeeklyStats } from "../lib/GlucoseDataContext";

/* ── Thresholds ──────────────────────────────────────────────────────── */
const TARGET_MIN = 70;
const TARGET_MAX = 140;

/* ── Custom tooltip ──────────────────────────────────────────────────── */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const val = payload[0].value;
  const zoneColor =
    val > TARGET_MAX
      ? "text-destructive"
      : val < TARGET_MIN
        ? "text-warning"
        : "text-success";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${zoneColor}`}>
        {val}
        <span className="text-xs font-normal text-slate-500 ml-1">mg/dL</span>
      </p>
      {val > TARGET_MAX && (
        <p className="text-[11px] text-destructive mt-0.5">Above target zone</p>
      )}
      {val < TARGET_MIN && (
        <p className="text-[11px] text-warning mt-0.5">Below target zone</p>
      )}
    </div>
  );
}

/* ── Trend legend item ────────────────────────────────────────────────── */
function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

/* ── Utility badge ───────────────────────────────────────────────────── */
function Badge({
  label,
  variant = "slate",
}: {
  label: string;
  variant?: "slate" | "amber" | "red" | "teal" | "emerald";
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-destructive",
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${colors[variant]}`}
    >
      {label}
    </span>
  );
}

/* ── Issue badge maps the mostCommonIssue to a variant ────────────────── */
function issueVariant(issue: string): "slate" | "amber" | "red" | "teal" | "emerald" {
  if (issue.includes("spikes & drops")) return "red";
  if (issue.includes("spikes")) return "amber";
  if (issue.includes("drops") || issue.includes("Hypo")) return "red";
  if (issue.includes("swings")) return "amber";
  return "emerald";
}

/* ── Stat card ───────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  unit,
  variant = "slate",
}: {
  label: string;
  value: string | number;
  unit?: string;
  variant?: string;
}) {
  const valueColors: Record<string, string> = {
    slate: "text-slate-900",
    amber: "text-amber-600",
    red: "text-destructive",
    teal: "text-teal-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-center min-w-[80px]">
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={`text-lg font-bold tabular-nums ${valueColors[variant] ?? "text-slate-900"}`}>
        {value}
        {unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

/* ── Daily summary row ───────────────────────────────────────────────── */
function DailyRow({ ds }: { ds: WeeklyStats["dailySummaries"][number] }) {
  const zone =
    ds.avg > TARGET_MAX
      ? "text-destructive"
      : ds.avg < TARGET_MIN
        ? "text-warning"
        : "text-success";

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-slate-800 w-14 shrink-0">
          {ds.dayName}
        </span>
        {ds.readingsCount > 1 && (
          <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 leading-none">
            {ds.readingsCount}x
          </span>
        )}
        <div className="flex items-center gap-1 ml-1">
          {ds.hasSpike && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700" title={`Spike to ${Math.max(...ds.spikeValues)}`}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
          )}
          {ds.hasDrop && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-destructive" title={`Drop to ${Math.min(...ds.dropValues)}`}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold tabular-nums ${zone}`}>
          {ds.avg}
        </span>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {ds.min}–{ds.max}
        </span>
      </div>
    </div>
  );
}

/* ── Weekly Summary Card (computed — no AI) ──────────────────────────── */
function WeeklySummaryCard({ stats }: { stats: WeeklyStats }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
      <h3 className="text-sm font-heading font-bold text-slate-900 mb-3">
        Weekly Summary
      </h3>

      {/* Quick stat row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <StatCard label="Avg" value={stats.overallAvg} unit="" variant="slate" />
        <StatCard label="Low" value={stats.overallMin} unit="" variant={stats.overallMin < TARGET_MIN ? "red" : "slate"} />
        <StatCard label="High" value={stats.overallMax} unit="" variant={stats.overallMax > TARGET_MAX ? "amber" : "slate"} />
        <StatCard label="Readings" value={stats.totalReadings} variant="slate" />
      </div>

      {/* Most common issue badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 font-medium">Trend:</span>
        <Badge
          label={stats.mostCommonIssue}
          variant={issueVariant(stats.mostCommonIssue)}
        />
      </div>

      {/* Daily breakdown */}
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
          Daily Breakdown
        </p>
        {stats.dailySummaries.map((ds) => (
          <DailyRow key={ds.dateKey} ds={ds} />
        ))}
      </div>
    </div>
  );
}

/* ── Weekly Insight Card (AI generated) ──────────────────────────────── */
function WeeklyInsightCard({
  insight,
  isGenerating,
  onGenerate,
}: {
  insight: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-teal-50 via-white to-blue-50 border border-teal-200/60 p-5 shadow-lg shadow-teal-500/10
                  animate-[fadeIn_400ms_ease-out]"
    >
      <div className="flex items-start gap-3">
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
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-heading font-bold text-slate-900">
              Weekly AI Insight
            </h2>
            {!isGenerating && insight && (
              <span className="text-[10px] text-teal-500 font-semibold uppercase tracking-wider">
                AI Powered
              </span>
            )}
          </div>

          {isGenerating ? (
            <div className="flex items-center gap-2.5 py-2">
              <svg
                className="animate-spin h-4 w-4 text-teal-500"
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
              <span className="text-sm text-teal-600 font-medium">
                Analysing your weekly trends&hellip;
              </span>
            </div>
          ) : insight ? (
            <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-slate-500">
                Generate a personalised weekly insight based on your trend data.
              </p>
              <button
                type="button"
                onClick={onGenerate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white
                           shadow-md shadow-teal-500/20 hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/30
                           transition-all duration-200 ease-out active:scale-[0.97]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
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
                  <path d="M12 2l1.09 5.18L18 4l-2.18 4.91L20 12l-4.18 1.09L18 18l-4.91-2.18L12 20l-1.09-5.18L6 18l2.18-4.91L4 12l4.18-1.09L6 6l4.91 2.18L12 2z" />
                </svg>
                Generate Weekly Insight
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Trends Page ──────────────────────────────────────────────────────── */
export default function Trends() {
  const { entries, loading, weeklyStats } = useGlucoseData();
  const { data: onboarding } = useOnboarding();

  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const hasAutoGenerated = useRef(false);

  /* Auto‑generate once when weeklyStats becomes available */
  useEffect(() => {
    if (
      weeklyStats &&
      !weeklyInsight &&
      !isGeneratingInsight &&
      !hasAutoGenerated.current
    ) {
      hasAutoGenerated.current = true;
      generateWeeklyInsight(weeklyStats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyStats]);

  const generateWeeklyInsight = useCallback(
    async (stats?: WeeklyStats) => {
      const targetStats = stats ?? weeklyStats;
      if (!targetStats || !onboarding) return;

      setIsGeneratingInsight(true);
      setWeeklyInsight(null);

      const prompt = buildWeeklyPrompt(targetStats, onboarding);
      console.log("=".repeat(72));
      console.log("🧠 DIAGLO AI — WEEKLY INSIGHT PROMPT");
      console.log("=".repeat(72));
      console.log(prompt);
      console.log("=".repeat(72));

      try {
        const response = await supabase.functions.invoke("generate-insight", {
          body: { prompt },
        });

        if (response.error) {
          throw new Error(response.error.message || "Edge function error");
        }

        setWeeklyInsight(
          response.data?.content ??
            "I wasn't able to generate a weekly insight right now. Please try again.",
        );
      } catch (error) {
        console.error("Failed to generate weekly insight:", error);
        setWeeklyInsight(
          "We couldn't connect right now — please check your connection and try again.",
        );
      } finally {
        setIsGeneratingInsight(false);
      }
    },
    [weeklyStats, onboarding],
  );

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="animate-[fadeIn_300ms_ease-out]">
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-5 w-44 rounded-md bg-slate-100 animate-pulse" />
              <div className="h-3 w-28 rounded-md bg-slate-100 animate-pulse mt-2" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-16 rounded-md bg-slate-100 animate-pulse" />
              <div className="h-3 w-12 rounded-md bg-slate-100 animate-pulse" />
            </div>
          </div>
          <div className="h-[260px] rounded-xl bg-slate-50 animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-slate-300"
                aria-hidden="true"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="text-xs text-slate-400">Loading your trends&hellip;</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (entries.length === 0) {
    return (
      <div className="animate-[fadeIn_300ms_ease-out]">
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
                aria-hidden="true"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-sm font-heading font-bold text-slate-900">
              No readings yet
            </h3>
            <p className="text-xs text-slate-500 text-center max-w-[200px]">
              Head over to Today&rsquo;s Log and submit your first blood glucose
              reading to see your trends here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_300ms_ease-out] space-y-4">
      {/* ── Chart Card ── */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-heading font-bold text-slate-900">
              7‑Day Glucose Trend
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your latest {entries.length} reading{entries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LegendBadge color="bg-primary" label="Glucose" />
            <LegendBadge color="bg-success/40 border-2 border-success/40" label="Target" />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={entries}
            margin={{ top: 8, right: 4, bottom: 0, left: -16 }}
          >
            <ReferenceArea
              y1={TARGET_MIN}
              y2={TARGET_MAX}
              fill="var(--color-success)"
              fillOpacity={0.08}
              stroke="none"
            />

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.6}
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-foreground)", fontSize: 12, opacity: 0.5 }}
              dy={6}
            />

            <YAxis
              domain={[60, 200]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-foreground)", fontSize: 11, opacity: 0.4 }}
              tickFormatter={(v: number) => `${v}`}
              dx={-2}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "var(--color-foreground)",
                strokeOpacity: 0.12,
                strokeDasharray: "4 4",
              }}
            />

            <defs>
              <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <clipPath id="chartClip">
                <rect x="0" y="0" width="100%" height="260" />
              </clipPath>
            </defs>

            <Line
              type="monotone"
              dataKey="glucose"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--color-primary)", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "var(--color-primary)",
                stroke: "#fff",
                strokeWidth: 2,
                style: { filter: "drop-shadow(0 2px 4px var(--color-primary)/0.3)" },
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* ── Legend-style reference annotations ── */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-success" />
            <span className="text-[11px] text-slate-500">
              Target zone: {TARGET_MIN}–{TARGET_MAX} mg/dL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[11px] text-slate-500">
              Spikes above target
            </span>
          </div>
        </div>
      </div>

      {/* ── Weekly Summary (computed) ── */}
      {weeklyStats && <WeeklySummaryCard stats={weeklyStats} />}

      {/* ── Weekly AI Insight ── */}
      <WeeklyInsightCard
        insight={weeklyInsight}
        isGenerating={isGeneratingInsight}
        onGenerate={() => generateWeeklyInsight()}
      />
    </div>
  );
}