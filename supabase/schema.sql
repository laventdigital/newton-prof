-- ============================================================
-- Profitest Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. Profiles
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text,
  grade integer not null default 9,
  city text,
  school text,
  role text not null default 'student' check (role in ('student', 'admin', 'manager')),
  created_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);

alter table public.profiles enable row level security;

-- Students can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins and managers can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Allow insert on signup (via trigger or client)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- 2. Specialties (reference table)
-- ============================================================
create table public.specialties (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name_kk text not null,
  name_ru text not null,
  name_en text,
  cluster text,
  riasec_code text,
  description text,
  created_at timestamptz not null default now()
);

create index idx_specialties_code on public.specialties (code);
create index idx_specialties_cluster on public.specialties (cluster);

alter table public.specialties enable row level security;

-- Specialties are read-only for all authenticated users
create policy "Authenticated users can read specialties"
  on public.specialties for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- 3. Test Results
-- ============================================================
create table public.test_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles (id) on delete cascade not null,
  riasec integer[] not null default '{}',
  abilities integer[] not null default '{}',
  "values" integer[] not null default '{}',
  location text,
  grant_pref text,
  report_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_test_results_user on public.test_results (user_id);
create index idx_test_results_created on public.test_results (created_at desc);

alter table public.test_results enable row level security;

-- Students can view their own results
create policy "Users can view own results"
  on public.test_results for select
  using (auth.uid() = user_id);

-- Students can insert their own results
create policy "Users can insert own results"
  on public.test_results for insert
  with check (auth.uid() = user_id);

-- Admins and managers can view all results
create policy "Admins can view all results"
  on public.test_results for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- ============================================================
-- 4. Test Answers
-- ============================================================
create table public.test_answers (
  id uuid primary key default uuid_generate_v4(),
  result_id uuid references public.test_results (id) on delete cascade not null,
  question_id text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create index idx_test_answers_result on public.test_answers (result_id);

alter table public.test_answers enable row level security;

-- Students can view their own answers (via result ownership)
create policy "Users can view own answers"
  on public.test_answers for select
  using (
    exists (
      select 1 from public.test_results
      where test_results.id = test_answers.result_id
        and test_results.user_id = auth.uid()
    )
  );

-- Students can insert answers for their own results
create policy "Users can insert own answers"
  on public.test_answers for insert
  with check (
    exists (
      select 1 from public.test_results
      where test_results.id = test_answers.result_id
        and test_results.user_id = auth.uid()
    )
  );

-- Admins and managers can view all answers
create policy "Admins can view all answers"
  on public.test_answers for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- ============================================================
-- 5. Auto-create profile on signup (optional trigger)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'student');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
