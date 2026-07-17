---
last-verified: 2026-07-03
---

# Environment

## Running the app

```
pnpm dev     # local dev server, http://localhost:3000
pnpm build   # production build (also the CI-equivalent check — run before calling anything done)
pnpm lint    # eslint
pnpm start   # serve a production build (after `pnpm build`) — this is the "npm start" equivalent
```

Not `npm start` — this project uses pnpm throughout, and `start` only works after `build`
(it's not a dev server).

## Credentials

Live in `.env.local` (gitignored — never committed, never copied into this vault):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`OPENAI_API_KEY` (set as of 2026-07-06, via an OpenAI project service-account key —
prepaid billing, $5 minimum top-up required or calls fail with insufficient-quota even
though actual usage is a fraction of a cent per interview), `OPENAI_MODEL` (optional,
defaults to `gpt-5.4-mini` if unset — see
[[Decisions/0007-openai-structured-outputs-via-zod]] for why `gpt-4o-mini`, the original
default, was swapped out: it had dropped off OpenAI's current pricing page by the time of
setup).

If `.env.local` is ever lost: Supabase URL/anon/service-role keys are in the dashboard
under Project Settings → API (project ref `nrcmtbduoxcwplbaspex`, not a secret — see
[[Backend]]). The Postgres password is shown only once at project creation — reset it from
Project Settings → Database if lost. The Supabase CLI is authenticated via a personal
access token (supabase.com/dashboard/account/tokens) — not stored anywhere persistent;
regenerate if `supabase login` needs to be redone.

## Supabase CLI cheat sheet

```
pnpm exec supabase migration list              # compare local vs. remote migration state
pnpm exec supabase migration new <name>         # scaffold a new migration file
pnpm exec supabase db push                      # apply pending migrations to the linked project
pnpm exec supabase gen types typescript --linked > types/database.ts   # regenerate types
pnpm exec supabase db query --linked "<sql>"    # run one-off SQL against the remote (careful — real data)
```

No Docker installed/needed for any of the above — they all talk to the hosted project
directly rather than spinning up a local Postgres.

## Known gotchas

- pnpm's build-script approval gate blocks `sharp`/`unrs-resolver` unless allowed via
  `allowBuilds` in `pnpm-workspace.yaml` (not the deprecated `pnpm` field in
  `package.json`).
- Next.js 16 renamed `middleware.ts` → `proxy.ts` (function renamed too); old convention
  still works but warns at build time. This repo uses `proxy.ts`.
- `zod@4.x` breaks type-checking against `@hookform/resolvers` — pinned to `zod@^3`. See
  [[Decisions/0004-zod-v3-pin]] before ever bumping zod.
- Avoid running `pnpm build` while `next dev` is up — both write to `.next/`, which can
  confuse the dev server. (Suspected, not confirmed, during the 2026-07-09 session; a
  restart is cheap insurance after any build.)
- base-ui `Button` with `render={<Link/>}` + `nativeButton={false}` renders an `<a>`
  with **`role="button"`** — Playwright must use `getByRole("button")`, not
  `getByRole("link")`, for link-styled buttons.
- Supabase clients throw if constructed without real env vars; `lib/supabase/middleware.ts`
  guards against this (no-ops when unset) so the app doesn't hard-crash pre-Supabase-setup
  — mostly moot now that real credentials exist, but explains that early-return branch if
  you're reading the code.

## Git state

Repo initialized, first commit intentionally left for the user to make (not auto-committed
during scaffolding). Check `git log`/`git status` for current reality rather than trusting
this note about commit history.
