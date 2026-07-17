---
date: 2026-07-06
status: accepted
---

# 0013 — Three-tier neutral surface hierarchy (sidebar darker than page, page darker than cards)

**Decision**: replaced the original two-tone neutral scheme (pure-white page background
everywhere, warm-paper reserved for cards) with three distinct tiers, darkest to lightest:

- `--sidebar` (and header, via the `inset` variant's shared `bg-sidebar`):
  `oklch(0.93 0.012 91)` — darkest, the app-shell plane.
- `--background` (the content pane behind cards): `oklch(0.985 0.007 91)` — a barely-there
  warm tint, no longer pure white.
- `--card` / `--popover`: unchanged, `oklch(1 0 0)` pure white — now the lightest tier.

`--sidebar-accent` (hover/active wash, `oklch(0.87 0.05 89)`) and `--sidebar-border`
(`oklch(0.87 0.012 91)`) were darkened in step so they still read as visibly distinct from
the new darker `--sidebar` base.

**Why**: direct user feedback — the left nav and content pane read as the same flat white,
with nothing to visually separate the app shell from the page it frames. This directly
reverses `DESIGN.md`'s original Neutral-color rule ("pure white for the base background;
never a tinted surface... that's the saturated AI default"), which was written before this
feedback and assumed a flat two-tone scheme. `DESIGN.md` §2 and §6 were rewritten to
describe the three-tier hierarchy rather than silently left contradicting the live app —
if you're reading `DESIGN.md` from an old cache or diff, trust the version with "three
tiers," not "pure white base."

**How to apply going forward**: when adding any new top-level surface (a future modal
backdrop, a secondary panel, etc.), place it deliberately within this three-step ladder
rather than reaching for pure white or introducing a fourth ad-hoc tint — `--sidebar` <
`--background` < `--card`/`--popover`. If the app ever needs a fourth genuinely distinct
plane, that's the point to extend the ladder explicitly here, not to eyeball a value.
