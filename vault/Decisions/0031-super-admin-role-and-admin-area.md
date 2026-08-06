# 0031 — Super-admin role + admin area (usage report, enable/disable users)

**Date:** 2026-08-06
**Status:** accepted

## Context

Needed an owner-only admin capability: a first super-admin (just the owner initially),
who can (1) see an AI-spend usage report and (2) list users and enable/disable accounts.
The app had no roles, no admin surface, and no cross-user data access — every read is
RLS-scoped to `auth.uid()`.

## Decision

- **Role storage:** `auth.users.app_metadata.role = "super-admin"`. app_metadata is
  writable only by the service role and rides in the JWT, so it's the trustworthy place
  for an authz claim (unlike `user_metadata`, which the user can edit). **No schema
  migration and no new table** — the whole feature is code + a service-role client.
- **Service-role client** (`lib/supabase/admin.ts`), `server-only`, used only behind
  `requireSuperAdmin()`. It bypasses RLS and exposes `auth.admin` (list users, ban/unban).
  Powers the three cross-user needs: list users, enable/disable, and aggregate the
  ledger. Added the `server-only` npm package so mis-bundling it to the client is a build
  error.
- **Gate** (`lib/auth/admin.ts`): `isSuperAdmin(user)` + `requireSuperAdmin()` (redirects
  non-admins). Enforced in the admin **layout** AND re-checked in **every admin server
  action** — the layout gate doesn't protect action entry points.
- **"Disable account" = Supabase ban** (`ban_duration` ~100y to disable, `none` to
  enable). Blocks sign-in and invalidates sessions; **no data is deleted**. Guards: can't
  disable yourself, can't disable another super-admin (enforced server-side in the action,
  mirrored in the UI).
- **Usage report** aggregates the existing `ai_usage_events` ledger in memory (fine at
  current scale; move to a Postgres view/RPC if the ledger grows). Shows totals, spend by
  AI feature (`kind`), and spend per user (emails joined from the Admin API).
- **Surface:** `/admin` (usage), `/admin/adoption` (adoption/engagement — added 2026-08-06),
  and `/admin/users`, inside the `(app)` route group so they inherit the header/container.
  Entry point is an "Admin" item in the account dropdown, rendered only when `isSuperAdmin`
  (a boolean passed from the server layout — the header is a client component and never sees
  the role directly).
- **Auth is checked per page, not just the layout** (hardened 2026-08-06): every admin page
  calls `requireSuperAdmin()` itself, because Next.js layouts don't reliably re-run on all
  request paths and aren't a security boundary. Actions re-check independently too.
- **Bootstrap:** `scripts/grant-super-admin.mjs <email> [--revoke]` (service role). There
  is deliberately **no in-app grant/revoke UI** yet — "only me at the beginning."

## Consequences / follow-ups

- Granting the role to future admins is script-only for now; a grant/revoke control on the
  users table is an easy follow-up when a second admin is needed.
- The usage report reads the full ledger each load — revisit if it gets large.
- Banned users hitting the app mid-session: `updateSession`/`getUser` will fail and the
  proxy redirects them to `/login`, where sign-in is refused. No extra handling needed.
