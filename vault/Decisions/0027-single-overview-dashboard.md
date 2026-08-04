# 0027 — One Overview dashboard (fold in Sessions + Analytics)

**Date:** 2026-08-03
**Status:** accepted — revises [[Decisions/0019-sectioned-project-page-no-tabs]] and
[[Decisions/0020-project-rail-and-summary-tiles]]

## Context

Navigating Overview → Interview Sessions → Analytics as three separate sections was
cumbersome and scattered related information. The user wanted one engaging page.

## Decision

Collapse the project IA to four rail items: **Overview / Resources / AI Briefing /
Settings**. The Overview *is* the dashboard now (`components/project/project-dashboard.tsx`),
composing, top to bottom:

1. **Interviews** — the session cards + the "New Interview" action in the header.
2. **Score progression & highlights** — the score-trend chart beside Average / Answer-length highlights.
3. **Coaching plan** — the `CoachingPlanPanel`.
4. **Practice** — practice time + weekly cadence.

## Implementation notes

- The old summary-tile overview (`section-tiles.tsx`, from 0020) and the Analytics-tab
  wrapper (`project-analytics.tsx`) are **deleted**. Their analytics computation moved to
  `lib/analytics.ts` (`getProjectAnalytics`), and the individual tiles are now exported
  from `analytics-widgets.tsx` and re-composed on the dashboard.
- `page.tsx` renders `<ProjectDashboard>` for the no-`?tab=` route; only
  resources/briefing/settings remain as focused section views. Retired
  `?tab=sessions|analytics` links fall through to the dashboard (not in `SECTION_TITLES`
  → treated as Overview), so old deep links don't 404.
- `project-sidebar.tsx` dropped the two items; session/review sub-pages carry no `?tab=`
  so **Overview stays highlighted** while inside an interview.
- The dashboard is a server component that fetches its own data (sessions, coaching,
  briefing existence, analytics), keeping the page route thin.

## Consequence

0019/0020's "section rail + one-section-per-tab, overview = summary tiles" model is
superseded for the interview/analytics half: those now live together on one page. The
rail pattern itself (0018's project-centric IA) still holds.
