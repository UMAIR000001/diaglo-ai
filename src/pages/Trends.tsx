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
  const zoneColor = val > 140 ? "text-destructive" : val < 70 ? "text-warning" : "text-success";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${zoneColor}`}>
        {val}
        <span className="text-xs font-normal text-slate-500 ml-1">mg/dL</span>
      </p>
      {val > 140 && (
        <p className="text-[11px] text-destructive mt-0.5">Above target zone</p>
      )}
    </div>
  );
}

/* ── Trends Page ──────────────────────────────────────────────────────── */
export default function Trends() {
  const { entries } = useGlucoseData();

  return (
    <div className="animate-[fadeIn_300ms_ease-out]">
      {/* ── Chart Card ── */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-heading font-bold text-slate-900">
              7‑Day Glucose Trend
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mon 22 &ndash; Sun 28 Jul
            </p>
          </div>
          {/* Legend tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full bg-primary" />
              <span className="text-[10px] text-slate-500">Glucose</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded border-2 border-success/40 bg-success/10" />
              <span className="text-[10px] text-slate-500">Target</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={entries}
            margin={{ top: 8, right: 4, bottom: 0, left: -16 }}
          >
            {/* Target zone highlight (70–140 mg/dL) */}
            <ReferenceArea
              y1={70}
              y2={140}
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

            {/* Gradient definition */}
            <defs>
              <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Area fill under the line */}
            <defs>
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

        {/* Legend-style reference annotations */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-success" />
            <span className="text-[11px] text-slate-500">
              Target zone: 70–140 mg/dL
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

      {/* ── Weekly Insight Card ── */}
      <div
        className="rounded-2xl bg-gradient-to-br from-teal-50 via-white to-blue-50 border border-teal-200/60 p-5 shadow-lg shadow-teal-500/10 mt-4
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
                Weekly Insight
              </h2>
              <span className="text-[10px] text-teal-500 font-semibold uppercase tracking-wider">
                AI Powered
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your glucose levels were mostly stable this week, but noticeable spikes occurred
              on Wednesday and Friday evenings. Consider reducing portion sizes during dinner to
              maintain stability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}