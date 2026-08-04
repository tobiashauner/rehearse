---
last-verified: 2026-07-09
---

# Frontend

See [[Overview]] for the folder layout. This note covers the conventions to follow when
adding to it.

## Data fetching pattern

For the Projects CRUD built so far, the pattern is **Server Components for reads, Server
Actions for writes** — not TanStack Query, even though it's installed. Rationale in
[[Decisions/0002-server-actions-over-tanstack-query]]. Keep using this pattern for
similar CRUD screens (Resources list, Interview Sessions list, Settings) unless a screen
needs client-side interactivity that Server Components can't provide. The live interview is
the one such screen so far: `components/interview/interview-runner.tsx` is a `"use client"`
state machine (idle → answering → evaluating → feedback → finishing) that calls the
`sessions/[sessionId]/actions.ts` server actions directly and keeps a live timer + local
question/feedback state — plain `useState`, no TanStack Query/Zustand needed after all. The
session page (server) loads config + question count and hands off to the runner; the review
page is a normal Server Component read (it signs storage URLs server-side for spoken-answer
playback). The runner is voice-first: it auto-plays TTS question audio through a hidden
`<audio>` element, records answers via `hooks/use-recorder.ts` (MediaRecorder +
AnalyserNode) with live frequency bars from
`components/interview/audio-visualizer.tsx` (canvas, draws with `currentColor`), and
falls back to the typed path via a "Type instead" toggle. See
[[Decisions/0015-live-interview-text-mode-first]] and
[[Decisions/0016-voice-layer-tts-stt-choices]].

Concretely:
- Read a page's data: `const supabase = await createClient()` (from
  `lib/supabase/server.ts`) directly inside an `async` Server Component page/layout.
- Write: a `"use server"` action co-located with the route (e.g.
  `app/(app)/projects/actions.ts`), called from a client component's submit handler via
  `useTransition`, not a native `<form action={...}>` — this project uses React Hook Form
  for client-side validation UX first, then calls the action imperatively.
- Shared validation: a Zod schema in `lib/validations/*.ts`, imported by both the client
  form (`zodResolver`) and the server action (`schema.safeParse`), so validation logic
  isn't duplicated or allowed to drift.

## Routing

`app/(app)/` is the authenticated route group (header-only shell); `app/login/` sits
outside it (bare layout). See [[Auth-Flow]] for why. Adding a new authenticated screen
means adding it under `app/(app)/`, not `app/`.

The IA is project-centric (see
[[Decisions/0018-project-centric-ia-no-global-nav|0018]]): `/` is the single project
pane (metric tiles + resume-interview banner); everything else lives under
`/projects/[projectId]`. Inside a project, `[projectId]/layout.tsx` mounts a
horizontal **section nav** + a persistent interview rail (as of 2026-08-03,
[[Decisions/0028-top-nav-and-interview-rail]]). `[projectId]/layout.tsx` renders: the
pinned header (title + `project-top-nav.tsx`, a teal pill nav over Overview / Resources /
AI Briefing / Settings), then `project-shell.tsx` which lays out the body — Overview and
interview (session/review) routes get the **persistent `interview-rail.tsx`** on the left
(interview cards, highlights the open one, "New Interview" on top) + detail on the right;
the focused sections render full-width. The default (no `?tab=`) detail is the **Overview
dashboard** (`project-dashboard.tsx`) — score progression + highlights, coaching plan,
practice stats (interviews live in the rail now). The old Interview Sessions + Analytics
tabs are folded in; `section-tiles.tsx`, `project-analytics.tsx`, `project-sidebar.tsx`,
and `session-list.tsx` were deleted; analytics computation is in `lib/analytics.ts`.
`?tab=<section>` shows resources/briefing/settings; retired `?tab=sessions|analytics`
links fall through to the dashboard. `/projects`, `/analytics`,
and `/settings` are redirects to `/` — don't add new top-level surfaces without
revisiting [[Decisions/0018-project-centric-ia-no-global-nav|0018]].

## Components

- `components/ui/` — shadcn primitives, `base-nova` preset (`@base-ui/react`, not Radix),
  now a broad set (`sidebar`, `item`, `empty`, `table`, `tooltip`, `skeleton`, `command`,
  `field`, `sheet`, `spinner`, `kbd`, plus the original core set). Compound components like
  `Dialog` use a `render` prop for polymorphic triggers/closes (see
  `components/project/create-project-dialog.tsx`:
  `<DialogTrigger render={<Button>New Project</Button>} />`). Base UI's `Button` needs
  `nativeButton={false}` when its own `render` prop points to a non-`<button>` (e.g. a
  `Link`) — see [[Decisions/0009-impeccable-design-system-adoption]]'s Changelog entry.
  `cmdk`-backed components (`command`) need their own `<Command>` root even inside
  `CommandDialog` — see [[Decisions/0010-command-palette-needs-explicit-command-root]].
- `components/project/`, `components/interview/` — feature-specific, per the spec's folder
  structure. `resource-list.tsx` uses `ItemGroup`/`Item` rows (not hand-rolled `<ul><li>`)
  with `Empty` empty states; interviews are the left rail (`interview-rail.tsx`).
- `components/app-header.tsx` — the entire app shell (logo linking home, search pill
  that opens the command palette, `Avatar` + name + `DropdownMenu` sign-out). There is
  no sidebar anymore — see [[Decisions/0018-project-centric-ia-no-global-nav|0018]];
  `components/app-sidebar.tsx` and `components/dashboard-widgets.tsx` are retired but
  kept on disk until a git baseline commit exists.
- `components/project/project-tile.tsx` + `Sparkline` in `components/tiles.tsx` — the
  home pane's metric tiles. The project Overview is `components/project/project-dashboard.tsx`
  (server component; composes the `analytics-widgets.tsx` tiles + `ScoreTrendChart` and
  `CoachingPlanPanel`), fed by `lib/analytics.ts`; interviews + New Interview are the
  layout's `interview-rail.tsx`. Score UI lives in `score-gauge.tsx` / `score-badge.tsx` /
  `score-explainer.tsx` (from `lib/scoring.ts`); the review-page Delivery panel is
  `delivery-panel.tsx` (from `lib/delivery.ts`).
- `components/command-menu.tsx` — Cmd+K command palette, project-centric: fetches the
  project list with the browser Supabase client each time it opens (jump-to-project +
  "New Project"). A controlled component (`open`/`onOpenChange` props) since both the
  header's search-pill click and the global Cmd+K shortcut need to open it; state and
  the keyboard listener live in `AppHeader`, not the command menu itself.

## Styling

Tailwind v4. A real design system is now in place — see root `DESIGN.md` (visual tokens)
and `PRODUCT.md` (strategic/brand context), written and applied via the
[[Decisions/0009-impeccable-design-system-adoption|Impeccable skill]]. `app/globals.css`
carries the "Golden Hour Briefing" palette (honey-amber primary, deep-petrol
`--badge-accent` for category/type badges, warm-neutral ink/muted/border scale, soft
`--shadow-resting`/`--shadow-raised` elevation). No dark mode toggle built yet (Settings
tab placeholder only; `.dark` CSS exists but is unreachable — no `ThemeProvider` wired up).

Surfaces are a three-tier neutral hierarchy, darkest to lightest: `--sidebar` (nav/header
shell) → `--background` (content pane, a barely-there warm tint) → `--card`/`--popover`
(pure white). See [[Decisions/0013-three-tier-surface-hierarchy]] for the exact values and
why pure-white-everywhere was replaced.

Font is Inter (via `next/font/google`, `--font-sans`), not Geist — swapped project-wide,
see [[Decisions/0012-density-and-color-pass]]. `--badge-accent` (deep-petrol) is
`oklch(0.48 0.14 200)`, a more vivid/saturated value than the original
`oklch(0.28 0.09 200)`, which read as near-black. Base UI density across shadcn primitives
(Button, Input, Label, Textarea, Select, Tabs, DropdownMenu, Card, Empty, Item, Dialog,
Sidebar menu items) was bumped from a compact `text-sm`/`h-8` scale to a roomier
`text-base`/`h-10` scale, and the one arbitrary-value holdout (`text-[0.8rem]` on small
buttons) was fixed to the standard `text-sm` token — always use the standard Tailwind
type/spacing scale here, never arbitrary values.
