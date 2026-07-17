---
date: 2026-07-06
status: accepted
---

# 0014 — PDF/DOCX/TXT text extraction on upload; use `unpdf`, not `pdf-parse`

**Decision**: `uploadFileResource` (`app/(app)/projects/[projectId]/actions.ts`) now extracts
text at upload time via `lib/resources/extract-text.ts`'s `extractFileText(file)` and stores
it directly in `resources.content` — the same column `generateProjectAnalysis`
(`app/(app)/projects/[projectId]/sessions/actions.ts`) already reads to build the AI
Briefing prompt, so no changes were needed downstream. `.txt` is read directly;
`.docx` uses `mammoth.extractRawText`; `.pdf` uses **`unpdf`**, not `pdf-parse`. Extracted
text is capped at 50,000 characters. Both `unpdf` and `mammoth` are listed in
`next.config.ts`'s `serverExternalPackages` so Turbopack loads them as native Node
`require`s rather than bundling them.

**Why this was needed**: this was a known, already-documented gap (previous `Roadmap.md`
wording: "extracting content from uploaded files is still a follow-up"). File uploads only
ever set `storage_path`; `content` stayed `null` for every file resource, so the AI Briefing
prompt literally sent `"(no text content provided)"` for any uploaded resume — this is
exactly what a user reported seeing ("resume strengths and gaps cannot be determined").

**Why `unpdf` and not `pdf-parse`** (this is the non-obvious part): `pdf-parse` was tried
first, in two forms, and both failed **only inside this app's Next.js/Turbopack server
action runtime** — never in a standalone `node -e` script using the identical bytes and
identical library entry point:
1. `pdf-parse@2.4.5`'s `PDFParse` class → `Setting up fake worker failed` (this version
   vendors `pdfjs-dist` and expects a real worker file at runtime; Turbopack's dev bundling
   doesn't emit `pdf.worker.mjs` where `pdf-parse` looks for it).
2. `pdf-parse@1.1.1`'s classic `pdf(buffer)` API (importing `pdf-parse/lib/pdf-parse.js`
   directly, to dodge a separate known issue — see below) → `UnknownErrorException: Command
   token too long: 128` / `FormatError: Command token too long: 128`, thrown deep inside the
   vendored 2018-era `pdf.js` copy this package bundles. Confirmed via byte-for-byte hex
   dump logging that the buffer reaching `pdf-parse` inside the app was **identical** to the
   file on disk — so this was not a corrupted-read/race-condition bug (an earlier theory:
   running the Supabase Storage upload and text extraction concurrently via `Promise.all` on
   the same `File` was suspected of racing on its underlying stream; that was fixed to be
   sequential regardless, since concurrent reads of one `File` are worth avoiding on
   principle, but it did not fix this specific error). Adding `pdf-parse` to
   `serverExternalPackages` also did not fix it. Root cause was not pinned down further
   (likely some incompatibility between this ancient vendored `pdf.js` build and this
   project's Node 26 / Turbopack combination) — abandoned in favor of a library that just
   works.

`unpdf` (built on `pdf-parse`'s own upstream `pdf.js`, but packaged specifically for
serverless/edge/Node runtimes with the worker problem already solved) extracted the same
test PDF correctly both standalone and inside the app on the first try.

Also fixed in passing: `pdf-parse@1.x`'s package-root `index.js` runs a self-test against a
hardcoded fixture PDF (`./test/data/05-versions-space.pdf`) whenever `!module.parent` is
true — a check bundlers can trip, crashing at import time in production. Not relevant once
`unpdf` replaced `pdf-parse` entirely, but worth remembering if `pdf-parse` is ever
reintroduced: import `pdf-parse/lib/pdf-parse.js` directly, never the package root.

**How to apply going forward**: don't reach for `pdf-parse` in this codebase without
re-reading this note first — it has repeatedly failed silently/mysteriously in this exact
Next.js 16 + Turbopack + Node 26 stack for reasons that were never fully root-caused, even
though it works fine as a standalone script. `unpdf` is the proven-working choice here. If
PDF extraction ever needs more (page-level structure, images, tables), re-evaluate from
`unpdf`'s own feature set before going back to `pdf-parse`.
