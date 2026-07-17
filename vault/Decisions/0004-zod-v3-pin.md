---
date: 2026-07-01
status: accepted
---

# 0004 — Pin `zod` to v3, not the latest v4

**Decision**: `zod` is pinned to `^3` (currently resolves to 3.25.76) instead of the
latest 4.4.3.

**Why**: `zod@4.4.3` fails to type-check against `@hookform/resolvers@5.4.0`'s
`zodResolver` — a real upstream compatibility bug (an internal `_zod.version.minor`
literal-type mismatch in resolvers' TS defs), not anything in this codebase. Confirmed by
checking `@hookform/resolvers`'s published versions — 5.4.0 is latest, no fix available at
the time this was hit. zod v3's API is what `@hookform/resolvers` structurally expects
(`Zod3Type`), and everything used here (`z.object`, `.string().email()`, `.min()`,
`.optional()`) is v3-compatible.

**How to apply going forward**: don't bump `zod` to v4 without first checking whether
`@hookform/resolvers` has shipped a fix (check its latest version and changelog). If
`@hookform/resolvers` is ever dropped in favor of manual resolvers, this constraint goes
away and zod v4 becomes viable again.
