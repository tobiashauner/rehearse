"use client";

/*
 * Score-trend chart (Recharts): overall score per completed interview, drawn as
 * "capped bars" — a bright rounded cap floating over a soft faded fill of the
 * same hue. One series, so no legend (the tile title names it). Each bar is
 * colored by its score tier, keeping the good/ok/needs-work read; recessive
 * gridlines, a dashed average line, and a rich hover tooltip. All colors are
 * CSS tokens, so light/dark come from the theme.
 */

import {
  Bar,
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
import { scoreTier, SCORE_TIERS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export type ScoreTrendPoint = {
  score: number;
  completedAt: string;
  interviewType: string;
  difficulty: string;
  durationSeconds: number | null;
};

type Datum = ScoreTrendPoint & { index: number };

// Tier key → the score token, for building per-tier fill gradients.
const TIER_VAR: Record<string, string> = {
  excellent: "--score-excellent",
  strong: "--score-strong",
  developing: "--score-developing",
  needsWork: "--score-needs",
};

/** Path for a rectangle rounded on its top two corners only. */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + rr} a${rr},${rr} 0 0 1 ${rr},${-rr} h${w - 2 * rr} a${rr},${rr} 0 0 1 ${rr},${rr} v${h - rr} h${-w} z`;
}

/** A bar as a bright rounded cap floating over a soft faded fill. */
function CapBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: Datum;
}) {
  const { x, y, width, height, payload } = props;
  if (
    x == null ||
    y == null ||
    width == null ||
    height == null ||
    height <= 0 ||
    !payload
  ) {
    return null;
  }
  const tier = scoreTier(payload.score);
  const capH = 4;
  const gap = 3;
  const fillTop = y + capH + gap;
  const fillH = Math.max(0, height - capH - gap);
  return (
    <g>
      {fillH > 0 && (
        <path
          d={topRoundedRect(x, fillTop, width, fillH, 6)}
          fill={`url(#bar-${tier.key})`}
        />
      )}
      <rect
        x={x}
        y={y}
        width={width}
        height={capH}
        rx={capH / 2}
        className={tier.fill}
      />
    </g>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Datum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const tier = scoreTier(d.score);
  const minutes =
    d.durationSeconds != null ? Math.round(d.durationSeconds / 60) : null;
  return (
    <div className="min-w-48 rounded-lg border bg-popover p-3 text-popover-foreground shadow-raised">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">
          {optionLabel(INTERVIEW_TYPE_OPTIONS, d.interviewType)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTileDate(d.completedAt)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
            tier.soft,
            tier.text,
          )}
        >
          {Math.round(d.score)}
        </span>
        <div className="min-w-0">
          <span
            className={cn(
              "rounded-4xl px-1.5 py-0.5 text-[10px] font-semibold",
              tier.soft,
              tier.text,
            )}
          >
            {tier.label}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            {optionLabel(DIFFICULTY_OPTIONS, d.difficulty)}
            {minutes != null ? ` · ${minutes} min` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  const data: Datum[] = points.map((p, index) => ({ ...p, index }));

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
          barCategoryGap="30%"
          margin={{ top: 12, right: 12, bottom: 4, left: -8 }}
        >
          <defs>
            {SCORE_TIERS.map((t) => (
              <linearGradient
                key={t.key}
                id={`bar-${t.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={`var(${TIER_VAR[t.key]})`}
                  stopOpacity={0.32}
                />
                <stop
                  offset="100%"
                  stopColor={`var(${TIER_VAR[t.key]})`}
                  stopOpacity={0.04}
                />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="0"
          />

          <XAxis
            dataKey="index"
            type="category"
            tickFormatter={(v) =>
              formatTileDate(data[Number(v)]?.completedAt ?? "")
            }
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval={0}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
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
            cursor={{ fill: "var(--muted-foreground)", fillOpacity: 0.06 }}
          />

          <Bar
            dataKey="score"
            shape={<CapBar />}
            maxBarSize={40}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
