# 0029 — Practice punch-card at home (cross-project), not a streak

**Date:** 2026-08-04
**Status:** accepted

## Context

The per-project dashboard had a "Practice" section (practice time + weekly cadence bars).
Practice is more meaningful **aggregated across all of a user's projects** than siloed per
project. The user also wanted it more engaging — referencing a Duolingo streak.

## Decision

- **Move practice tracking from the project Overview to the home/projects page**, computed
  across **every** project (`app/(app)/page.tsx` already loads all the user's sessions;
  it now also selects `duration_seconds`). Removed the project dashboard's Practice section
  (`PracticeTimeTile` / `PracticeCadenceTile` stay exported but unused).
- Render it as a **calm punch-card** (`components/practice-punchcard.tsx`, data from
  `lib/practice.ts`): a GitHub-contribution-style grid — one square per day, brighter with
  more interviews that day — plus a summary, a less→more legend, and a date range. The grid
  spans **from the user's first project's week to today** (clamped 18–52 weeks so it's
  neither a sliver for new users nor absurdly wide for old accounts), not a fixed window.
  Always renders (empty grid + encouragement) as its empty state.
- **Lives in the home page's 1/3 right rail** (projects fill the left 2/3 as full-width
  cards that list their own interviews — see 2026-08-04 Changelog). It's a **compact
  vertical widget**: title +
  caption, a stat row (`N sessions · X hrs practiced · M projects`), a day-grid that
  **fills the column width** (columns `flex-1`, `aspect-square` cells so they scale to the
  ~380px column instead of ballooning), and a date-range + less→more legend footer. The
  span minimum stays 18 weeks (clamped 18–52).
  - *History:* earlier full-width variants fought whitespace — a side-panel (stats in a
    `border-l` column) left a middle void, so it briefly became a wide horizontal banner
    (`w-max` scrolling band, header stats). Moving the tile into the narrow rail made the
    fill-to-width grid the right answer and retired the banner.

## Why NOT a Duolingo streak

The user's reference was a Duolingo streak (flame, "N-day streak", daily-or-you-lose-it
pressure). **PRODUCT.md explicitly bans this**: *"avoid gamification (streaks, mascots,
confetti, badges) — a real interview isn't a game,"* framing the app as "closer to
Headspace than a game." A streak is loss-framed daily pressure — the opposite of the calm,
non-punishing tone. Surfaced the conflict; the user chose the calm punch-card.

The punch-card keeps the *engaging visual* (a filled-in grid you want to keep filling)
without the *pressure mechanic* (no streak count, no flame, no "don't break it," no guilt
for gaps). It's a reflective log, not a scoreboard. Interview practice isn't daily anyway,
so the grid reads as an honest, low-pressure record.
