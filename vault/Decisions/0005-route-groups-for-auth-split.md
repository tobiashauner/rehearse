---
date: 2026-07-01
status: accepted
---

# 0005 — `(app)` route group to split authenticated UI from `/login`

**Decision**: all authenticated screens moved from `app/*` into `app/(app)/*`, which has
its own `layout.tsx` rendering the sidebar. `app/login/page.tsx` stays outside that group,
so it only inherits the bare root `app/layout.tsx` (html/body/Providers/Toaster, no
sidebar).

**Why**: the root layout previously always rendered `AppSidebar`, which would have shown
the authenticated nav on the login page too — wrong both visually and semantically (you
shouldn't see "Sign out" before you've signed in). Route groups let two different layout
trees share the same root without a route-prefix change (no `/app/dashboard`, still `/`).

**How to apply going forward**: any new top-level authenticated route goes under
`app/(app)/`; anything that must render without the sidebar (auth pages, a future public
marketing page, etc.) goes outside it, sharing only the root layout.
