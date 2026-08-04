# 0025 — Score display system: tiers, tokens, and an SSR-safe gauge

**Date:** 2026-08-03
**Status:** accepted

## Context

The score was a bare number — no sense of "is 61 good?", no explanation of how it's
derived. The product ethos is "coaching, not testing," so scores need to read as a
bearing, not a verdict.

## Decision

A single scoring vocabulary in `lib/scoring.ts`: four **coaching-tone tiers** —
Excellent (85–100), Strong (70–84), Developing (55–69), Needs work (<55) — each with a
label, blurb, band range, and Tailwind class strings (`text` / `soft` / `dot` / `stroke`
/ `fill`) written out in full so the scanner keeps them. Colors come from `--score-*`
tokens in `globals.css` (a red→amber→teal→green ramp) defined for **both** light and
dark surfaces, so theming is automatic.

Components:
- `score-gauge.tsx` — the review hero radial gauge. **The number renders at its real
  value immediately** (SSR-safe); only the ring sweeps. An earlier version counted up
  from 0 via a JS animation and could get **stuck at 0** in a backgrounded/throttled tab
  — correctness must not depend on an animation running.
- `score-badge.tsx` — `ScorePill` (inline "72/100") and `ScoreCircle` (list chips), pure
  so server components can render them.
- `score-explainer.tsx` — a base-ui `Popover` that states, truthfully, how scores are
  derived (per-answer AI grading, difficulty calibration, holistic overall, and the
  delivery slice — see [[Decisions/0026-delivery-analysis-baked-into-score]]) and doubles
  as the tier-color legend.

Text always wears ink tokens; tier color is carried by the gauge, dots, and tinted chips
(the dataviz house rule).

## Consequences

- Every score surface (review hero, per-answer pills, session cards, dashboard tiles,
  trend-chart dots) reads from the same tier helper — change a band once, everywhere
  updates.
- Any new animated number must render correct without the animation (see the gauge fix).
- `scoreTier()` is pure and safe in both server and client components.
