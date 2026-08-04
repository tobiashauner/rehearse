# 0026 — Delivery (Tier-1 EQ) analysis, folded into the score

**Date:** 2026-08-03
**Status:** accepted

## Context

Scoring only judged *what* was said (content). The user asked for an EQ-level read on
*how* it was said — confidence, filler words ("um", "you know"), "I" vs "we", pace — and
asked that it be baked into the score and surfaced in the analysis UX.

## Decision

Two kinds of signal in `lib/delivery.ts`, combined into one delivery sub-score:

- **Substance (LLM):** Specificity, Structure, Directness — emitted by the *same*
  per-answer evaluation call we already run (`answerEvaluationSchema.communication`),
  averaged across the session. These are the meaningful, outcome-moving signals and are
  weighted higher.
- **Habits (deterministic):** pace (wpm), hedging rate, filler-word rate — from the
  transcript + spoken `duration_seconds`, no extra call. A lighter secondary layer.
- **Ownership ("I" vs "we"):** reported as a neutral **observation**, *not* scored — its
  ideal ratio is role/context-dependent (crediting the team can be the right answer), and
  scoring it risks penalizing collaborative or modest speakers.

**Fold it into the score at a fixed, transparent 15%** (`blendScore`). Computed at
interview completion in `generateSessionSummary` and stored in the
`interview_sessions.summary` jsonb: `delivery` (the report — metrics grouped
substance/habit + `observations`) + `contentScore` (the AI's content-only score);
`summary.overallScore` and the `overall_score` column become the blend. Surfaced on the
review page as a **Delivery panel** and a **Content · Delivery** breakdown under the
gauge, and project-wide on the dashboard **Delivery tile**; the "How is this scored?"
popover explains the 15%.

> Evolution: this started (same date) as *deterministic Tier-1 only* (pace/fillers/
> hedging/ownership, all scored). A design review concluded the tics were the easy signal,
> not the meaningful one — so substance dimensions were added via the existing LLM call
> and ownership was demoted to an observation. The LLM lift is ~free because that call
> already runs per answer.

## Why these choices

- **Behavioral, not acoustic.** Every signal is word choice, structure, or pace —
  coachable, and none penalize accent, timbre, or a soft voice. That's what makes baking
  them into the score defensible where an acoustic "confidence" score would risk bias
  against non-native / neurodivergent / soft-spoken speakers. Keep the weight low and
  always shown; never let delivery dominate content. Lean substance-heavy so we don't
  train people toward a robotic "no fillers, fast, all-I" style.
- **No migration.** Delivery lives in the existing `summary` jsonb (append fields), not
  new columns.
- **Store at completion, not display-time**, so every read surface (dashboard trend,
  session list, tiles) reflects the same blended number without recomputing.

## Caveats / follow-ups

- The STT model (`gpt-4o-mini-transcribe`) **cleans most disfluencies**, so real "um/uh"
  counts undercount on spoken interviews. Pace, hedging, and ownership are unaffected.
- **Tier 2** (not built): switch to word-timestamp STT (`whisper-1` verbose_json) for
  true filler + pause detection, and capture mic volume via the Web Audio API at record
  time. **Tier 3**: an audio-input LLM (`gpt-4o-audio-preview`) for holistic tone/energy.
- The seed script (`scripts/seed-sample-project.mjs`) mirrors this math in JS to produce
  coherent demo data — **keep the two in sync**.
- Old completed sessions predating this have no `delivery` — the review page hides the
  panel gracefully.
