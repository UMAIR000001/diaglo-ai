import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import type { OnboardingData } from "./OnboardingContext";

/* ── Core types ──────────────────────────────────────────────────────── */

export interface GlucoseEntry {
  id: string;
  day: string;
  glucose: number;
  label: string;
  meal?: string | null;
  medication_taken?: boolean | null;
  insight_text?: string | null;
  created_at: string;
}

/** Aggregate stats for a single calendar day (may contain multiple readings) */
export interface DailySummary {
  /** ISO date key e.g. "2024-07-22" */
  dateKey: string;
  /** Human-readable label e.g. "Mon 22 Jul" */
  dayLabel: string;
  /** Short day name e.g. "Mon" */
  dayName: string;
  /** Number of readings logged that day */
  readingsCount: number;
  /** Minimum glucose value */
  min: number;
  /** Maximum glucose value */
  max: number;
  /** Average glucose value (rounded to 1 decimal) */
  avg: number;
  /** All individual glucose values */
  allValues: number[];
  /** True if any reading > 140 mg/dL */
  hasSpike: boolean;
  /** True if any reading < 70 mg/dL */
  hasDrop: boolean;
  /** Subset of allValues that are > 140 */
  spikeValues: number[];
  /** Subset of allValues that are < 70 */
  dropValues: number[];
}

/** 7‑day aggregated analytics */
export interface WeeklyStats {
  dailySummaries: DailySummary[];
  overallMin: number;
  overallMax: number;
  overallAvg: number;
  /** Day names (e.g. "Wed", "Fri") where at least one spike occurred */
  spikeDays: string[];
  /** Day names (e.g. "Mon") where at least one drop occurred */
  dropDays: string[];
  /** The single day with the largest min–max swing */
  mostVolatileDay: DailySummary | null;
  /** Human-readable label describing the dominant pattern */
  mostCommonIssue: string;
  /** Total readings across all 7 days */
  totalReadings: number;
}

/* ── Context type ─────────────────────────────────────────────────────── */

interface GlucoseDataContextType {
  entries: GlucoseEntry[];
  loading: boolean;
  weeklyStats: WeeklyStats | null;
  addGlucoseReading: (
    glucose: number,
    meal?: string,
    medicationTaken?: boolean,
    insightText?: string,
  ) => Promise<void>;
}

const GlucoseDataContext = createContext<GlucoseDataContextType | null>(null);

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Format a timestamp into a short day label like "Mon", "Tue" etc. */
function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return days[date.getDay()];
}

/** Format a short date string like "Mon 22 Jul" from an ISO string */
function formatLabel(iso: string): string {
  const date = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

/** Group an array of entries by calendar day (YYYY-MM-DD) */
function groupByDate(entries: GlucoseEntry[]): Map<string, GlucoseEntry[]> {
  const groups = new Map<string, GlucoseEntry[]>();
  for (const entry of entries) {
    const dateKey = entry.created_at.split("T")[0];
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(entry);
  }
  return groups;
}

/* ── Weekly analytics engine ──────────────────────────────────────────── */

/**
 * Compute granular weekly statistics from the last 7 days of entries.
 * Handles multiple readings per day by capturing min/max/spikes/drops per
 * day — never flattens into a single average.
 */
export function computeWeeklyStats(entries: GlucoseEntry[]): WeeklyStats | null {
  if (entries.length === 0) return null;

  const groups = groupByDate(entries);
  const dailySummaries: DailySummary[] = [];

  let overallMin = Infinity;
  let overallMax = -Infinity;
  let overallSum = 0;
  let overallCount = 0;
  const spikeDayNames = new Set<string>();
  const dropDayNames = new Set<string>();

  for (const [dateKey, dayEntries] of groups) {
    const values = dayEntries.map((e) => e.glucose);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const spikeValues = values.filter((v) => v > 140);
    const dropValues = values.filter((v) => v < 70);

    overallMin = Math.min(overallMin, min);
    overallMax = Math.max(overallMax, max);
    overallSum += values.reduce((a, b) => a + b, 0);
    overallCount += values.length;

    const date = new Date(dayEntries[0].created_at);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const dayName = days[date.getDay()];
    const dayLabel = `${dayName} ${date.getDate()} ${months[date.getMonth()]}`;

    if (spikeValues.length > 0) spikeDayNames.add(dayName);
    if (dropValues.length > 0) dropDayNames.add(dayName);

    dailySummaries.push({
      dateKey,
      dayLabel,
      dayName,
      readingsCount: values.length,
      min,
      max,
      avg: Math.round(avg * 10) / 10,
      allValues: values,
      hasSpike: spikeValues.length > 0,
      hasDrop: dropValues.length > 0,
      spikeValues,
      dropValues,
    });
  }

  // Sort chronologically
  dailySummaries.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const overallAvg =
    overallCount > 0 ? Math.round((overallSum / overallCount) * 10) / 10 : 0;

  // Day with widest min–max swing (most volatile)
  let mostVolatileDay: DailySummary | null = null;
  let maxRange = -1;
  for (const ds of dailySummaries) {
    const range = ds.max - ds.min;
    if (range > maxRange) {
      maxRange = range;
      mostVolatileDay = ds;
    }
  }

  // Determine the dominant pattern
  let mostCommonIssue: string;
  const spikeCount = spikeDayNames.size;
  const dropCount = dropDayNames.size;

  if (spikeCount > 0 && dropCount > 0) {
    mostCommonIssue = "Frequent spikes & drops detected";
  } else if (spikeCount >= 2) {
    mostCommonIssue = "Frequent spikes above target";
  } else if (spikeCount === 1) {
    mostCommonIssue = "Occasional spike above target";
  } else if (dropCount > 0) {
    mostCommonIssue = "Hypo drops below target";
  } else if (maxRange > 60) {
    mostCommonIssue = "Wide glucose swings";
  } else {
    mostCommonIssue = "Stable";
  }

  return {
    dailySummaries,
    overallMin,
    overallMax,
    overallAvg,
    spikeDays: [...spikeDayNames],
    dropDays: [...dropDayNames],
    mostVolatileDay,
    mostCommonIssue,
    totalReadings: overallCount,
  };
}

/* ── Weekly AI prompt builder ─────────────────────────────────────────── */

/**
 * Build a detailed prompt for the Llama 3.3 model that passes per‑day
 * granular variance (min, max, spikes, drops) so the generated weekly
 * summary accurately references specific fluctuations rather than a
 * generic average.
 */
export function buildWeeklyPrompt(
  stats: WeeklyStats,
  onboarding: OnboardingData,
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
    "You are a compassionate, evidence-based diabetes care assistant. Generate a concise weekly glucose insight (2–3 sentences) based on the patient profile and 7‑day glucose data below.",
    "",
    "--- PATIENT PROFILE ---",
    `Age: ${s1?.age ?? "N/A"}`,
    `Gender: ${s1?.gender ?? "N/A"}`,
    `Height: ${s1?.height ?? "N/A"} cm`,
    `Weight: ${s1?.weight ?? "N/A"} kg`,
    `BMI: ${bmi}`,
    `Diabetes Type: ${s2?.diabetesType ?? "N/A"}${s2?.diabetesOther ? ` (${s2.diabetesOther})` : ""}`,
    `Current Medications: ${s2?.medications || "None specified"}`,
    `Activity Level: ${s3?.activityLevel ?? "N/A"}`,
    "",
    "--- 7-DAY GLUCOSE SUMMARY ---",
    `Overall trend: ${stats.overallAvg} mg/dL avg (range: ${stats.overallMin}–${stats.overallMax})`,
    `Total readings logged: ${stats.totalReadings}`,
    `Most common issue: ${stats.mostCommonIssue}`,
    "",
    "--- DAILY BREAKDOWN (granular) ---",
  ];

  for (const ds of stats.dailySummaries) {
    const details: string[] = [`${ds.dayLabel}:`];
    details.push(`${ds.readingsCount} reading(s), avg ${ds.avg} mg/dL`);
    details.push(`range ${ds.min}–${ds.max} mg/dL`);
    if (ds.hasSpike) details.push(`spike(s) up to ${Math.max(...ds.spikeValues)} mg/dL`);
    if (ds.hasDrop) details.push(`drop(s) down to ${Math.min(...ds.dropValues)} mg/dL`);
    lines.push(details.join(" — "));
  }

  if (stats.spikeDays.length > 0) {
    lines.push("");
    lines.push(`Days with spikes (>140 mg/dL): ${stats.spikeDays.join(", ")}`);
  }
  if (stats.dropDays.length > 0) {
    lines.push(`Days with drops (<70 mg/dL): ${stats.dropDays.join(", ")}`);
  }
  if (stats.mostVolatileDay && stats.mostVolatileDay.readingsCount >= 2) {
    lines.push(
      `Most volatile day: ${stats.mostVolatileDay.dayLabel} (swing of ${stats.mostVolatileDay.max - stats.mostVolatileDay.min} mg/dL)`,
    );
  }

  const firstDay = stats.dailySummaries[0];
  lines.push("");
  lines.push(
    `IMPORTANT: Your response MUST be brief (2–3 sentences). Name specific days (e.g. "${firstDay?.dayName ?? ""}") and specific glucose values. If the "Most common issue" is "${stats.mostCommonIssue}", reference it directly. Be encouraging and actionable.`,
  );

  return lines.join("\n");
}

/* ── Provider ─────────────────────────────────────────────────────────── */

export function GlucoseDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetch the last 7 days of readings for the current user */
  const fetchLogs = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching daily logs:", error);
        setEntries([]);
        return;
      }

      const mapped: GlucoseEntry[] = (data ?? []).map((row) => ({
        id: row.id,
        day: formatDayLabel(row.created_at),
        glucose: row.glucose_level,
        label: formatLabel(row.created_at),
        meal: row.meal,
        medication_taken: row.medication_taken,
        insight_text: row.insight_text,
        created_at: row.created_at,
      }));

      setEntries(mapped);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch logs on mount and when user changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /** Compute weekly stats whenever entries change */
  const weeklyStats = useMemo(() => computeWeeklyStats(entries), [entries]);

  /** Insert a new glucose reading for the current user into Supabase */
  const addGlucoseReading = useCallback(
    async (
      glucose: number,
      meal?: string,
      medicationTaken?: boolean,
      insightText?: string,
    ) => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("daily_logs")
          .insert({
            user_id: user.id,
            glucose_level: glucose,
            meal: meal ?? null,
            medication_taken: medicationTaken ?? null,
            insight_text: insightText ?? null,
          })
          .select()
          .single();

        if (error) {
          console.error("Error inserting glucose reading:", error);
          return;
        }

        // Add the new entry locally and re-sort so the weekly stats update
        const newEntry: GlucoseEntry = {
          id: data.id,
          day: "Today",
          glucose: data.glucose_level,
          label: formatLabel(data.created_at),
          meal: data.meal,
          medication_taken: data.medication_taken,
          insight_text: data.insight_text,
          created_at: data.created_at,
        };

        setEntries((prev) => {
          const updated = [...prev, newEntry].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
          // Keep only entries from the last 7 days
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return updated.filter(
            (e) => new Date(e.created_at).getTime() >= cutoff,
          );
        });
      } catch (err) {
        console.error("Failed to add glucose reading:", err);
      }
    },
    [user],
  );

  return (
    <GlucoseDataContext.Provider
      value={{ entries, loading, weeklyStats, addGlucoseReading }}
    >
      {children}
    </GlucoseDataContext.Provider>
  );
}

export function useGlucoseData() {
  const ctx = useContext(GlucoseDataContext);
  if (!ctx) throw new Error("useGlucoseData must be used within a GlucoseDataProvider");
  return ctx;
}