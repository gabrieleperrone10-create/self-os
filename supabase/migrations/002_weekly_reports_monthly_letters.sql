-- Weekly Reports
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  checkin_count int not null default 0,
  avg_state_score numeric(4,2),
  top_patterns text[],
  decisions_count int not null default 0,
  vision_decisions int not null default 0,
  ai_report text not null,
  generated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table public.weekly_reports enable row level security;

create policy "Users manage own weekly_reports"
  on public.weekly_reports
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Monthly Letters
create table if not exists public.monthly_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month int not null,
  year int not null,
  ai_letter text not null,
  generated_at timestamptz not null default now(),
  unique(user_id, year, month)
);

alter table public.monthly_letters enable row level security;

create policy "Users manage own monthly_letters"
  on public.monthly_letters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
