---
date: 2026-07-06
status: accepted
---

# 0010 — `components/command-menu.tsx` must wrap cmdk content in `<Command>`, not just `<CommandDialog>`

**Decision**: any usage of the shadcn `command` component in this project must nest its
`CommandInput`/`CommandList`/`CommandGroup`/`CommandItem` inside a `<Command>` element,
even when it's already inside `<CommandDialog>`. See `components/command-menu.tsx` for the
correct structure.

**Why**: this project is on shadcn's `base-nova` style (`@base-ui/react` primitives, see
[[Decisions/0001-pnpm-and-shadcn-base-nova]]), but the `command` component is a thin
wrapper around the third-party `cmdk` package, which is base-ui/Radix-agnostic — `cmdk`'s
own `Command` root (not our `CommandDialog`) is what provides the internal store context
that `CommandInput`/`CommandList`/etc. read via `useSyncExternalStore`. Our
`components/ui/command.tsx`'s `CommandDialog` only supplies the outer dialog chrome (built
on our own base-ui `Dialog`); it does **not** wrap children in `<Command>` for you. Nesting
`CommandInput`/`CommandList` directly inside `CommandDialog` without an intermediate
`<Command>` throws `Cannot read properties of undefined (reading 'subscribe')` at render
time — caught during Playwright verification, not by typecheck (cmdk's types don't catch
the missing-provider case).

**How to apply going forward**: this is a general trap for any registry component (`cmdk`
here) that ships its own internal state/context independent of the base-ui vs. Radix
choice. When adding a new shadcn component that wraps a third-party primitive library,
read its actual source (not just assume the shadcn docs' minimal example composes the way
this project's `command.tsx` wrapper does) before wiring it into a feature.
