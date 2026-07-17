---
date: 2026-07-01
status: accepted
---

# 0003 — AI-generated content as append-only JSONB

**Decision**: `ai_briefings.content`, `coaching_plans.recommendations`,
`interview_sessions.summary`, and `answers.feedback` are all `jsonb` columns, not exploded
into individual typed columns. `ai_briefings` and `coaching_plans` are append-only —
regenerating inserts a new row; "current" is always `order by generated_at desc limit 1`.

**Why**: the spec defines many named sub-fields for these (briefing has ~10 sections,
answer feedback has ~15 scored dimensions) but none of them need to be individually
queried/filtered/indexed for the MVP — they're generated as a unit and displayed as a
unit. Exploding them into columns would mean a wide, brittle schema that has to change
every time the AI prompt's output shape changes. Append-only (vs. upsert-in-place) means
regenerating a briefing/coaching plan never loses the previous version and needs no
upsert-conflict logic.

**Exception**: `answers.score` and `interview_sessions.overall_score` ARE pulled out as
real numeric columns, specifically because Analytics needs to aggregate/chart these
across many rows — that's the dividing line: pull a field into its own column only when
something needs to query across rows by it, not just display it.

**How to apply going forward**: when adding a new AI-generated artifact, default to a
jsonb blob. Only add a dedicated column if a specific query (filter, sort, aggregate)
needs it. If reading "current" briefing/coaching-plan, always query latest by
`generated_at`, never assume uniqueness — see [[Database-Schema]].
