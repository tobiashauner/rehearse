---
last-verified: 2026-07-03
source: supabase/migrations/20260701040516_core_schema.sql
---

# Database Schema

Ground truth is `supabase/migrations/20260701040516_core_schema.sql` — this note is a
readable mirror. If they disagree, the migration file wins; update this note.

## Ownership model

Every table traces back to `projects.user_id` → `auth.users`. Nested tables don't
duplicate `user_id` — RLS policies use `exists` subqueries walking the FK chain instead:

```
projects (user_id)
 ├─ resources (project_id)
 ├─ ai_briefings (project_id)
 ├─ coaching_plans (project_id)
 └─ interview_sessions (project_id)
     └─ questions (session_id)
         └─ answers (question_id)
```

RLS is enabled on all 7 tables + `storage.objects`. Every policy is `for all` (select/
insert/update/delete together) with matching `using`/`with check` clauses.

## Enums

| Enum | Values |
|---|---|
| `project_status` | `active`, `archived` |
| `resource_type` | `resume`, `cover_letter`, `portfolio_pdf`, `job_description`, `linkedin_url`, `company_website`, `hiring_manager_linkedin`, `personal_notes`, `other_pdf` |
| `interview_type` | `behavioral`, `technical`, `product`, `leadership`, `panel`, `recruiter_screen`, `hiring_manager`, `executive` |
| `interview_difficulty` | `easy`, `medium`, `hard` |
| `interviewer_personality` | `friendly`, `direct`, `analytical`, `skeptical`, `fast_paced`, `interrupts_often`, `pushes_for_metrics`, `challenges_assumptions` |
| `conversation_mode` | `adaptive`, `fixed` |
| `session_status` | `configured`, `in_progress`, `completed`, `abandoned` |

## Tables

### `projects`
`id, user_id, title, company, role, status (project_status, default active), created_at, updated_at`
`updated_at` auto-updates via the `set_updated_at()` trigger on every `update`.

### `resources`
`id, project_id, type (resource_type), name, storage_path, url, content, created_at`
`content` holds extracted/pasted text (becomes searchable AI context). Wired up in
`app/(app)/projects/[projectId]/`: file types (resume/cover_letter/portfolio_pdf/
other_pdf) get `storage_path` set and upload to the `resources` bucket (10MB max,
PDF/DOCX/TXT only — enforced in `lib/validations/resource.ts` and surfaced as UI helper
text) — `content` is also populated automatically at upload time via
`lib/resources/extract-text.ts` (`unpdf` for PDF, `mammoth` for DOCX, direct read for TXT;
see [[Decisions/0014-pdf-text-extraction]]); `personal_notes` gets `content` set directly
(`content` required); URL types (linkedin_url/company_website/hiring_manager_linkedin) get
`url` set (required), plus an *optional* manually-pasted `content` (no automatic scraping
yet, so this is the interim way to get page/profile text into AI context). `job_description`
is its own "kind" — `url` and `content` are both optional but at least one is required, so
it can be added as either a link to the posting or pasted text (or both).

### `ai_briefings`
`id, project_id, content (jsonb), generated_at`
**Append-only.** Regenerating inserts a new row rather than updating in place — "current" =
`order by generated_at desc limit 1`. Any read code must query latest, never assume a
unique row per project. `content` holds the spec's 11 briefing sections (role summary,
required skills, resume strengths/gaps, likely questions, etc.) as one JSON blob, shaped by
`projectAnalysisSchema` in `lib/prompts/project-analysis.ts`. Wired up: the AI Briefing
tab's "Generate/Regenerate Briefing" button calls `generateProjectAnalysis` (`app/(app)/
projects/[projectId]/sessions/actions.ts`), which is a manual user-triggered action, not
automatic — see [[Decisions/0008-ai-briefing-required-before-interview-generation]].

### `coaching_plans`
`id, project_id, recommendations (jsonb), generated_at`
Same append-only/latest-row pattern as `ai_briefings`.

### `interview_sessions`
`id, project_id, status (session_status, default configured), interview_type, difficulty,
interviewer_personality, conversation_mode (default adaptive), length_minutes, started_at,
completed_at, duration_seconds, overall_score (numeric 4,1), summary (jsonb), created_at`
Config fields (`interview_type`, `difficulty`, etc.) are explicit typed columns, not jsonb —
deliberate, so Analytics can filter/aggregate by them later. Wired up via the Configure
Interview dialog (Interview Sessions tab) → `createInterviewSession` action, which inserts
the row and its generated `questions` in one call. The **live text-mode interview** then
drives the lifecycle (`sessions/[sessionId]/actions.ts`): `startInterview` flips
`configured`→`in_progress` + sets `started_at`; `completeInterview` sets `completed`,
`completed_at`, `duration_seconds`, `overall_score`, and the `summary` jsonb (shaped by
`sessionSummarySchema`). See [[Decisions/0015-live-interview-text-mode-first]].

### `questions`
`id, session_id, question, category, difficulty, order_index, asked_at, tts_audio_path, created_at`
Populated by `createInterviewSession` from `question-generation.ts`'s structured output —
`order_index` is the array position for originals. **Adaptive follow-ups** generated during
a live interview are inserted with `order_index >= 1000` (`FOLLOWUP_ORDER_BASE`) to
distinguish them from originals without a schema change and prevent chaining — see
[[Decisions/0015-live-interview-text-mode-first]]. `asked_at` is stamped when a question is
presented (used to order the transcript chronologically). `tts_audio_path` is populated
lazily by `getQuestionAudio` the first time a question is presented (generated TTS mp3 in
the `interview-audio` bucket) — see [[Decisions/0016-voice-layer-tts-stt-choices]].

### `answers`
`id, question_id, audio_storage_path, transcript, duration_seconds, score (numeric 4,1),
feedback (jsonb), follow_up_generated (bool), version (int, default 1), is_current (bool,
default true), created_at`
Written by the shared `processAnswer` core during the live interview (`submitTextAnswer`
and `submitAudioAnswer` both end there): `transcript` = the typed answer or the STT
transcription, `score` + `feedback` (jsonb, shaped by `answerEvaluationSchema`) from
per-answer evaluation, `follow_up_generated` set true when that answer spawned an adaptive
follow-up. Spoken answers also set `audio_storage_path` (recording in `interview-audio`,
uploaded *before* transcription so STT failure can't lose it) and `duration_seconds` —
see [[Decisions/0016-voice-layer-tts-stt-choices]]. `score` is pulled out of
`feedback` as its own column for easy aggregation. Supports "Re-answer" / "Compare versions"
from the spec: re-answering inserts a new row (`version + 1`); **the app is responsible for
flipping the previous row's `is_current` to false** — not enforced by a trigger, so any
future answer-insert code must handle it explicitly or `is_current` will be wrong. (The
current text-mode flow inserts one answer per question at `version` 1 / `is_current` true;
the re-answer UI isn't built yet.)

### `ai_usage_events` (migration `20260719152619_ai_usage_events.sql`)
`id, user_id (→ auth.users, cascade), kind (text check: briefing|questions|followup|
evaluation|summary|coaching|tts|stt), model, input_tokens, output_tokens,
cost_cents (numeric 12,6, check >= 0), created_at`
The AI spend ledger — one row per OpenAI call, cost computed at write time by
`lib/ai/usage.ts`. **Unlike every other table, RLS is NOT `for all`:** select-own +
insert-own only — no update/delete policies, so a user cannot reset their own spend.
The `>= 0` check blocks negative "refund" inserts. `user_id` is direct (not via
projects) because usage outlives any one project. Indexed `(user_id, created_at desc)`
for the monthly-sum budget check.

## Storage buckets

All private. RLS keys off path prefix, not a DB join:
`auth.uid()::text = (storage.foldername(name))[1]` — i.e. the first path segment of any
object must be the uploading user's UID, or the policy rejects read/write.

| Bucket | Purpose |
|---|---|
| `resources` | uploaded resumes/cover letters/portfolio/JD PDFs |
| `interview-audio` | user answer recordings + generated TTS question audio |
| `exports` | generated reports/exports (coaching report, session export) |

## Types

`types/database.ts` is generated from this schema (`supabase gen types typescript
--linked`) and used as the generic on every Supabase client (`createClient<Database>`).
Regenerate after every migration — see [[Backend]].
