# Interview Workspace — Knowledge Vault

This vault is the source of truth for the Interview Workspace app: what it's supposed to do,
what's actually been built, why key decisions were made, and how to get the dev environment
running. Claude reads this at the start of work on this project — keep it current.

## Start here

- **[[00-Product-Spec]]** — the original v1 MVP product specification. Everything else in
  this vault exists to track how the app maps to (or diverges from) this document.
- **[[Roadmap]]** — the spec's 8 MVP success criteria, checked off as they're built.
- **[[Changelog]]** — dated log of what's actually been done, session by session.

## Architecture

- **[[Overview]]** — tech stack, folder structure, high-level system shape.
- **[[Backend]]** — Supabase project, auth, storage, CLI workflow.
- **[[Database-Schema]]** — tables, enums, RLS policies, storage buckets (ground truth: the
  migration file, this is a human-readable mirror of it).
- **[[Frontend]]** — routing structure, route groups, data-fetching pattern, component
  conventions.
- **[[Auth-Flow]]** — how login/signup/route-protection actually works end to end.
- **`PRODUCT.md`** / **`DESIGN.md`** (project root, not in this vault) — strategic and
  visual design source of truth, written by the Impeccable skill's `init`/`document` flow.
  See [[Decisions/0009-impeccable-design-system-adoption|0009]].

## Decisions

Short ADR-style notes for choices that weren't obvious or that a future session might
otherwise second-guess or redo: [[Decisions/0001-pnpm-and-shadcn-base-nova|0001]],
[[Decisions/0002-server-actions-over-tanstack-query|0002]],
[[Decisions/0003-jsonb-append-only-for-ai-content|0003]],
[[Decisions/0004-zod-v3-pin|0004]], [[Decisions/0005-route-groups-for-auth-split|0005]],
[[Decisions/0006-formdata-file-upload-in-server-actions|0006]],
[[Decisions/0007-openai-structured-outputs-via-zod|0007]],
[[Decisions/0008-ai-briefing-required-before-interview-generation|0008]],
[[Decisions/0009-impeccable-design-system-adoption|0009]],
[[Decisions/0010-command-palette-needs-explicit-command-root|0010]],
[[Decisions/0011-header-above-sidebar-layout|0011]],
[[Decisions/0012-density-and-color-pass|0012]],
[[Decisions/0013-three-tier-surface-hierarchy|0013]],
[[Decisions/0014-pdf-text-extraction|0014]],
[[Decisions/0015-live-interview-text-mode-first|0015]],
[[Decisions/0016-voice-layer-tts-stt-choices|0016]],
[[Decisions/0017-adaptive-interviews-automatic-not-opt-in|0017]],
[[Decisions/0018-project-centric-ia-no-global-nav|0018]],
[[Decisions/0019-sectioned-project-page-no-tabs|0019]],
[[Decisions/0020-project-rail-and-summary-tiles|0020]].

## Environment

- **[[Environment]]** — how to run the app, Supabase CLI cheat sheet, where credentials
  live (never in this vault — see the note for why), known environment gotchas.

## Conventions for this vault

- New architectural decisions get a new numbered note in `Decisions/`, linked from Home.
- `Changelog.md` gets a new dated entry at the end of each work session that changes the app.
- `Roadmap.md` gets updated whenever a spec feature moves from not-started → in-progress → done.
- Never write secrets (API keys, passwords, tokens) into vault notes — this folder is
  git-tracked. Reference `.env.local` (gitignored) instead.
