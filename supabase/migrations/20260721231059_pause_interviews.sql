-- Explicit interview pause: a `paused` session status plus bookkeeping to
-- exclude paused time from the completed session's duration.
--
-- `paused_at` is set while a session sits paused; on resume the elapsed
-- pause folds into `paused_seconds` and `paused_at` clears. completeInterview
-- subtracts `paused_seconds` (and any still-open pause) from duration.

alter type public.session_status add value if not exists 'paused';

alter table public.interview_sessions
  add column if not exists paused_at timestamptz,
  add column if not exists paused_seconds integer not null default 0;
