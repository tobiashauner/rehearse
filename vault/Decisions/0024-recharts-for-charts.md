# 0024 — Recharts for the analytics score-trend chart

**Date:** 2026-08-02
**Status:** accepted

## Context

The Analytics tab's "Score trend" was a hand-rolled SVG (`TrendChart` in
`components/tiles.tsx`): a static polyline with a single end-dot and no
interactivity. We wanted a more detailed graph that plots every interview as a
point on the line with a hover state showing that interview's detail — i.e. a
real charting library rather than more bespoke SVG.

## Decision

Add **`recharts@3`** and build `components/score-trend-chart.tsx` (client
component) on it. Recharts 3.x lists React 19 in its peer range (the app is on
React 19.2 / Next 16), it's the mainstream React choice, and its `Tooltip` /
`activeDot` / `ReferenceLine` primitives gave us the crosshair + per-point
tooltip + average line with little code.

Chart follows the `dataviz` skill house rules: single series → **no legend**
(the tile title names it); recessive token-driven grid/axes; a dashed average
line; a rich hover tooltip; all colors are CSS variables so light/dark come from
the theme with no per-mode branching.

**Restyled 2026-08-03 (line → capped bars):** at the user's request, adopted a
"capped bar" visual — one bar per interview, a bright tier-colored rounded cap
floating over a soft faded fill of the same hue (a custom `Bar` `shape` +
per-tier `<linearGradient>` defs keyed off the `--score-*` tokens). Kept the
tier coloring (good/ok/needs-work reads per bar), gridlines, average line, and
tooltip. This dropped the original honest **time-spaced** x-axis in favor of
**evenly-spaced categories** (one bar each, dates still labeled) — bars read
cleaner evenly spaced, and cadence-over-time now lives in the Practice cadence
tile, not this chart's x-position.

## Notes / consequences

- The old `TrendChart` SVG stays in `tiles.tsx` because the **legacy, unused**
  `dashboard-widgets.tsx` still imports it. If that file is ever deleted,
  `TrendChart` can go with it. `Sparkline` (project tiles) is untouched.
- The tooltip needs per-interview metadata, so `ProjectAnalytics` now selects
  `interview_type` + `difficulty` alongside score/date/duration and passes a
  `ScoreTrendPoint[]` through `AnalyticsWidgets`. Any new field the tooltip
  shows must be threaded through that same select → props chain.
- First real client-side charting dep in the app; if more charts appear, reuse
  Recharts rather than introducing a second library.
