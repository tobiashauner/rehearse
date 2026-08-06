"use client";

/*
 * Weekly growth chart for the admin adoption report: new users, new projects,
 * and new interviews per week, as grouped bars. Colors are CSS tokens so
 * light/dark come from the theme. Mirrors the token/axis conventions in
 * components/score-trend-chart.tsx.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeekPoint } from "@/lib/admin/adoption";

const SERIES = [
  { key: "newUsers", label: "New users", color: "var(--primary)" },
  { key: "newProjects", label: "New projects", color: "var(--badge-accent)" },
  { key: "newInterviews", label: "New interviews", color: "var(--score-strong)" },
] as const;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-raised">
      <p className="text-xs font-medium text-muted-foreground">Week of {label}</p>
      <ul className="mt-2 space-y-1">
        {payload.map((p) => (
          <li key={p.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-medium tabular-nums">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdoptionChart({ data }: { data: WeekPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barGap={2}
          barCategoryGap="24%"
          margin={{ top: 8, right: 8, bottom: 4, left: -12 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted-foreground)", fillOpacity: 0.06 }}
          />
          {SERIES.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={22}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {SERIES.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
