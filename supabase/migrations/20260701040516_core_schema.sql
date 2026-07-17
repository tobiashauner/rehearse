-- Core schema for Interview Workspace: projects, resources, AI briefings,
-- coaching plans, interview sessions, questions, answers.
-- All tables are owned transitively by auth.users via projects.user_id,
-- with RLS policies walking up the FK chain to check ownership.

-- ### Enums ###################################################################

create type project_status as enum ('active', 'archived');

create type resource_type as enum (
  'resume',
  'cover_letter',
  'portfolio_pdf',
  'job_description',
  'linkedin_url',
  'company_website',
  'hiring_manager_linkedin',
  'personal_notes',
  'other_pdf'
);

create type interview_type as enum (
  'behavioral',
  'technical',
  'product',
  'leadership',
  'panel',
  'recruiter_screen',
  'hiring_manager',
  'executive'
);

create type interview_difficulty as enum ('easy', 'medium', 'hard');

create type interviewer_personality as enum (
  'friendly',
  'direct',
  'analytical',
  'skeptical',
  'fast_paced',
  'interrupts_often',
  'pushes_for_metrics',
  'challenges_assumptions'
);

create type conversation_mode as enum ('adaptive', 'fixed');

create type session_status as enum ('configured', 'in_progress', 'completed', 'abandoned');

-- ### updated_at trigger helper ###############################################

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ### Tables ###################################################################

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  company text,
  role text,
  status project_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on projects (user_id);

create trigger projects_set_updated_at
  before update on projects
  for each row
  execute function set_updated_at();

create table resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  type resource_type not null,
  name text,
  storage_path text,
  url text,
  content text,
  created_at timestamptz not null default now()
);

create index resources_project_id_idx on resources (project_id);

create table ai_briefings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  content jsonb not null,
  generated_at timestamptz not null default now()
);

create index ai_briefings_project_id_generated_at_idx
  on ai_briefings (project_id, generated_at desc);

create table coaching_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  recommendations jsonb not null,
  generated_at timestamptz not null default now()
);

create index coaching_plans_project_id_generated_at_idx
  on coaching_plans (project_id, generated_at desc);

create table interview_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  status session_status not null default 'configured',
  interview_type interview_type not null,
  difficulty interview_difficulty not null,
  interviewer_personality interviewer_personality not null,
  conversation_mode conversation_mode not null default 'adaptive',
  length_minutes integer not null,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer,
  overall_score numeric(4, 1),
  summary jsonb,
  created_at timestamptz not null default now()
);

create index interview_sessions_project_id_idx on interview_sessions (project_id);

create table questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  question text not null,
  category text,
  difficulty interview_difficulty,
  order_index integer not null,
  asked_at timestamptz,
  tts_audio_path text,
  created_at timestamptz not null default now()
);

create index questions_session_id_idx on questions (session_id);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  audio_storage_path text,
  transcript text,
  duration_seconds integer,
  score numeric(4, 1),
  feedback jsonb,
  follow_up_generated boolean not null default false,
  version integer not null default 1,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index answers_question_id_idx on answers (question_id);

-- ### Row Level Security #######################################################

alter table projects enable row level security;
alter table resources enable row level security;
alter table ai_briefings enable row level security;
alter table coaching_plans enable row level security;
alter table interview_sessions enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

create policy "Users manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage resources on their own projects"
  on resources for all
  using (exists (
    select 1 from projects
    where projects.id = resources.project_id
      and projects.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from projects
    where projects.id = resources.project_id
      and projects.user_id = auth.uid()
  ));

create policy "Users manage AI briefings on their own projects"
  on ai_briefings for all
  using (exists (
    select 1 from projects
    where projects.id = ai_briefings.project_id
      and projects.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from projects
    where projects.id = ai_briefings.project_id
      and projects.user_id = auth.uid()
  ));

create policy "Users manage coaching plans on their own projects"
  on coaching_plans for all
  using (exists (
    select 1 from projects
    where projects.id = coaching_plans.project_id
      and projects.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from projects
    where projects.id = coaching_plans.project_id
      and projects.user_id = auth.uid()
  ));

create policy "Users manage interview sessions on their own projects"
  on interview_sessions for all
  using (exists (
    select 1 from projects
    where projects.id = interview_sessions.project_id
      and projects.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from projects
    where projects.id = interview_sessions.project_id
      and projects.user_id = auth.uid()
  ));

create policy "Users manage questions on their own sessions"
  on questions for all
  using (exists (
    select 1 from interview_sessions
    join projects on projects.id = interview_sessions.project_id
    where interview_sessions.id = questions.session_id
      and projects.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from interview_sessions
    join projects on projects.id = interview_sessions.project_id
    where interview_sessions.id = questions.session_id
      and projects.user_id = auth.uid()
  ));

create policy "Users manage answers on their own questions"
  on answers for all
  using (exists (
    select 1 from questions
    join interview_sessions on interview_sessions.id = questions.session_id
    join projects on projects.id = interview_sessions.project_id
    where questions.id = answers.question_id
      and projects.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from questions
    join interview_sessions on interview_sessions.id = questions.session_id
    join projects on projects.id = interview_sessions.project_id
    where questions.id = answers.question_id
      and projects.user_id = auth.uid()
  ));

-- ### Storage buckets ###########################################################

insert into storage.buckets (id, name, public)
values
  ('resources', 'resources', false),
  ('interview-audio', 'interview-audio', false),
  ('exports', 'exports', false);

create policy "Users manage their own files in resources"
  on storage.objects for all
  using (
    bucket_id = 'resources'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'resources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users manage their own files in interview-audio"
  on storage.objects for all
  using (
    bucket_id = 'interview-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'interview-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users manage their own files in exports"
  on storage.objects for all
  using (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
