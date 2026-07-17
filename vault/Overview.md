---
last-verified: 2026-07-03
---

# Architecture Overview

Repo: `/Users/tobiashauner/interview-coach`. See [[00-Product-Spec]] for what it's meant to
do; this note covers how it's actually built.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4, Turbopack)
- **shadcn/ui** — initialized with the `base-nova` preset (uses `@base-ui/react` primitives,
  not Radix — matters for component prop shapes, e.g. `Dialog`'s `render` prop pattern)
- **Supabase** — Postgres + Auth + Storage + RLS. See [[Backend]] and [[Database-Schema]].
- **OpenAI** — partially wired: `project-analysis.ts` and `question-generation.ts` make
  real structured-output calls (see [[Decisions/0007-openai-structured-outputs-via-zod]]);
  `answer-evaluation.ts`, `follow-up-generation.ts`, `session-summary.ts`,
  `coaching-plan.ts` are still stubs, needed for #4 onward (live interview, feedback,
  adaptive follow-ups — see [[Roadmap]]). No TTS/STT wiring yet either.
- **pnpm** — package manager. Supabase CLI is a devDependency (`pnpm exec supabase ...`),
  not a global install.
- React Hook Form + Zod for form validation (zod pinned to v3 — see
  [[Decisions/0004-zod-v3-pin]]).
- TanStack Query and Zustand are installed per the spec but **not yet used** — current CRUD
  (Projects) uses Server Components + Server Actions instead. See
  [[Decisions/0002-server-actions-over-tanstack-query]] for when to reach for them.

## Folder structure

Follows the spec's structure with one addition (`lib/validations/`) and one restructure
(`app/` split into a `(app)` route group vs `app/login`):

```
app/
  (app)/            # everything that requires auth — has its own layout.tsx with the sidebar
    layout.tsx      # fetches user, redirects to /login if none, renders AppSidebar
    page.tsx        # Dashboard
    projects/
      page.tsx              # Projects list
      actions.ts             # createProject server action
      [projectId]/page.tsx   # Project Details (tabs)
      [projectId]/sessions/[sessionId]/page.tsx          # Interview session (placeholder)
      [projectId]/sessions/[sessionId]/review/page.tsx   # Review session (placeholder)
    analytics/page.tsx   # placeholder
    settings/page.tsx    # placeholder
  login/
    page.tsx        # sign in / sign up, toggled on one screen
    actions.ts       # login / signup server actions
  layout.tsx         # root layout — html/body/Providers/Toaster only, no sidebar
  providers.tsx       # TanStack QueryClientProvider wrapper
components/
  ui/               # shadcn components
  project/          # e.g. create-project-dialog.tsx
  interview/        # empty so far
  app-sidebar.tsx
  sign-out-button.tsx
lib/
  supabase/{client,server,middleware}.ts   # typed with Database from types/database.ts
  openai/client.ts
  prompts/*.ts       # stub modules, one per spec's "AI Prompt Strategy" section
  validations/{auth,project}.ts   # shared zod schemas (client form + server action)
  utils.ts            # shadcn's cn() helper
supabase/
  config.toml
  migrations/20260701040516_core_schema.sql   # see [[Database-Schema]]
types/database.ts     # generated via `supabase gen types typescript --linked`
vault/                 # this vault
proxy.ts               # Next 16's file convention (formerly middleware.ts) — auth gate
```

## Request flow (authenticated page load)

1. `proxy.ts` runs on every request → `lib/supabase/middleware.ts` `updateSession()`.
2. Refreshes the Supabase session, then redirects `/login` ↔ `/` based on auth state.
   See [[Auth-Flow]].
3. `app/(app)/layout.tsx` (Server Component) re-fetches the user (defense in depth),
   renders `AppSidebar` with the user's email + sign-out button.
4. Each page is an `async` Server Component that queries Supabase directly via
   `lib/supabase/server.ts`'s `createClient()` — no client-side fetching library involved
   for this data (see [[Frontend]]).
