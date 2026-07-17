---
date: 2026-07-05
status: accepted
---

# 0007 — OpenAI calls use `chat.completions.parse` + `zodResponseFormat`, lazy client init

**Decision**: every prompt module (`lib/prompts/*.ts`) exports a Zod schema alongside its
message builder. Calling code (`app/(app)/projects/[projectId]/sessions/actions.ts`) uses
`openai.chat.completions.parse({ model, messages, response_format: zodResponseFormat(schema,
name) })` — from `openai/helpers/zod`, present in the installed `openai@6.45.0` and
compatible with the project's pinned `zod@^3` (see
[[Decisions/0004-zod-v3-pin]]) — and reads `completion.choices[0].message.parsed`, already
typed from the schema. No hand-written JSON schemas, no manual `JSON.parse` +
`schema.safeParse` on free-text model output.

The model is read from `lib/openai/client.ts`'s `OPENAI_MODEL` constant
(`process.env.OPENAI_MODEL || "gpt-5.4-mini"`) rather than hardcoded per call site, so it
can be swapped via `.env.local` without a code change. Originally defaulted to
`gpt-4o-mini`; swapped to `gpt-5.4-mini` on 2026-07-06 (`$0.75`/`$4.50` per 1M input/output
tokens) once `gpt-4o-mini` turned out to have dropped off OpenAI's current pricing page —
worth rechecking this default periodically as the model lineup keeps moving.

The `openai` client itself (`lib/openai/client.ts`) is a **lazy singleton**
(`getOpenAIClient()`), not a module-level `export const openai = new OpenAI(...)`. This
was a real bug caught during verification: `new OpenAI({apiKey: ""})` throws synchronously
when `OPENAI_API_KEY` is unset, which crashed every request touching the actions module —
including requests that should have short-circuited before ever needing the client (e.g.
"add a resource first" with zero resources). Lazy construction defers that throw to the
moment a call site actually needs the client, after its own precondition checks have run,
and the throw is caught inside a `try/catch` that returns a friendly `{error}` instead of a
500.

**Why**: structured outputs eliminate an entire class of "model didn't return valid JSON"
bugs, and reusing one pattern across `project-analysis.ts` and `question-generation.ts`
(and future `answer-evaluation.ts`, `follow-up-generation.ts`, `session-summary.ts`,
`coaching-plan.ts`) keeps every OpenAI call site shaped the same way.

**How to apply going forward**: any new prompt module should export its Zod result schema
and use this exact call shape. Always call `getOpenAIClient()`, never construct `new
OpenAI()` at module scope. Always wrap the `.parse()` call in `try/catch`, check
`message.refusal` before `message.parsed`, and log the caught error server-side
(`console.error`) rather than surfacing it raw to the client.
