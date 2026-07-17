---
date: 2026-07-06
status: accepted
---

# 0009 — Adopted Impeccable for design work; PRODUCT.md/DESIGN.md now the design source of truth

**Decision**: installed the [Impeccable](https://impeccable.style) Claude Code skill
(`npx impeccable install`, project-scoped — `.claude/skills/impeccable/`) and ran its
`init` flow. This wrote two new root-level files that now govern all future design work:

- **`PRODUCT.md`** — strategic context (register: `product`; users: mixed
  anxious-cram / deliberate-practice job seekers; brand personality: calm, focused,
  competent, Headspace-adjacent warmth; anti-reference: cold/clinical testing software;
  accessibility: WCAG AA + calm-under-stress considerations).
- **`DESIGN.md`** + `.impeccable/design.json` sidecar — visual system: a composed
  "Golden Hour Briefing" palette (honey-amber `oklch(0.72 0.15 89)` primary, deep-petrol
  `oklch(0.28 0.09 200)` secondary/status, pure white background, soft ambient shadows
  replacing the current flat/ring-only elevation) plus typography/component rules.

Also configured `.impeccable/live/config.json` for this Next.js App Router project
(`app/layout.tsx`, `jsx` comment syntax) so `/impeccable live` works without a first-time
setup detour later. No CSP configured in this app, so nothing needed patching there.

**Why**: the app had zero committed brand identity — `app/globals.css` was still the
literal unmodified shadcn `neutral` base color (chroma 0 everywhere), which Impeccable's
own rules flag as a genuine "no design system yet" case, not a deliberate minimalist
choice. Per the skill's own setup step for brand-new projects, ran `palette.mjs` to get a
non-arbitrary brand seed color rather than picking one by feel, then composed the rest of
the palette around it per the tool's contrast/saturation rules (primary text-on-fill
rules, ink-vs-bg ≥7:1, etc.).

**Update (same day):** the palette has since been applied to `app/globals.css` and the
shared `components/ui/*` primitives (Card, Dialog, Select, DropdownMenu, Badge,
AppSidebar) — see the Changelog entry "Applied the DESIGN.md palette to the app". DESIGN.md
and the live app are now in sync for the light theme; `.dark` was left untouched since
dark mode has no `ThemeProvider` wired up yet and is unreachable.

**How to apply going forward**: any future design/UI work should read `PRODUCT.md` and
`DESIGN.md` first (Impeccable's own commands already enforce this via their setup steps).
If either file drifts from reality (e.g. the palette changes, or the product's target
users/tone shift), regenerate via `/impeccable document` (DESIGN.md) — don't hand-edit the
frontmatter/six-section structure directly without re-reading `reference/document.md`'s
format rules, since other DESIGN.md-aware tooling depends on the exact section headers and
token schema.
