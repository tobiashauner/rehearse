---
last-verified: 2026-07-03
---

# Auth Flow

## Route protection (single source of truth: the proxy)

`proxy.ts` runs on every request (matcher excludes static assets) → calls
`lib/supabase/middleware.ts`'s `updateSession(request)`:

1. If Supabase env vars aren't set, no-ops entirely (lets the app run before Supabase is
   configured — a scaffold-era fallback, harmless now that env vars are real).
2. Refreshes the session via `supabase.auth.getUser()`.
3. If no user and path isn't `/login` → redirect to `/login`.
4. If a user exists and path is `/login` → redirect to `/`.

`app/(app)/layout.tsx` also checks for a user and redirects to `/login` if somehow missing
— belt-and-suspenders, not the primary gate. Don't remove the proxy-level check and rely
on the layout alone; Server Component redirects happen later in the render than the proxy
does.

## Login page (`app/login/page.tsx`)

Single page, toggled between "Sign in" / "Create account" (no separate `/signup` route).
Client component: React Hook Form + Zod for validation, then calls a Server Action from
`app/login/actions.ts`. Sign-in uses `lib/validations/auth.ts`'s `authSchema` (email +
password min 8 chars); sign-up uses `signupSchema` (same, plus a required `name`) — the
`useForm` resolver is swapped by `mode` at render time (needs a `Resolver<SignupValues>`
type cast since RHF's resolver type doesn't unify two structurally-different zod schemas —
see [[Decisions/0011-header-above-sidebar-layout]]).

- `login(values)` → `supabase.auth.signInWithPassword`, `redirect('/')` on success, else
  returns `{ error }`.
- `signup(values)` → `supabase.auth.signUp({ email, password, options: { data: { full_name:
  name } } })` — the name is stored in Supabase auth's `user_metadata`, not a separate
  table (see [[Decisions/0011-header-above-sidebar-layout]]). If `data.session` comes back
  (email confirmation off), redirects immediately. If not, returns
  `{ needsConfirmation: true }` and the page shows a "check your email" message instead of
  the form. **As of 2026-07-07, email confirmation is ON in the hosted project** (signup
  takes the `needsConfirmation` path), and Supabase rejects `@example.com` addresses as
  invalid — for automated testing, create pre-confirmed users via the admin API instead
  (see `.claude/skills/verify/SKILL.md`).

Both actions use `lib/supabase/server.ts`'s `createClient()` (not the browser client) so
the session cookie is set correctly via the Server Action's cookie-writing capability.

`lib/utils.ts`'s `getDisplayName(user)` reads `user_metadata.full_name`, falling back to
the email's local part — use this anywhere a human-readable name is shown (currently just
`components/app-header.tsx`), never read `user_metadata.full_name` directly.

## Sign out

Inlined into `components/app-header.tsx`'s account dropdown (`Avatar` + `DropdownMenu`,
far right of the top bar) — client component, uses the **browser** Supabase client
(`lib/supabase/client.ts`) to call `auth.signOut()`, then `router.push('/login')` +
`router.refresh()`. There's no more standalone `sign-out-button.tsx` (deleted when the
account menu moved out of the sidebar into the header).

## What's not built

- Google / GitHub OAuth buttons on the login page (providers aren't even configured on the
  Supabase side yet — see [[Backend]]).
- Magic link UI (backend supports it, no button for it).
- Password reset flow.
