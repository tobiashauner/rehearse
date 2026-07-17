# 0020 — Project section rail + summary-tile overview

**Context.** [[0019-sectioned-project-page-no-tabs|0019]] replaced tabs with summary
rows and back links. In use, the back-button dance (section → overview → other
section) proved tedious. User verdict: keep a left nav *within* a project, and make
the overview genuinely informative.

**Decision** (user-directed, 2026-07-09). Two halves:

- **Section rail** (`components/project/project-sidebar.tsx`, mounted by
  `app/(app)/projects/[projectId]/layout.tsx`): a left rail on md+ (sticky), a
  horizontal pill row on mobile, shown on *every* page inside a project — overview,
  sections, live session, review. Items: Overview, Resources, AI Briefing, Interview
  Sessions, Analytics, Settings. The project title lives in the project layout's
  header *above* the rail, with a back-to-all-projects arrow to its left (same-day
  refinement; pages below render only section-level `h2`s, and the session/review
  headings were demoted to match). Active state is client-derived
  from `?tab=` (session/review sub-pages highlight Interview Sessions). Active item
  reads as a lifted white card (bg-card + ring + resting shadow) on the warm-paper
  canvas — no amber, which stays reserved for the screen's one primary button.
- **Summary-tile overview** (`components/project/section-tiles.tsx`): the overview is
  a 2-col grid of compact tiles, each a *miniature of its section*: Resources (count +
  first 3 items with type labels), AI Briefing (role-summary clamp-3 + top skill
  chips + generated date), Interview Sessions (latest score + per-session mini-list
  with scores + in-progress/coaching flag), Analytics (average + sparkline + practice
  time). Tiles link into their section; empty tiles carry the what-to-do-next guidance
  so a fresh project still reads as a checklist. Settings has no tile (nothing to
  summarize) — it lives in the rail only.

**Why.** Rows made the overview scannable but navigation two-tap; the rail makes every
section one tap from anywhere (including mid-review), and the overview stops being
navigation at all — it's the project briefing. This also restores a familiar
app-shell pattern (product register: earned familiarity) without resurrecting the
*global* nav removed in [[0018-project-centric-ia-no-global-nav|0018]] — the rail is
strictly project-scoped.

**Consequences.**
- Supersedes 0019's row list (`section-list.tsx` deleted — it lived less than a
  session) and its back-link scheme; `?tab=` URLs are unchanged, so nothing external
  broke.
- The coaching panel's generate button is now always outline: with "New Interview" as
  the sessions section's amber action, DESIGN.md's one-amber-per-screen rule was being
  violated.
- The rail appears during the live interview too. If mid-interview nav proves to be a
  footgun (accidental exits), scope the rail out of
  `/sessions/[sessionId]` — one conditional in the project layout.
