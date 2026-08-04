/*
 * Delivery analysis — the EQ-level read on *how* an answer was delivered,
 * folded into the score at a small, fixed weight (DELIVERY_WEIGHT).
 *
 * Two kinds of signal:
 *  - SUBSTANCE (specificity / structure / directness) — judged by the same LLM
 *    that already evaluates each answer (`answerEvaluationSchema.communication`),
 *    averaged across the session. These are the meaningful, outcome-moving ones.
 *  - HABITS (pace / hedging / filler words) — deterministic, from the transcript
 *    + spoken duration. A light secondary layer. (Filler counts are approximate:
 *    the STT model cleans most "um/uh" — see the Tier-2 note in the vault.)
 *
 * OWNERSHIP ("I" vs "we") is reported as a neutral *observation*, not scored —
 * the ideal ratio is context/role-dependent and scoring it risks penalizing
 * collaborative or modest speakers.
 *
 * Signals are behavioral (word choice, pace, structure), never acoustic
 * (pitch/accent), so folding a small weight into the score coaches delivery
 * without penalizing how a voice sounds. The seed script mirrors this in JS —
 * keep them in sync.
 */

export type CommunicationScores = {
  specificity: number;
  structure: number;
  directness: number;
};

export type DeliveryMetricKey =
  | "specificity"
  | "structure"
  | "directness"
  | "pace"
  | "hedging"
  | "fillers";

export type DeliveryMetric = {
  key: DeliveryMetricKey;
  label: string;
  group: "substance" | "habit";
  /** Pre-formatted display value (habits only; substance leans on the meter). */
  value?: string;
  /** 0–100 sub-score (higher = stronger delivery). */
  score: number;
  /** One-line coaching note. */
  note: string;
  /** True for signals that are known-approximate (filler words under current STT). */
  approximate?: boolean;
};

export type DeliveryReport = {
  /** Overall delivery sub-score, 0–100 (weighted over the scored metrics). */
  score: number;
  spokenAnswers: number;
  answers: number;
  metrics: DeliveryMetric[];
  /** Neutral, unscored notes (e.g. ownership). */
  observations: string[];
};

export type DeliveryInput = {
  transcript: string;
  /** Seconds spoken; null for typed answers (pace can't be measured). */
  durationSeconds: number | null;
  /** Per-answer substance scores from the LLM evaluation, if present. */
  communication?: CommunicationScores | null;
};

/** How much of the final score delivery accounts for. Low and transparent. */
export const DELIVERY_WEIGHT = 0.15;

// Substance leads; habits are a lighter secondary layer; fillers lowest (STT).
const WEIGHTS: Record<DeliveryMetricKey, number> = {
  specificity: 0.22,
  structure: 0.18,
  directness: 0.18,
  pace: 0.14,
  hedging: 0.16,
  fillers: 0.12,
};

const FILLER_PATTERNS: RegExp[] = [
  /\b(?:um+|uh+|uhh+|er+|erm+|ah+|hmm+)\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bbasically\b/gi,
  /\bliterally\b/gi,
  /\bactually\b/gi,
];

const HEDGE_PATTERNS: RegExp[] = [
  /\bi think\b/gi,
  /\bi guess\b/gi,
  /\bi suppose\b/gi,
  /\bmaybe\b/gi,
  /\bprobably\b/gi,
  /\bperhaps\b/gi,
  /\bsort of\b/gi,
  /\bkind of\b/gi,
  /\bi'?m not sure\b/gi,
  /\bi feel like\b/gi,
  /\bhopefully\b/gi,
];

const I_PATTERN = /\b(?:i|i'm|i've|i'll|i'd|me|my|mine|myself)\b/gi;
const WE_PATTERN = /\b(?:we|we're|we've|us|our|ours|ourselves)\b/gi;

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, re) => sum + (text.match(re)?.length ?? 0), 0);
}

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function mean(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

// ————— sub-score curves (coaching-forgiving) —————

function paceScore(wpm: number): number {
  if (wpm >= 110 && wpm <= 165) return 100;
  if (wpm < 110) return clamp(100 - (110 - wpm) * 1.4);
  return clamp(100 - (wpm - 165) * 1.4);
}

const fillerScore = (per100: number) => clamp(100 - per100 * 10);
const hedgeScore = (per100: number) => clamp(100 - per100 * 8);

// ————— substance notes (band-based, since scores are averaged) —————

function substanceNote(key: "specificity" | "structure" | "directness", s: number): string {
  const band = s < 55 ? "low" : s < 75 ? "mid" : "high";
  const notes = {
    specificity: {
      low: "Answers stay general — name numbers, dates, and concrete examples.",
      mid: "Some specifics land; quantify more of your claims.",
      high: "Concrete and evidence-backed.",
    },
    structure: {
      low: "Answers wander — use a clear arc (situation → action → result).",
      mid: "Mostly structured; tighten the through-line.",
      high: "Clear, easy-to-follow structure.",
    },
    directness: {
      low: "Not always answering what's asked — lead with the direct answer.",
      mid: "Gets there, but sometimes circles first.",
      high: "Answers the question head-on.",
    },
  } as const;
  return notes[key][band];
}

/**
 * Analyze a set of answers. Returns null when there's no usable text, so callers
 * can cleanly omit the delivery layer.
 */
export function computeDelivery(inputs: DeliveryInput[]): DeliveryReport | null {
  const answers = inputs.filter((a) => a.transcript.trim().length > 0);
  if (answers.length === 0) return null;

  const allText = answers.map((a) => a.transcript).join(" ");
  const totalWords = wordCount(allText);
  if (totalWords === 0) return null;

  const metrics: DeliveryMetric[] = [];

  // ——— Substance (LLM), averaged over answers that carry communication scores.
  const comms = answers
    .map((a) => a.communication)
    .filter((c): c is CommunicationScores => Boolean(c));
  if (comms.length > 0) {
    (
      [
        ["specificity", "Specificity"],
        ["structure", "Structure"],
        ["directness", "Directness"],
      ] as const
    ).forEach(([key, label]) => {
      const score = clamp(mean(comms.map((c) => c[key])));
      metrics.push({
        key,
        label,
        group: "substance",
        score,
        note: substanceNote(key, score),
      });
    });
  }

  // ——— Habits (deterministic).
  const spoken = answers.filter(
    (a) => a.durationSeconds != null && a.durationSeconds > 0,
  );
  const spokenWords = spoken.reduce((s, a) => s + wordCount(a.transcript), 0);
  const spokenSeconds = spoken.reduce((s, a) => s + (a.durationSeconds ?? 0), 0);
  const wpm =
    spokenSeconds > 0 ? Math.round(spokenWords / (spokenSeconds / 60)) : null;
  if (wpm != null) {
    metrics.push({
      key: "pace",
      label: "Pace",
      group: "habit",
      value: `${wpm} wpm`,
      score: paceScore(wpm),
      note:
        wpm < 110
          ? "A little slow — it can read as hesitant. Aim for a steadier flow."
          : wpm > 165
            ? "A touch fast — breathe between points so they land."
            : "A steady, easy-to-follow rhythm.",
    });
  }

  const hedgeCount = countMatches(allText, HEDGE_PATTERNS);
  const hedgePer100 = (hedgeCount / totalWords) * 100;
  metrics.push({
    key: "hedging",
    label: "Hedging",
    group: "habit",
    value: `${hedgeCount} · ${hedgePer100.toFixed(1)}/100 words`,
    score: hedgeScore(hedgePer100),
    note:
      hedgePer100 < 1.5
        ? "You state things plainly — sounds sure."
        : hedgePer100 < 4
          ? '"I think" / "maybe" creep in — drop a few to sound more certain.'
          : "Lots of hedging — commit to your claims, then caveat if needed.",
  });

  const fillerCount = countMatches(allText, FILLER_PATTERNS);
  const fillerPer100 = (fillerCount / totalWords) * 100;
  metrics.push({
    key: "fillers",
    label: "Filler words",
    group: "habit",
    value: `${fillerCount} · ${fillerPer100.toFixed(1)}/100 words`,
    score: fillerScore(fillerPer100),
    approximate: true,
    note:
      fillerPer100 < 1.5
        ? "Barely any filler — crisp and deliberate."
        : fillerPer100 < 4
          ? "A few fillers (um, you know…) — easy to trim."
          : "Filler words are diluting otherwise good points.",
  });

  // ——— Ownership: reported, not scored.
  const iCount = countMatches(allText, [I_PATTERN]);
  const weCount = countMatches(allText, [WE_PATTERN]);
  const observations: string[] = [];
  if (iCount + weCount > 0) {
    const iPct = Math.round((iCount / (iCount + weCount)) * 100);
    const tail =
      iPct > 85
        ? " — strong ownership; credit the team where it's theirs."
        : iPct < 55
          ? ' — leaning on "we"; make your own role clearer.'
          : ' — a balanced mix of "I" and "we".';
    observations.push(`Spoke in the first person ${iPct}% of the time${tail}`);
  }

  // ——— Overall = weighted average over the scored metrics present.
  const totalWeight = metrics.reduce((s, m) => s + WEIGHTS[m.key], 0);
  const score =
    totalWeight > 0
      ? clamp(
          metrics.reduce((s, m) => s + m.score * WEIGHTS[m.key], 0) / totalWeight,
        )
      : 75;

  return {
    score,
    spokenAnswers: spoken.length,
    answers: answers.length,
    metrics,
    observations,
  };
}

/** Fold delivery into the content score as a small, fixed-weight nudge. */
export function blendScore(
  contentScore: number,
  deliveryScore: number | null,
): number {
  if (deliveryScore == null) return Math.round(contentScore);
  return Math.round(
    contentScore * (1 - DELIVERY_WEIGHT) + deliveryScore * DELIVERY_WEIGHT,
  );
}
