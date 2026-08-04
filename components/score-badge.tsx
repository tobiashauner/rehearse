/*
 * Tier-colored score primitives, shared everywhere a score surfaces so the
 * color language stays consistent (review transcript, session list, tiles).
 * Pure — no client hooks — so server components can render them directly.
 * The animated hero gauge lives separately in score-gauge.tsx.
 */

import { scoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

/** Inline "72/100" pill, tinted by tier. For per-answer scores. */
export function ScorePill({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tier = scoreTier(score);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-4xl px-2 py-0.5 text-xs font-semibold tabular-nums",
        tier.soft,
        tier.text,
        className,
      )}
    >
      {Math.round(score)}
      <span className="font-normal opacity-60">/100</span>
    </span>
  );
}

/** Round score chip (session list, compact rows), tinted by tier. */
export function ScoreCircle({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tier = scoreTier(score);
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
        tier.soft,
        tier.text,
        className,
      )}
    >
      {Math.round(score)}
    </span>
  );
}

/** Larger tier disc for headline stats (overview tiles). */
export function ScoreDisc({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tier = scoreTier(score);
  return (
    <span
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold tabular-nums",
        tier.soft,
        tier.text,
        className,
      )}
    >
      {Math.round(score)}
    </span>
  );
}
