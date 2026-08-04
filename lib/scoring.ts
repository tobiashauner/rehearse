/*
 * Single source of truth for turning a 0–100 score into a coaching tier:
 * its label, plain-language blurb, band range, and the Tailwind classes that
 * carry its color (text / soft tint / dot / gauge stroke). Kept pure so it
 * works in server and client components alike.
 *
 * Class strings are written out in full (never interpolated) so Tailwind's
 * scanner keeps them. Colors come from the `--score-*` tokens in globals.css,
 * so light/dark are handled by the theme.
 *
 * Tone is deliberately encouraging — this product coaches, it doesn't grade.
 */

export type ScoreTierKey = "excellent" | "strong" | "developing" | "needsWork";

export interface ScoreTier {
  key: ScoreTierKey;
  /** Inclusive lower bound of the band. */
  min: number;
  /** Short human range, e.g. "85–100". */
  range: string;
  /** One-word verdict shown as a chip. */
  label: string;
  /** One-line, coaching-toned read on the band. */
  blurb: string;
  /** `text-*` class for the number/label accent. */
  text: string;
  /** Soft tinted background for chips/circles. */
  soft: string;
  /** Solid fill for legend dots. */
  dot: string;
  /** SVG `stroke-*` class for the gauge arc. */
  stroke: string;
  /** SVG `fill-*` class for chart marks. */
  fill: string;
}

// Ordered high → low; scoreTier() returns the first band the score clears.
export const SCORE_TIERS: ScoreTier[] = [
  {
    key: "excellent",
    min: 85,
    range: "85–100",
    label: "Excellent",
    blurb: "Interview-ready — an answer like this would land in the room.",
    text: "text-score-excellent",
    soft: "bg-score-excellent/12",
    dot: "bg-score-excellent",
    stroke: "stroke-score-excellent",
    fill: "fill-score-excellent",
  },
  {
    key: "strong",
    min: 70,
    range: "70–84",
    label: "Strong",
    blurb: "Convincing and well-structured, with a little polish left to find.",
    text: "text-score-strong",
    soft: "bg-score-strong/12",
    dot: "bg-score-strong",
    stroke: "stroke-score-strong",
    fill: "fill-score-strong",
  },
  {
    key: "developing",
    min: 55,
    range: "55–69",
    label: "Developing",
    blurb: "The bones are here — tighten the specifics and it moves up fast.",
    text: "text-score-developing",
    soft: "bg-score-developing/15",
    dot: "bg-score-developing",
    stroke: "stroke-score-developing",
    fill: "fill-score-developing",
  },
  {
    key: "needsWork",
    min: 0,
    range: "Below 55",
    label: "Needs work",
    blurb: "Worth rebuilding before the real thing — the feedback shows how.",
    text: "text-score-needs",
    soft: "bg-score-needs/12",
    dot: "bg-score-needs",
    stroke: "stroke-score-needs",
    fill: "fill-score-needs",
  },
];

/** Map any number (clamped to 0–100) to its coaching tier. */
export function scoreTier(score: number): ScoreTier {
  const clamped = Math.max(0, Math.min(100, score));
  return SCORE_TIERS.find((t) => clamped >= t.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}
