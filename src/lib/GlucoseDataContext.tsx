import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

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

interface GlucoseDataContextType {
  entries: GlucoseEntry[];
  loading: boolean;
  addGlucoseReading: (
    glucose: number,
    meal?: string,
    medicationTaken?: boolean,
    insightText?: string,
  ) => Promise<void>;
}

const GlucoseDataContext = createContext<GlucoseDataContextType | null>(null);

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

export function GlucoseDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetch the last 7 entries for the current user from Supabase */
  const fetchLogs = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(7);

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

        // Add the new entry locally and re-sort + trim to last 7
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
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
          // Keep only the last 7
          return updated.slice(-7);
        });
      } catch (err) {
        console.error("Failed to add glucose reading:", err);
      }
    },
    [user],
  );

  return (
    <GlucoseDataContext.Provider value={{ entries, loading, addGlucoseReading }}>
      {children}
    </GlucoseDataContext.Provider>
  );
}

export function useGlucoseData() {
  const ctx = useContext(GlucoseDataContext);
  if (!ctx) throw new Error("useGlucoseData must be used within a GlucoseDataProvider");
  return ctx;
}