"use client";

/*
 * Score-trend line chart for the Analytics tab (Recharts). One series — overall
 * score per completed interview — so there's no legend; the tile title names it.
 * Design follows the dataviz house rules: thin 2px petrol line, honest
 * time-spaced x-axis (cadence stays truthful), a dot per interview with an
 * enlarged active dot ringed in the surface color, a crosshair + rich hover
 * tooltip carrying the per-interview detail, and a recessive dashed average
 * line. All colors are CSS tokens, so light/dark come from the theme.
 */

import {
  Area,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTileDate } from "@/components/tiles";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";

export type ScoreTrendPoint = {
  score: number;
  completedAt: string;
  interviewType: string;
  difficulty: string;
  durationSeconds: number | null;
};

type Datum = ScoreTrendPoint & { t: number; index: number };

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Datum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const minutes =
    d.durationSeconds != null ? Math.round(d.durationSeconds / 60) : null;
  return (
    <div className="min-w-44 rounded-lg border bg-popover p-3 text-popover-foreground shadow-raised">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs font-medium text-muted-foreground">
          Interview {d.index + 1}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTileDate(d.completedAt)}
        </span>
      </div>
      <p className="mt-1 text-2xl font-medium tabular-nums">
        {Math.round(d.score)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          / 100
        </span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="rounded bg-badge-accent/12 px-1.5 py-0.5 font-medium text-badge-accent">
          {optionLabel(INTERVIEW_TYPE_OPTIONS, d.interviewType)}
        </span>
        <span>{optionLabel(DIFFICULTY_OPTIONS, d.difficulty)}</span>
        {minutes != null && <span>· {minutes} min</span>}
      </div>
    </div>
  );
}

export function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  const data: Datum[] = points.map((p, index) => ({
    ...p,
    index,
    t: new Date(p.completedAt).getTime(),
  }));

  const values = data.map((d) => d.score);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // Y domain: snap out to tens so gridlines land on round numbers, clamped 0–100.
  let lo = Math.floor(Math.min(...values) / 10) * 10;
  let hi = Math.ceil(Math.max(...values) / 10) * 10;
  if (lo === hi) {
    lo = Math.max(0, lo - 10);
    hi = Math.min(100, hi + 10);
  }
  const yTicks: number[] = [];
  for (let v = lo; v <= hi; v += 10) yTicks.push(v);

  // X domain: real time, padded a touch so the end dots aren't on the frame.
  const times = data.map((d) => d.t);
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const pad = Math.max((t1 - t0) * 0.06, 12 * 60 * 60 * 1000);

  const accent = "var(--badge-accent)";
  const first = Math.round(values[0]);
  const last = Math.round(values[values.length - 1]);

  return (
    <div
      className="h-[220px] w-full"
      role="img"
      aria-label={`Overall interview scores over time: ${values.length} interviews between ${formatTileDate(
        points[0].completedAt,
      )} and ${formatTileDate(
        points[points.length - 1].completedAt,
      )}, from ${first} to ${last}, averaging ${Math.round(avg)}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 4, left: -8 }}
        >
          <defs>
            <linearGradient id="score-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="0"
          />

          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[t0 - pad, t1 + pad]}
            ticks={times}
            tickFormatter={(t) => formatTileDate(new Date(t).toISOString())}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            minTickGap={0}
          />
          <YAxis
            domain={[lo, hi]}
            ticks={yTicks}
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />

          <ReferenceLine
            y={Math.round(avg)}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{
              value: `avg ${Math.round(avg)}`,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 10,
            }}
          />

          <Tooltip
            content={<TrendTooltip />}
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeDasharray: "3 3",
              strokeOpacity: 0.4,
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke={accent}
            strokeWidth={2}
            fill="url(#score-trend-fill)"
            dot={{
              r: 4,
              fill: accent,
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: accent,
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
