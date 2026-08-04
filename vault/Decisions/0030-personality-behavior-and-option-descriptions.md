# 0030 — Interviewer personality as real behavior + option descriptions in the config modal

**Date:** 2026-08-04
**Status:** accepted

## Context

The interview config exposes an **Interviewer Personality** (Friendly, Direct, … ,
Interrupts often, …). The user asked how "Interrupts often" actually works. It barely did:
the raw enum token (`interrupts_often`) was string-interpolated into the reasoning prompts
(`Interviewer style: interrupts_often`), and the only concrete effect was a TTS speaking-
style hint. Crucially the label **over-promised** — the runner is strictly turn-based
(answer → *then* decide a follow-up), so nothing ever interrupted the candidate, and the
LLM only saw a terse token it had to guess at. None of the 8 personalities meaningfully
shaped the interview. The config modal also gave the user no explanation of what any option
does.

## Decision

**A — make personality a real behavioral lever (no runner/architecture change):**

- New single source of truth `lib/interview-personality.ts` — `PERSONALITY_BEHAVIOR` maps
  each value to `{ prompt, tts, interruptive? }`: a natural-language behavior description
  for the reasoning LLM, a TTS speaking style, and an `interruptive` flag. Helpers
  `personalityPrompt()`, `personalityTts()`, `isInterruptive()`.
- All four reasoning prompts now inject `personalityPrompt(value)` (the rich description)
  instead of the bare enum: question-generation, follow-up-generation, answer-evaluation,
  session-summary. The TTS in the session `actions.ts` uses `personalityTts()` (the old
  inline `PERSONALITY_TTS_STYLE` map was deleted). So **every** personality now bites, not
  just this one.
- **"Interrupts often" is simulated within the turn-based flow** (`isInterruptive`): in
  `buildFollowUpGenerationMessages` the interruptive branch (a) lowers the follow-up bar —
  cut in whenever the answer rambles/hedges/stays vague, err toward asking — and (b) phrases
  the follow-up as a cut-in ("Let me stop you there —", "Hold on —", "Quick —"). We did
  **not** build true mid-answer barge-in (would need live audio monitoring + runner changes,
  and risks feeling broken). The label now reads honestly against actual behavior.

**Option descriptions in the config modal:**

- Added a `description` to each option in `PERSONALITY_OPTIONS`, `INTERVIEW_TYPE_OPTIONS`,
  `DIFFICULTY_OPTIONS`, `CONVERSATION_MODE_OPTIONS` (`lib/validations/session.ts`). Length /
  Voice / Playback keep self-describing labels (e.g. "Alloy — neutral, even") and stay in
  the tight 2-col row, so no separate description.
- Extended the shared `SelectItem` (`components/ui/select.tsx`) with an optional
  `description` prop — rendered as smaller muted text under the label, only when provided
  (the two existing call sites are untouched). The trigger still shows the label only
  (`SelectValue`'s render function), so the closed control is unchanged.

## Note

The user-facing `description` (short, second-person) and the LLM `prompt` (behavioral,
imperative) are intentionally separate strings for separate audiences — not duplicated.
