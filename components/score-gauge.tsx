"use client";

/*
 * The hero score moment on the review page: a radial gauge colored by tier.
 * Purely visual (aria-hidden — the adjacent text states the score and verdict).
 *
 * The number renders at its real value immediately (SSR-safe, never depends on
 * a JS animation to become correct — an earlier count-up could get stuck at 0
 * in a backgrounded/interrupted tab). Only the ring *sweeps* as the flourish,
 * and its resting `strokeDashoffset` is the correct value even if that
 * animation never runs. Reduced-motion snaps the ring instantly.
 */

import { motion, useReducedMotion } from "framer-motion";
import { scoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function ScoreGauge({
  score,
  size = 116,
  stroke = 9,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const tier = scoreTier(score);
  const value = Math.round(Math.max(0, Math.min(100, score)));
  const reduce = useReducedMotion();

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-foreground/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={tier.stroke}
          initial={{ strokeDashoffset: reduce ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-[2rem] leading-none font-semibold tabular-nums",
            tier.text,
          )}
        >
          {value}
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  );
}
