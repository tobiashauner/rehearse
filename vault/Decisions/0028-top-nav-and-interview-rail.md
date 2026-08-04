# 0028 — Horizontal section nav + persistent interview rail

**Date:** 2026-08-03
**Status:** accepted — revises [[Decisions/0027-single-overview-dashboard]]

## Context

0027 put everything on one Overview page with a vertical section rail on the left. The
user wanted the sections laid out **horizontally on top**, and the interviews pulled into
a **persistent left list** (inbox-style: list on the left, detail on the right) that stays
put — and highlights the open interview — while inside an interview.

## Decision

- **Top nav** (`components/project/project-top-nav.tsx`): the section links
  (Overview / Resources / AI Briefing / Settings) as a rounded **pill track**, active =
  solid **teal** (`--badge-accent`) pill. Lives in the pinned header next to the title.
- **Persistent interview rail** (`components/project/interview-rail.tsx`): every interview
  as a compact card (type · difficulty · status + tier score circle), "New Interview" at
  the top. It highlights the interview whose id is in the pathname (teal ring).
- **Layout decides the body** (`components/project/project-shell.tsx`): Overview and
  interview (session/review) routes get **rail (left) + detail (right)**; the focused
  sections (Resources / AI Briefing / Settings) render **full-width** (no rail).

The rail + nav live in `[projectId]/layout.tsx`, which **persists across Overview ↔
interview navigation** — the rail doesn't remount, so switching interviews just re-paints
the detail and moves the highlight. The layout fetches the rail's data (sessions,
briefing-exists, completed count) once; `revalidatePath('/projects/[id]')` refreshes it
after a new interview is created.

## Consequences

- The Overview dashboard (`project-dashboard.tsx`) **dropped its Interviews section** — it
  now shows Score progression, Coaching plan, and Practice (the interviews are the rail).
- Retired and **deleted** `project-sidebar.tsx` (vertical rail) and `session-list.tsx`
  (the dashboard grid); the rail's card is purpose-built for the narrow column.
- Session/review pages now render in the detail column beside the rail. The runner is a
  touch narrower on large screens as a result — acceptable; revisit if it feels cramped.
- Section highlighting: session/review routes carry no `?tab=`, so **Overview** stays the
  active pill while inside an interview (consistent with the rail owning that context).
