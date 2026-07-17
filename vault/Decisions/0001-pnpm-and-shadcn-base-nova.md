---
date: 2026-06-30
status: accepted
---

# 0001 — pnpm + shadcn `base-nova` preset

**Decision**: use pnpm as the package manager (installed globally since it wasn't present);
initialize shadcn/ui non-interactively with `-d`/`--defaults`, which resolves to the
`base-nova` preset — `@base-ui/react` primitives, not Radix.

**Why**: pnpm was the user's explicit choice. shadcn's `-d` flag was used to avoid an
interactive prompt during scaffolding; `base-nova` is simply whatever that default
currently resolves to, not a deliberate Radix-vs-Base-UI choice.

**Consequence**: shadcn component internals (e.g. `Dialog`) use Base UI's API shape —
`render` props for polymorphism instead of Radix's `asChild`. See [[Frontend]] for the
pattern. If ever intentionally moving to Radix-based shadcn, every `components/ui/*` file
would need regenerating, not just a dependency swap.

**Gotcha hit along the way**: pnpm's build-script approval gate blocked `sharp`/
`unrs-resolver` postinstall scripts. Fixed via `allowBuilds: { sharp: true,
unrs-resolver: true }` in `pnpm-workspace.yaml` (the `pnpm` field in `package.json` is
deprecated in this pnpm version and gets silently ignored with a warning).
