---
date: 2026-07-05
status: accepted
---

# 0008 — AI Briefing is manually triggered and required before generating an interview

**Decision**: `ai_briefings` rows are only ever created by an explicit user action — the
"Generate Briefing" / "Regenerate Briefing" button on the AI Briefing tab
(`components/interview/generate-briefing-button.tsx` →
`generateProjectAnalysis` in `app/(app)/projects/[projectId]/sessions/actions.ts`). Nothing
generates one automatically (e.g. on resource upload). `createInterviewSession` requires a
briefing to already exist — it fetches the latest `ai_briefings` row
(`order by generated_at desc limit 1`, per the append-only pattern in
[[Decisions/0003-jsonb-append-only-for-ai-content]]) and returns `{error: "Generate an AI
Briefing first."}` if none does. The Configure Interview dialog's trigger button is
disabled with explanatory helper text until a briefing exists, so the failure mode is
visible before the user opens the dialog, not just as a submit-time error.
`question-generation.ts`'s prompt consumes the briefing's structured analysis rather than
raw resource text directly — richer grounding for the generated questions than resumes/JD
text alone.

**Why**: the spec describes the AI Briefing as "generated automatically," but there's no
background job infrastructure in this app (no queue, no webhook, no cron) — the only
trigger points available are user actions. A hidden OpenAI call fired on every resource
add/edit would be unpredictable in cost and timing (e.g. pasting a job description twice
while editing shouldn't silently fire two paid model calls). An explicit button is
predictable, and reusing the latest briefing across every interview generated for a
project avoids re-analyzing the same resume/JD on every "New Interview" click.

**How to apply going forward**: if background/automatic generation is ever added (e.g. a
queue), this note should be updated or superseded — until then, treat "briefing exists" as
a manual-action gate, not an automatic side effect of resource changes.
