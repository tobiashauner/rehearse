# 0019 — Sectioned project page: summary rows instead of tabs

> **Superseded same-day by [[0020-project-rail-and-summary-tiles]]** — the back-link
> navigation proved tedious in use; rows became summary tiles and a project-scoped
> section rail took over navigation. The `?tab=` section mechanism survives.

**Context.** After [[0018-project-centric-ia-no-global-nav|0018]] made the project the
only unit of navigation, the project page still opened onto a six-tab strip whose
default tab (Overview) was a near-empty `<dl>` — a menu, not a briefing. The user's
verdict: boring; flatten further.

**Decision** (user-directed, 2026-07-09). The project page has no tabs. Its default
view is an **overview of section rows** — Resources, AI Briefing, Interview Sessions,
Analytics, Settings — each a large tappable row with a *live one-line summary* of its
contents (resource types, briefing role-summary snippet, interview count + latest
score, average/practice-time, plus a right-side datum: count, date, score, sparkline).
Clicking a row shows that single section full-page with a `← {project title}` back
link; the overview itself carries a `← Projects` link back home
(`components/project/section-list.tsx`).

**Mechanics worth knowing:**
- The URL param is still `?tab=` (validated against the section map) so pre-existing
  deep links — the review page's "Plan next interview" → `?tab=sessions`, vault docs —
  keep working. No param = overview.
- The old Overview tab is gone entirely; its contents (role/company/status/created)
  live in the page header. The "Interview readiness score coming soon" teaser line was
  dropped rather than kept as a permanent promise.
- Summaries double as guidance in the empty state ("Add your resume and the job
  description…", "Generate the AI briefing first, then rehearse") — the overview
  answers "what should I do next?" at every stage, per the product spec's own UI
  principle.

**Why rows with summaries beat tabs here.**
- Tabs hide state: six labels tell you nothing about whether the briefing exists or
  how the last interview went. Summary rows make the project page itself the status
  report — the anxious night-before user sees where they stand without clicking.
- One level of depth, always the same way back — cheaper to navigate under stress than
  remembering which tab you were on.

**Revisit triggers.** If a section's summary needs more than one line to be useful, or
users bounce between two sections constantly (e.g. sessions ↔ analytics), tabs or a
two-pane layout inside the section view may earn their way back.
