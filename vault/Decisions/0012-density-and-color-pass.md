---
date: 2026-07-06
status: accepted
---

# 0012 — Base density is `text-base`/`h-10`, not `text-sm`/`h-8`; always use the standard Tailwind scale

**Decision**: the shadcn defaults this project installed with (`Button`, `Input`, `Label`,
`Textarea`, `Select`, `Tabs`, `DropdownMenu`, `Card`, `Empty`, `Item`/`Sidebar` menu
buttons, `Dialog`) all shipped on a compact density scale — `text-sm` body text, `h-8`
control height, `p-2`/`gap-2` internal spacing. That scale is now bumped project-wide to
`text-base`/`h-10` with proportionally larger gaps/padding (see the component-by-component
diff in the corresponding [[Changelog]] entry). Page-level containers followed the same
logic: `space-y-6`→`space-y-8`, H1 `text-2xl`→`text-3xl`.

While doing this pass, found one arbitrary Tailwind value —
`text-[0.8rem]` on small buttons — that had drifted off the standard type scale entirely.
Fixed to `text-sm`.

**Why**: direct user feedback — "spacing is way too tight," "font is overall too small
(e.g. left nav)," plus an explicit instruction to "strictly leverage Tailwind
xs/sm/base/lg..." rather than arbitrary values. shadcn's installed defaults are tuned for
information-dense admin-style UIs; this product's own `DESIGN.md` north star ("Golden Hour
Briefing" — "considered, unhurried," "generous whitespace") calls for a roomier feel, so
the compact defaults were fighting the product's own design system, not just an
aesthetic preference.

**How to apply going forward**: when installing or touching any shadcn primitive in this
project, the default density is `text-base` body / `h-10` control height, not shadcn's
stock `text-sm`/`h-8` — don't silently accept an upstream shadcn update or a freshly
`npx shadcn add`'d component back down to the compact scale without re-applying this pass.
Never introduce an arbitrary value (`text-[0.8rem]`, `p-[13px]`, etc.) where a standard
Tailwind scale step is close enough — if the design genuinely needs an in-between value
often enough to matter, that's a signal to extend the `@theme` scale itself, not to sprinkle
arbitrary values at each call site.
