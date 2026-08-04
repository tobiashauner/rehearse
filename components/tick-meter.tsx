import { scoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

/*
 * Ticked/equalizer meter: fixed-width thin vertical ticks (a repeating gradient,
 * so ticks stay a constant width at any container width). The filled portion —
 * up to the score, in the tier color — is full-height and thin (2px). The
 * remaining "unused" portion is light-gray ticks that are shorter (centered) and
 * a touch thicker (3px), matching the reference dashboard look. Pure — no client
 * hooks.
 */

const TIER_VAR: Record<string, string> = {
  excellent: "--score-excellent",
  strong: "--score-strong",
  developing: "--score-developing",
  needsWork: "--score-needs",
};

const FILLED = (color: string) =>
  `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 6px)`;
const UNUSED = `repeating-linear-gradient(90deg, var(--border) 0 3px, transparent 3px 6px)`;

export function TickMeter({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const tier = scoreTier(score);
  const clamped = Math.max(0, Math.min(100, score));
  const filled = `var(${TIER_VAR[tier.key]})`;
  const height = size === "sm" ? "h-3.5" : "h-4";

  return (
    <div
      className={cn("flex w-full items-center overflow-hidden", height, className)}
      aria-hidden
    >
      {/* Filled: full-height, thin tier ticks. */}
      <div
        className="h-full shrink-0"
        style={{ width: `${clamped}%`, backgroundImage: FILLED(filled) }}
      />
      {/* Unused: shorter (centered) + slightly thicker gray ticks. */}
      <div className="h-[55%] flex-1" style={{ backgroundImage: UNUSED }} />
    </div>
  );
}
