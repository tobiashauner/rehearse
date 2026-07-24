-- Per-interview voice + playback speed. Previously the TTS voice was a single
-- env default (OPENAI_TTS_VOICE) for everyone; now each session picks its own,
-- alongside a playback rate applied to the interviewer audio in the runner.

alter table public.interview_sessions
  add column if not exists interviewer_voice text not null default 'alloy',
  add column if not exists playback_rate numeric(3, 2) not null default 1.0
    check (playback_rate between 0.5 and 2.0);
