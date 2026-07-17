# 0018 — Project-centric IA: no global nav, home is the project pane

**Context.** The MVP shipped with a four-item global sidebar (Dashboard, Projects,
Analytics, Settings) inherited from the spec's navigation list. In practice everything
in the product is project-scoped — sessions, briefings, coaching, scores all belong to
one job pursuit — so the global surfaces were either thin aggregates (Dashboard,
Analytics) or empty (Settings), and the nav made users choose between four doors when
there was really one.

**Decision** (user-directed, 2026-07-09). The app shell is header-only (logo → home,
⌘K search, avatar). Home (`/`) is a single project pane: one metric-rich tile per
project (latest score + sparkline trend, interview count, in-progress marker, last
practiced) plus a single "resume interview" banner when a session is mid-flight.
Analytics and Settings live only at project level (project tabs). `/projects`,
`/analytics`, `/settings` are redirects to `/` so old links land well.

**What replaced the dashboard widgets:**
- *Continue interview* → the home banner (the pane's one primary action when present).
- *Recent scores / score trend* → per-project tile sparkline + the project Analytics tab.
- *Practice today* → dropped; per-project "Practiced <date>" on tiles carries recency.

**Why.**
- The spec's own product philosophy ("the product revolves around Projects", "every
  screen answers: what should I do next?") points here — a stressed pre-interview user
  wants their project, not a dashboard about their projects.
- Cross-project aggregates (global average score, global cadence) mix unrelated jobs;
  a Finch PM score trend and an Anthropic staff-eng trend average into nothing
  actionable. Per-project analytics is the honest cut.
- One accent rule holds naturally: with a resume banner present, New Project demotes to
  outline so the pane has exactly one amber action.

**Consequences / revisit triggers.**
- `components/app-sidebar.tsx` and `components/dashboard-widgets.tsx` are retired but
  left on disk (the repo has no commits yet, so deletion would be unrecoverable) — safe
  to delete once a baseline commit exists.
- Supersedes the shell half of [[0011-header-above-sidebar-layout|0011]]; the
  three-tier surface hierarchy of [[0013-three-tier-surface-hierarchy|0013]] survives
  as header (petrol-neutral) → warm-paper canvas → white cards.
- If users someday juggle many projects (10+), home may need search/filter/sort or a
  cross-project digest — that's the point to reconsider a global surface, not before.
