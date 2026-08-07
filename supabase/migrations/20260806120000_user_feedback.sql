-- In-app user feedback: lightweight CSAT. One row per submission — a 1–5
-- satisfaction rating, an optional comment, and the page it was sent from.
-- Read by super-admins (via the service-role client, which bypasses RLS);
-- users only write their own.

create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  page_path text,
  created_at timestamptz not null default now()
);

-- Admin listing reads newest-first.
create index user_feedback_created_idx
  on public.user_feedback (created_at desc);

alter table public.user_feedback enable row level security;

-- Insert/select own only — no update/delete (feedback is an immutable record,
-- same posture as ai_usage_events). Super-admins read cross-user via the
-- service role, which bypasses RLS entirely.
create policy "user_feedback_select_own"
  on public.user_feedback
  for select
  using (user_id = auth.uid());

create policy "user_feedback_insert_own"
  on public.user_feedback
  for insert
  with check (user_id = auth.uid());
