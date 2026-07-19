---
last-verified: 2026-07-03
---

# Backend (Supabase)

## Project

- Project ref: `nrcmtbduoxcwplbaspex` (public identifier, not a secret — safe to reference
  here). Dashboard: supabase.com/dashboard/project/nrcmtbduoxcwplbaspex
- CLI is linked (`supabase link --project-ref nrcmtbduoxcwplbaspex`). No Docker installed —
  that's fine for `db push`/`migration list`/`gen types --linked`, which all talk to the
  hosted project directly. Docker would only be needed for `supabase start` (full local
  stack) or migration-diff caching, neither of which is in use.
- Credentials (URL, anon key, service role key) live in `.env.local` (gitignored). See
  [[Environment]] for how to get them again if lost — **never duplicated into this vault**.

## Auth

- Email/password is live (see [[Auth-Flow]]).
- Magic link: not built into the UI yet, but the Supabase project supports it by default
  (`enabled = true` in `supabase/config.toml`'s `[auth]` block covers email auth broadly).
- Google / GitHub OAuth: **not configured**. Needs OAuth app credentials created in Google
  Cloud Console / GitHub Developer Settings, then pasted into the Supabase dashboard under
  Authentication → Providers. Manual, one-time, dashboard-only — can't be done via
  migration or CLI. Flagged in [[Roadmap]].
- Email confirmation: using whatever the hosted project's default is (likely "on"). The
  signup server action handles both cases (see [[Auth-Flow]]).
- Auth URL config (2026-07-18): hosted `site_url` is `https://walkinrehearsed.com`
  (production domain on Vercel, project `hauner-labs/rehearse`); redirect allow-list also
  covers `www.` plus `localhost:3000` / `127.0.0.1:3000` for local dev. This is hosted
  project config, **not** `supabase/config.toml` (that file only drives a local stack) —
  it was set via the Management API (`PATCH /v1/projects/<ref>/config/auth`, authed with
  the Supabase CLI token from the macOS Keychain, service name "Supabase CLI"). Before
  this, `site_url` was the default `http://localhost:3000`, so confirmation/invite email
  links redirected to localhost. Emails sent **before** the change still carry the old
  `redirect_to` — re-send those invites. Note: no in-app set-password flow exists for
  invited users yet (see [[Auth-Flow]] "What's not built").

## AI spend cap

- Every OpenAI call (6 chat sites, TTS, STT) is metered into [[Database-Schema]]'s
  `ai_usage_events` and every AI-triggering server action first calls
  `checkAiBudget()` (`lib/ai/usage.ts`) against the caller's current-calendar-month
  spend. Limit: `AI_MONTHLY_LIMIT_CENTS` env (default 200 = $2/user/month). Account
  tiers (free/basic/max) later plug into `monthlyLimitCents()` — that's the only
  function that needs to become plan-aware.
- Pricing table lives in `lib/ai/usage.ts` (verified 2026-07-19: gpt-5.4-mini
  $0.75/$4.50 per 1M in/out; TTS ≈ $0.02/1K chars; STT ≈ $0.003/min). Unknown chat
  models fall back to deliberately HIGH prices so we never under-meter.
- Postures: budget check fails **open** (transient DB error must not brick the app;
  exposure bounded by one action), usage recording failures log but never break the
  action, and the end-of-session summary is metered but **not** gated (a session you
  were allowed to run always gets its debrief). Blocked actions return
  `AI_LIMIT_MESSAGE` through the existing `{ error }` channel.

## Database

See [[Database-Schema]] for the full table/enum/RLS reference. Summary: 7 tables, all
owned transitively by `auth.users` via `projects.user_id`, RLS everywhere.

## Storage

3 private buckets: `resources`, `interview-audio`, `exports`. RLS policies key off the
first path segment (`{user_id}/...`) — any upload code must put `auth.uid()` as the first
folder in the storage path or the policy rejects it. `resources` is now wired up (Resources
tab file uploads, path `{user_id}/{project_id}/{timestamp}-{filename}`) — see
[[Decisions/0006-formdata-file-upload-in-server-actions]]. `interview-audio` and `exports`
are still unused, pending interview session build-out.

## Migration workflow

```
pnpm exec supabase migration new <name>      # scaffold a new migration file
# ...edit the generated SQL file...
pnpm exec supabase db push                    # apply to the linked hosted project
pnpm exec supabase gen types typescript --linked > types/database.ts   # regenerate types
```

Always regenerate `types/database.ts` after a schema change — `lib/supabase/{client,server,
middleware}.ts` all use `createClient<Database>(...)`, so stale types silently stop
catching query mistakes.
