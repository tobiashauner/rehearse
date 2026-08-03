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
(the tile title names it); honest **time-spaced** x-axis (one tick per
interview) so cadence stays truthful; thin 2px petrol line; ≥8px dots ringed in
the surface color; recessive token-driven grid/axes; all colors are CSS
variables (`--badge-accent`, `--card`, `--border`, `--muted-foreground`,
`--popover`) so light/dark come from the theme with no per-mode branching.

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
