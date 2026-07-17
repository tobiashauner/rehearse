---
date: 2026-07-16
status: accepted
---

# 0022 — Public landing page served at "/" via middleware rewrite

**Decision**: the marketing entry page lives at `app/welcome/page.tsx` (statically
prerendered, outside the `(app)` group so it gets no authenticated chrome), but
signed-out visitors to `/` are **rewritten** — not redirected — to it in
`lib/supabase/middleware.ts`. Signed-in users hitting `/welcome` or `/login` are
redirected to `/` (the app home).

**Why**: `/` must serve two different pages — the app home for signed-in users
(`app/(app)/page.tsx`) and the landing for visitors — and two route files can't both
claim `/`. A rewrite keeps the public URL clean (visitors see `rehearse…/`, never a
`/welcome` redirect flash) without restructuring the app's project-centric IA
([[Decisions/0018-project-centric-ia-no-global-nav|0018]]), which owns `/` as the
projects pane. The rewrite response copies the Supabase cookies so token refresh
behavior is unchanged.

**Design**: the page stays inside the Golden Hour Briefing system (warm paper, one
amber CTA per viewport, deep petrol secondary, Inter) with brand-register latitude:
larger display scale, one drenched petrol band ("Coaching, not testing."), and
product-true CSS vignettes instead of screenshots. Motion is a single load
choreography + ambient waveform loop, both disabled under `prefers-reduced-motion`
(`app/welcome/welcome.css`).
