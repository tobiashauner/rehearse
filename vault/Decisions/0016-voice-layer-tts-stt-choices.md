---
date: 2026-07-07
status: accepted
---

# 0016 — Voice layer: lazy cached TTS, thin STT wrapper over processAnswer, fake-mic verification

**Context**: the spoken half of roadmap #4, built on the seam
[[Decisions/0015-live-interview-text-mode-first]] prepared.

**TTS is generated lazily, per question, on first presentation** — `getQuestionAudio`
(in `sessions/[sessionId]/actions.ts`) synthesizes the audio the first time a question is
shown, stores it at `questions.tts_audio_path` (`interview-audio` bucket,
`{uid}/{sessionId}/questions/{qid}.mp3`), and returns a 1-hour signed URL; subsequent
requests just re-sign. Why not at question-generation time: adaptive follow-ups don't
exist yet then, sessions may never be started (paying for unheard audio), and lazy
generation adds only ~1–3s before the first playback. The interviewer personality shapes
delivery via the TTS `instructions` param (`PERSONALITY_TTS_STYLE` map), not different
voices. TTS failure is deliberately non-fatal — the question text is always on screen.

**STT is a thin wrapper, not a parallel pipeline** — `submitAudioAnswer` does upload →
transcribe → `processAnswer(transcript, {storagePath, durationSeconds})`, where
`processAnswer` is the persist/evaluate/follow-up/next core extracted from
`submitTextAnswer` (which now also delegates to it). Exactly what 0015 prescribed: STT
just produces the string typing would have. The recording is uploaded to storage
(`{uid}/{sessionId}/answers/{qid}-{ts}.{ext}`) *before* transcription, so an STT failure
never loses the user's audio; an empty transcript returns an error telling the user to
retry or type (no empty answer row is created).

**Upload path**: `FormData` straight into the server action per
[[Decisions/0006-formdata-file-upload-in-server-actions]], with
`experimental.serverActions.bodySizeLimit: "25mb"` in `next.config.ts` (default 1MB —
far too small for a few minutes of opus). Validation in `audioAnswerSchema`
(`lib/validations/session.ts`) is deliberately loose on MIME (`audio/*` or `video/*`)
because MediaRecorder containers vary by browser (webm Chrome/Firefox, mp4 Safari).

**Models** are env-overridable in `lib/openai/client.ts`: `OPENAI_TTS_MODEL`
(`gpt-4o-mini-tts`), `OPENAI_TTS_VOICE` (`alloy`), `OPENAI_STT_MODEL`
(`gpt-4o-mini-transcribe`). A per-user voice choice is the Settings tab's job later.

**Verification**: 0015 assumed audio couldn't be verified autonomously. It mostly can:
generate a spoken-answer WAV with OpenAI TTS and feed it to Chromium as a fake microphone
(`--use-file-for-fake-audio-capture`); the whole TTS → record → upload → STT → evaluate →
review-playback loop then runs headlessly and the transcript can be asserted against the
WAV's script. Recipe lives in `.claude/skills/verify/SKILL.md`. What still needs a human:
real mic/speaker quality, permission prompts on real devices, Safari's mp4 path.

**How to apply going forward**:
- Re-answer/versioning (spec's "Compare versions") should keep the
  answer-file-per-attempt naming (`-{ts}` suffix) and remember `is_current` flipping is
  the app's job (see [[Database-Schema]]).
- If TTS latency before the first question ever feels bad, pre-generate question 1's
  audio inside `startInterview` — don't move generation wholesale to session creation.
- Chromium's fake-capture WAV loops; transcripts in fake-mic tests repeat their opening
  words at the end. Expected artifact, not a bug.
