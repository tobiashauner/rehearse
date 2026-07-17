---
date: 2026-07-06
status: partially superseded
---

> **2026-07-09:** the layout half of this note is superseded by
> [[0018-project-centric-ia-no-global-nav]] — the sidebar is gone and the shell is
> header-only. The `user_metadata` display-name half still stands.

# 0011 — Full-width header above the sidebar; display name via `user_metadata`, not a table

**Decision (layout)**: `app/(app)/layout.tsx` renders `AppHeader` (full viewport width)
above a row containing `AppSidebar` + `SidebarInset`, instead of the shadcn default
(sidebar spans the full height from `y=0`, with any header living inside the content
inset next to it). `SidebarProvider` gets `className="flex-col"` to stack header-then-row
instead of its default row layout. Because `Sidebar`'s desktop container is
`position: fixed; inset-y-0` (fixed to the *viewport*, not its flex parent), simply putting
a header above it in the DOM doesn't push it down — the fixed sidebar would render
starting at `y=0`, behind/through the header. `components/app-sidebar.tsx` overrides this
via `className="top-14 h-[calc(100svh-3.5rem)]"` passed to `<Sidebar>` (that className
merges directly onto the fixed `sidebar-container` div — confirmed by reading
`components/ui/sidebar.tsx`'s source, not assumed). `3.5rem` (`h-14`) is the header's
height; if that height ever changes, this offset must change with it — there's no shared
CSS variable linking them, just consistent hardcoding in both files.

**Decision (display name)**: a real name is now required at signup, stored in Supabase
auth's `user.user_metadata.full_name` (via `supabase.auth.signUp({ options: { data:
{ full_name } } })`) rather than a new `profiles` table. `lib/utils.ts`'s `getDisplayName()`
reads it with a fallback to the email's local part for any account that lacks it (accounts
created before this change, or via the admin API without metadata).

**Why**: the layout change was an explicit user request (conventional top-bar SaaS layout
instead of the sidebar-owns-everything shadcn default). The `user_metadata` choice (over a
`profiles` table) mirrors [[Decisions/0009-impeccable-design-system-adoption]]'s
proportionality principle — one text field doesn't need a new table, RLS policies, and a
migration when Supabase's auth system already has a place for exactly this.

**How to apply going forward**: if the app ever needs more profile data than a name
(avatar upload, preferences, etc.), that's the point to introduce a real `profiles` table —
don't keep stuffing structured data into `user_metadata`. If the header height changes,
grep both `app-header.tsx` (the `h-14` on the `<header>`) and `app-sidebar.tsx` (the
`top-14`/`calc(100svh-3.5rem)` on `<Sidebar>`) — they must stay in sync.

**Addendum (same day) — inset variant + a tailwind-merge gotcha**: `<Sidebar>` was
switched to `variant="inset"` so the header and sidebar read as one surface
(`SidebarProvider`'s built-in `has-data-[variant=inset]:bg-sidebar`) with the actual page
content floating as a separate rounded/shadowed card (`SidebarInset`'s built-in
`peer-data-[variant=inset]:` classes) — this is shadcn's designed-for-this-exact-look
variant, not a custom build. While wiring this up: **overriding a component's shadow via
an incoming `className` prop does not reliably work when the shadow is one of this
project's custom `@theme` tokens** (`shadow-resting`/`shadow-raised`) — `tailwind-merge`
doesn't recognize them as conflicting with Tailwind's built-in `shadow-sm` etc., so both
classes end up in the output and the built-in one silently wins. Confirmed via computed
`box-shadow` in a live browser check, not assumed from reading code. The fix that actually
works: edit the hardcoded class inside the component source directly (done for
`SidebarInset` in `components/ui/sidebar.tsx`) — same pattern already used for
`Dialog`/`Select`/`DropdownMenu`/`Card`. Treat this as a general rule for this codebase:
**never try to override a custom `shadow-*` token via a merged `className` prop — edit the
source.**
