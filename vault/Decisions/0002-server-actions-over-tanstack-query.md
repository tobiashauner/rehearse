---
date: 2026-07-01
status: accepted
---

# 0002 — Server Components + Server Actions for Projects CRUD, not TanStack Query

**Decision**: Projects list/detail/create use plain async Server Components for reads and
`"use server"` Server Actions for writes. TanStack Query (installed per the spec) isn't
used for this slice.

**Why**: Next.js App Router's idiomatic pattern for straightforward CRUD is Server
Components + Server Actions — no client-side fetch/cache layer needed, and it's what
Supabase's own Next.js guidance recommends. TanStack Query earns its keep for
*client-side-interactive* data (polling, optimistic updates, complex client cache
invalidation) — the Interview Experience page (live timer, recording, streaming
transcript) is the more likely place to actually need it.

**How to apply going forward**: default new CRUD screens (Resources, Interview Sessions
list, Settings) to the same Server Component + Server Action pattern. Reach for TanStack
Query specifically when a screen has genuinely client-driven, frequently-changing state
that a full page re-render (via `redirect`/Server Component refetch) can't handle well.
Don't add TanStack Query to a screen just because it's in the stack — see [[Frontend]].
