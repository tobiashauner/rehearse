"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, TrendingUp } from "lucide-react";
import { scoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

/*
 * Live, SVG/CSS mini-demos for the landing page — faithful miniatures of two
 * real in-app surfaces, standing in for static screenshots so they stay crisp
 * and animate. Both reuse the product's score tiers (`scoreTier`), tier tokens,
 * and the tick-meter treatment, so a change to those tokens flows here too.
 *
 * - ScoreTrendDemo mirrors components/score-trend-chart.tsx (capped, tier-
 *   colored bars, gridlines, dashed average line): the "you're getting better"
 *   proof artifact a chatbot can't produce.
 * - DeliveryDemo mirrors components/delivery-panel.tsx (score + tier chip and a
 *   grid of ticked metric meters): how you came across, measured per answer.
 *
 * Both reveal on scroll-in and honor prefers-reduced-motion (shown immediately,
 * no transition).
 */

// `--score-*` token per tier, for gradients/fills that need the raw CSS var
// (the Tailwind `text-/bg-score-*` classes cover the rest).
const TIER_VAR: Record<string, string> = {
  excellent: "--score-excellent",
  strong: "--score-strong",
  developing: "--score-developing",
  needsWork: "--score-needs",
};
const tierVar = (score: number) => `var(${TIER_VAR[scoreTier(score).key]})`;
const fade = (score: number, pct: number) =>
  `color-mix(in oklab, ${tierVar(score)} ${pct}%, transparent)`;

/** Reveal-on-scroll flag; true immediately when reduced motion is preferred. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

/* ————— Score trend: the improvement curve ————— */

const TREND = [
  { date: "Jul 12", score: 51 },
  { date: "Jul 15", score: 58 },
  { date: "Jul 19", score: 66 },
  { date: "Jul 24", score: 72 },
  { date: "Jul 29", score: 79 },
  { date: "Aug 3", score: 88 },
];
const TREND_AVG = 69;
// Non-zero baseline (like the real chart's snapped domain) so the rise reads.
const BASE = 40;
const CHART_H = 176; // px; fixed so bar heights resolve without % chains.
const heightPct = (score: number) => ((score - BASE) / (100 - BASE)) * 100;
const barPx = (score: number) => (heightPct(score) / 100) * CHART_H;

export function ScoreTrendDemo({ className }: { className?: string }) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <figure
      ref={ref}
      className={cn(
        "w-full rounded-2xl border bg-card p-6 shadow-resting",
        className,
      )}
      role="img"
      aria-label="Interview scores rising from 51 to 88 across six practice sessions over three weeks, averaging 69."
    >
      <figcaption className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="size-4 text-badge-accent" aria-hidden="true" />
          Score across sessions
        </span>
        <span className="text-xs text-muted-foreground">0–100</span>
      </figcaption>

      <div
        className="relative mt-6"
        style={{ height: CHART_H }}
        aria-hidden="true"
      >
        {/* Recessive gridlines. */}
        {[0, 25, 50, 75].map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 border-t border-border/70"
            style={{ bottom: `${t}%` }}
          />
        ))}
        {/* Dashed average line. */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
          style={{ bottom: `${heightPct(TREND_AVG)}%` }}
        >
          <span className="absolute right-0 -top-4 text-[10px] text-muted-foreground">
            avg {TREND_AVG}
          </span>
        </div>
        {/* Capped, tier-colored bars that grow on reveal. */}
        <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-3">
          {TREND.map((d, i) => {
            const tier = scoreTier(d.score);
            return (
              <div key={d.date} className="relative flex h-full flex-1 items-end">
                <div
                  className="relative w-full rounded-t-md transition-[height] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    height: shown ? barPx(d.score) : 0,
                    transitionDelay: `${i * 90}ms`,
                    background: `linear-gradient(to top, ${fade(d.score, 4)}, ${fade(d.score, 32)})`,
                  }}
                >
                  {/* Bright rounded cap. */}
                  <div
                    className="absolute inset-x-0 top-0 h-1 rounded-full"
                    style={{ background: tierVar(d.score) }}
                  />
                  {/* Floating score. */}
                  <span
                    className={cn(
                      "absolute inset-x-0 -top-6 text-center text-xs font-semibold tabular-nums transition-opacity duration-500 motion-reduce:transition-none",
                      tier.text,
                    )}
                    style={{
                      opacity: shown ? 1 : 0,
                      transitionDelay: `${i * 90 + 250}ms`,
                    }}
                  >
                    {d.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X labels. */}
      <div className="mt-3 flex justify-between gap-2 sm:gap-3">
        {TREND.map((d) => (
          <span
            key={d.date}
            className="flex-1 text-center text-[11px] text-muted-foreground"
          >
            {d.date}
          </span>
        ))}
      </div>
    </figure>
  );
}

/* ————— Delivery: how you came across ————— */

const METRICS = [
  {
    key: "pace",
    label: "Pace",
    value: "138 wpm",
    score: 82,
    note: "Steady — easy to follow.",
  },
  {
    key: "filler",
    label: "Filler words",
    value: "9 “um”",
    score: 60,
    note: "A few crept in under pressure.",
  },
  {
    key: "hedging",
    label: "Hedging",
    value: "4 softeners",
    score: 66,
    note: "“Sort of”, “I guess” — diluted two strong points.",
  },
  {
    key: "ownership",
    label: "Ownership",
    value: "“I” 12×",
    score: 88,
    note: "You claimed the decisions as yours.",
  },
];
const DELIVERY_SCORE = 76;

function Meter({
  score,
  shown,
  delay,
  className,
}: {
  score: number;
  shown: boolean;
  delay: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-4 w-full items-center overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Filled: full-height, thin tier ticks; width grows on reveal. */}
      <div
        className="h-full shrink-0 transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{
          width: shown ? `${score}%` : "0%",
          transitionDelay: `${delay}ms`,
          backgroundImage: `repeating-linear-gradient(90deg, ${tierVar(score)} 0 2px, transparent 2px 6px)`,
        }}
      />
      {/* Unused: shorter, slightly thicker gray ticks. */}
      <div
        className="h-[55%] flex-1"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--border) 0 3px, transparent 3px 6px)",
        }}
      />
    </div>
  );
}

export function DeliveryDemo({ className }: { className?: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const tier = scoreTier(DELIVERY_SCORE);
  return (
    <div
      ref={ref}
      className={cn(
        "w-full rounded-2xl border bg-card p-6 shadow-resting",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AudioLines className="size-4 text-badge-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Delivery</p>
            <p className="text-xs text-muted-foreground">How you came across</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-semibold tabular-nums", tier.text)}>
            {DELIVERY_SCORE}
          </span>
          <span
            className={cn(
              "rounded-4xl px-2 py-0.5 text-xs font-semibold",
              tier.soft,
              tier.text,
            )}
          >
            {tier.label}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {METRICS.map((m, i) => {
          const t = scoreTier(m.score);
          return (
            <div key={m.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{m.label}</span>
                <span className={cn("text-xs tabular-nums", t.text)}>
                  {m.value}
                </span>
              </div>
              <Meter
                score={m.score}
                shown={shown}
                delay={i * 120}
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{m.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
