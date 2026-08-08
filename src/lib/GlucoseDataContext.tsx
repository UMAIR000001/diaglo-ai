import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface GlucoseEntry {
  day: string;
  glucose: number;
  label: string;
}

interface GlucoseDataContextType {
  entries: GlucoseEntry[];
  addGlucoseReading: (glucose: number) => void;
}

const GlucoseDataContext = createContext<GlucoseDataContextType | null>(null);

/* ── 6 days of seeded mock data (Mon–Sat) ──────────────────────────── */
const SEEDED_ENTRIES: GlucoseEntry[] = [
  { day: "Mon", glucose: 118, label: "Monday" },
  { day: "Tue", glucose: 132, label: "Tuesday" },
  { day: "Wed", glucose: 168, label: "Wednesday" },
  { day: "Thu", glucose: 125, label: "Thursday" },
  { day: "Fri", glucose: 172, label: "Friday" },
  { day: "Sat", glucose: 138, label: "Saturday" },
];

export function GlucoseDataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<GlucoseEntry[]>(SEEDED_ENTRIES);

  const addGlucoseReading = useCallback((glucose: number) => {
    setEntries((prev) => {
      // If we already have a "Today" entry, replace it; otherwise append
      const hasToday = prev[prev.length - 1]?.day === "Today";
      if (hasToday) {
        const updated = [...prev];
        updated[updated.length - 1] = { day: "Today", glucose, label: "Today" };
        return updated;
      }
      return [...prev, { day: "Today", glucose, label: "Today" }];
    });
  }, []);

  return (
    <GlucoseDataContext.Provider value={{ entries, addGlucoseReading }}>
      {children}
    </GlucoseDataContext.Provider>
  );
}

export function useGlucoseData() {
  const ctx = useContext(GlucoseDataContext);
  if (!ctx) throw new Error("useGlucoseData must be used within a GlucoseDataProvider");
  return ctx;
}