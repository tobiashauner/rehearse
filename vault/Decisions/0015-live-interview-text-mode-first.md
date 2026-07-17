---
date: 2026-07-07
status: accepted
---

# 0015 — Live interview: text mode first, audio as a later I/O layer; follow-ups via order_index convention

**Decision (scope)**: Roadmap #4 ("complete a spoken interview") was split. The *conversational
and scoring* half was built and shipped as a **text-mode** interview — the candidate types
each answer, gets a scored evaluation, adaptive follow-ups, and an end-of-session review.
The *spoken* half (TTS question audio, `MediaRecorder` mic capture, STT transcription, the
polished two-panel live UI with audio visualization) was deliberately deferred to a separate
slice.

**Why the split**: (1) Everything valuable about the feature — grounded per-answer feedback,
adaptive follow-ups, overall scoring — is independent of *how* the answer text arrives. STT
just produces the same `transcript` string that typing does, so audio is an input/output
layer bolted onto the already-working `submitTextAnswer` flow, not a rewrite. (2) Audio UX
genuinely can't be verified by this project's autonomous verification method (headless
Playwright) — there's no real microphone or speaker, and no way to "listen" to whether TTS
sounds right or the mic captured cleanly. Building it autonomously would ship an unverified
feature. Text mode is 100% verifiable end-to-end, so it was the right thing to finish and
stand behind first. When audio is built, the mic/speaker UX will need hands-on human testing.

**Decision (adaptive follow-ups without a schema change)**: A follow-up is a new `questions`
row. Rather than add a `parent_question_id` column (migration + type regen + live DDL),
follow-ups are inserted with **`order_index >= 1000`** (`FOLLOWUP_ORDER_BASE`), which:
- distinguishes them from the pre-generated originals (`order_index` 0..N-1) with no schema
  change, and
- guarantees follow-ups never chain — the code only ever generates a follow-up off an
  *original* (`order_index < 1000`), so a follow-up can't spawn another. This caps follow-ups
  at one per original.

`resolveNextQuestion` presents any unanswered follow-up before unanswered originals, so a
follow-up is always asked immediately after its parent. `asked_at` is stamped when a question
is actually presented; the review/transcript orders by `asked_at` (chronological), which
naturally interleaves each follow-up right after its parent regardless of `order_index`.

**How to apply going forward**:
- The `1000` convention is load-bearing and duplicated in three files
  (`sessions/[sessionId]/actions.ts`, `sessions/[sessionId]/page.tsx`, and implicitly the
  review page's transcript sort). If follow-ups ever need richer structure (nesting, grouping
  a follow-up visibly under its parent, multiple follow-ups per question), that's the point
  to introduce a real `parent_question_id` column — don't pile more meaning onto `order_index`.
- When building the audio layer: keep `submitTextAnswer` as the core; STT should call the
  same evaluation/follow-up path with the transcribed text. Don't fork a parallel
  "submitAudioAnswer" that reimplements evaluation. `answers.audio_storage_path` and
  `questions.tts_audio_path` columns already exist for the recordings.
- Scoring convention across the feature is **0-100** for both per-answer `score` and session
  `overall_score` (numeric(4,1) holds it). Keep it consistent if extending.
