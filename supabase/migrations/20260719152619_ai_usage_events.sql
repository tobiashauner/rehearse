-- AI usage ledger: one row per OpenAI call, with the computed cost at call
-- time. Powers the per-user monthly spend cap (lib/ai/usage.ts) and, later,
-- per-plan quotas (free/basic/max account types).

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (
    kind in (
      'briefing',
      'questions',
      'followup',
      'evaluation',
      'summary',
      'coaching',
      'tts',
      'stt'
    )
  ),
  model text not null,
  input_tokens integer,
  output_tokens integer,
  -- USD cents, computed against lib/ai/usage.ts's pricing table when the
  -- event is written. Never negative: rows are written with the caller's own
  -- authenticated client, and a negative insert would let a user "refund"
  -- their quota.
  cost_cents numeric(12, 6) not null check (cost_cents >= 0),
  created_at timestamptz not null default now()
);

-- The budget check sums a user's current calendar month on every AI action.
create index ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;

-- Deliberately NOT "for all": users may read their own usage (future usage
-- UI) and the server actions insert with the user's authenticated client,
-- but nobody updates or deletes ledger rows — a delete would reset the
-- author's own spend cap.
create policy "ai_usage_events_select_own"
  on public.ai_usage_events
  for select
  using (user_id = auth.uid());

create policy "ai_usage_events_insert_own"
  on public.ai_usage_events
  for insert
  with check (user_id = auth.uid());
