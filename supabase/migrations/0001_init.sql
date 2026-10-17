-- Minka schema for Supabase (not applied yet; the app currently stores data locally).
-- Mirrors src/lib/types.ts. Every row belongs to one user and is protected by RLS.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  lang text not null default 'ar' check (lang in ('ar', 'en')),
  theme text check (theme in ('light', 'dark')),
  week_start smallint not null default 6, -- 6 = Saturday (JS getDay)
  created_at timestamptz not null default now()
);

create table public.life_areas (
  id text not null,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  icon text not null,
  name jsonb not null,            -- { ar, en }
  vision jsonb not null default '{"ar":"","en":""}',
  rating_now smallint not null default 5 check (rating_now between 1 and 10),
  rating_before smallint not null default 5 check (rating_before between 1 and 10),
  sort smallint not null default 0,
  primary key (user_id, id)
);

create table public.area_ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  area_id text not null,
  rated_on date not null default current_date,
  score smallint not null check (score between 1 and 10)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  parent_id uuid references public.goals on delete cascade,
  area_id text not null,
  horizon text not null check (horizon in ('year', 'quarter', 'month')),
  title jsonb not null,
  why jsonb,
  start_on date not null default current_date,
  due_on date not null,
  metric_current numeric,
  metric_target numeric check (metric_target > 0),
  metric_unit jsonb,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  area_id text not null,
  goal_id uuid references public.goals on delete set null,
  name jsonb not null,
  icon text not null default 'circle-dot',
  slot text not null check (slot in ('fajr', 'morning', 'dhuhr', 'asr', 'maghrib', 'night', 'anytime')),
  kind text not null check (kind in ('check', 'count', 'duration')),
  target numeric,
  unit jsonb,
  days smallint[],               -- null = daily, else JS getDay values
  quit boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  habit_id uuid not null references public.habits on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  log_date date not null,
  value numeric not null default 0,
  primary key (habit_id, log_date)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  goal_id uuid references public.goals on delete cascade,
  area_id text,
  title jsonb not null,
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  area_id text not null,
  task_id uuid references public.tasks on delete cascade,
  title jsonb not null,
  weekdays smallint[],           -- recurring weekly block
  on_date date,                  -- or a one-off block
  start_hour numeric not null check (start_hour >= 0 and start_hour < 24),
  duration_hours numeric not null check (duration_hours > 0),
  check ((weekdays is null) <> (on_date is null))
);

create table public.reviews (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  week_start date not null,
  notes text[] not null default '{}',
  priorities uuid[] not null default '{}',
  ratings jsonb not null default '{}',
  primary key (user_id, week_start)
);

create index on public.goals (user_id, area_id);
create index on public.goals (parent_id);
create index on public.habits (user_id);
create index on public.habits (goal_id);
create index on public.habit_logs (user_id, log_date);
create index on public.tasks (user_id, due_on);
create index on public.tasks (goal_id);
create index on public.time_blocks (user_id, on_date);
create index on public.time_blocks (task_id);
create index on public.area_ratings (user_id, area_id, rated_on);

do $$
declare t text;
begin
  foreach t in array array['life_areas','area_ratings','goals','habits','habit_logs','tasks','time_blocks','reviews'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
