-- Coaching Platform V1 - Supabase schema
-- Copier-coller ce fichier dans Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('admin', 'coach', 'coachee');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_type as enum ('text', 'video', 'external_link', 'document', 'quiz');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

alter type public.content_status add value if not exists 'draft';
alter type public.content_status add value if not exists 'published';

do $$
begin
  create type public.assignment_type as enum ('content', 'quiz', 'content_quiz', 'path');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.assignment_status as enum ('assigned', 'in_progress', 'completed', 'late');
exception
  when duplicate_object then null;
end $$;

alter type public.assignment_status add value if not exists 'assigned';
alter type public.assignment_status add value if not exists 'in_progress';
alter type public.assignment_status add value if not exists 'completed';
alter type public.assignment_status add value if not exists 'late';

do $$
begin
  create type public.priority_level as enum ('normal', 'high');
exception
  when duplicate_object then null;
end $$;

alter type public.priority_level add value if not exists 'normal';
alter type public.priority_level add value if not exists 'high';

do $$
begin
  create type public.question_type as enum ('single_choice', 'multiple_choice', 'open');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_attempt_status as enum ('passed', 'failed', 'pending_correction');
exception
  when duplicate_object then null;
end $$;

alter type public.quiz_attempt_status add value if not exists 'passed';
alter type public.quiz_attempt_status add value if not exists 'failed';
alter type public.quiz_attempt_status add value if not exists 'pending_correction';

do $$
begin
  create type public.calendar_event_type as enum ('individual_coaching', 'collective_workshop', 'reminder', 'info_meeting');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.calendar_event_status as enum ('scheduled', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transactional_email_type as enum (
    'invitation',
    'password_reset',
    'path_reminder',
    'quiz_correction',
    'message_received',
    'calendar_event',
    'calendar_event_reminder'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.transactional_email_type add value if not exists 'invitation';
alter type public.transactional_email_type add value if not exists 'password_reset';
alter type public.transactional_email_type add value if not exists 'path_reminder';
alter type public.transactional_email_type add value if not exists 'quiz_correction';
alter type public.transactional_email_type add value if not exists 'message_received';
alter type public.transactional_email_type add value if not exists 'calendar_event';
alter type public.transactional_email_type add value if not exists 'calendar_event_reminder';

do $$
begin
  create type public.email_delivery_status as enum ('skipped', 'sent', 'failed');
exception
  when duplicate_object then null;
end $$;

alter type public.email_delivery_status add value if not exists 'skipped';
alter type public.email_delivery_status add value if not exists 'sent';
alter type public.email_delivery_status add value if not exists 'failed';

drop function if exists public.is_admin() cascade;
drop function if exists public.is_coach() cascade;
drop function if exists public.jwt_role() cascade;
drop function if exists public."current_role"() cascade;

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'admin';
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'coach';
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'coachee',
  avatar_url text,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists full_name text,
  add column if not exists role public.user_role,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now();

update public.profiles
set full_name = 'Utilisateur'
where full_name is null
  or full_name = '';

alter table public.profiles
  alter column full_name set not null;

do $$
declare
  trigger_name text;
begin
  for trigger_name in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace pn on pn.oid = p.pronamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and pn.nspname = 'public'
      and p.proname in (
        'create_profile_for_user',
        'handle_auth_user_profile',
        'handle_new_user',
        'sync_profile_from_auth'
      )
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', trigger_name);
  end loop;
end $$;

drop trigger if exists auth_users_sync_profile on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists users_sync_profile on auth.users;
drop trigger if exists sync_profile_on_auth_user on auth.users;
drop trigger if exists create_profile_on_signup on auth.users;
drop function if exists public.handle_auth_user_profile() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.create_profile_for_user() cascade;
drop function if exists public.sync_profile_from_auth() cascade;

do $$
declare
  trigger_name text;
begin
  for trigger_name in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and p.proname = 'protect_profile_fields'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on public.profiles', trigger_name);
  end loop;
end $$;

drop function if exists public.protect_profile_fields() cascade;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
      and udt_name <> 'user_role'
  ) then
    alter table public.profiles
      alter column role drop default,
      alter column role type public.user_role
        using (
          case role::text
            when 'admin' then 'admin'
            when 'coach' then 'coach'
            when 'coachee' then 'coachee'
            else 'coachee'
          end
        )::public.user_role,
      alter column role set default 'coachee'::public.user_role;
  end if;
end $$;

update public.profiles
set role = 'coachee'::public.user_role
where role is null;

alter table public.profiles
  alter column role set default 'coachee'::public.user_role,
  alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_schema = tc.constraint_schema
      and kcu.constraint_name = tc.constraint_name
      and kcu.table_schema = tc.table_schema
      and kcu.table_name = tc.table_name
    where tc.constraint_schema = 'public'
      and tc.table_name = 'profiles'
      and tc.constraint_type in ('UNIQUE', 'PRIMARY KEY')
      and kcu.column_name = 'user_id'
      and not exists (
        select 1
        from information_schema.key_column_usage other_kcu
        where other_kcu.constraint_schema = tc.constraint_schema
          and other_kcu.constraint_name = tc.constraint_name
          and other_kcu.table_schema = tc.table_schema
          and other_kcu.table_name = tc.table_name
          and other_kcu.column_name <> 'user_id'
      )
  ) then
    alter table public.profiles
      add constraint profiles_user_id_unique unique (user_id);
  end if;
end $$;

alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

update public.profiles
set notification_preferences = '{}'::jsonb
where notification_preferences is null
  or jsonb_typeof(notification_preferences) <> 'object';

alter table public.profiles
  drop constraint if exists profiles_notification_preferences_object_check;

alter table public.profiles
  add constraint profiles_notification_preferences_object_check
  check (jsonb_typeof(notification_preferences) = 'object');

create or replace function public.resolve_user_role(
  app_meta jsonb,
  user_meta jsonb
)
returns public.user_role
language sql
immutable
as $$
  with metadata as (
    select
      coalesce(app_meta, '{}'::jsonb) as safe_app_meta,
      coalesce(user_meta, '{}'::jsonb) as safe_user_meta
  )
  select case
    when safe_app_meta ->> 'role' in ('admin', 'coach', 'coachee')
      then (safe_app_meta ->> 'role')::public.user_role
    when safe_user_meta ->> 'role' in ('admin', 'coach', 'coachee')
      then (safe_user_meta ->> 'role')::public.user_role
    else 'coachee'::public.user_role
  end
  from metadata;
$$;

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_app_meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  safe_user_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    user_id,
    full_name,
    role,
    avatar_url,
    notification_preferences
  )
  values (
    new.id,
    coalesce(
      nullif(safe_user_meta ->> 'full_name', ''),
      nullif(safe_user_meta ->> 'name', ''),
      nullif(new.email, ''),
      'Utilisateur'
    ),
    public.resolve_user_role(safe_app_meta, safe_user_meta),
    nullif(safe_user_meta ->> 'avatar_url', ''),
    '{}'::jsonb
  )
  on conflict (user_id) do update
  set
    full_name = excluded.full_name,
    role = excluded.role,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    notification_preferences = coalesce(
      public.profiles.notification_preferences,
      '{}'::jsonb
    );

  return new;
end;
$$;

drop trigger if exists auth_users_sync_profile on auth.users;
create trigger auth_users_sync_profile
after insert or update of email, raw_app_meta_data, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_profile();

insert into public.profiles (
  user_id,
  full_name,
  role,
  avatar_url,
  notification_preferences
)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(u.email, ''),
    'Utilisateur'
  ),
  public.resolve_user_role(u.raw_app_meta_data, u.raw_user_meta_data),
  nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
  '{}'::jsonb
from auth.users u
on conflict (user_id) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  notification_preferences = coalesce(
    public.profiles.notification_preferences,
    '{}'::jsonb
  );

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  coach_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cohort_id, user_id)
);

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.subthemes (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type public.content_type not null default 'text',
  body text,
  video_url text,
  external_url text,
  file_url text,
  theme_id uuid references public.themes(id) on delete set null,
  subtheme_id uuid references public.subthemes(id) on delete set null,
  status public.content_status not null default 'draft',
  tags text[] not null default '{}',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content_id uuid references public.contents(id) on delete set null,
  passing_score numeric(5,2) not null default 70 check (passing_score >= 0 and passing_score <= 100),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type public.question_type not null,
  points numeric(8,2) not null default 1 check (points >= 0),
  position integer not null default 1,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position integer not null default 1
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignment_type public.assignment_type not null,
  content_id uuid references public.contents(id) on delete set null,
  quiz_id uuid references public.quizzes(id) on delete set null,
  assigned_to_user_id uuid references auth.users(id) on delete cascade,
  assigned_to_cohort_id uuid references public.cohorts(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  deadline timestamptz not null,
  priority public.priority_level not null default 'normal',
  status public.assignment_status not null default 'assigned',
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_target_check check (
    ((assigned_to_user_id is not null)::int + (assigned_to_cohort_id is not null)::int) = 1
  ),
  constraint assignments_payload_check check (
    content_id is not null or quiz_id is not null
  )
);

create table if not exists public.assignment_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.assignment_status not null default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, user_id)
);

create table if not exists public.content_progress (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  status public.assignment_status not null default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (content_id, user_id, assignment_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score_obtained numeric(8,2) not null default 0,
  score_max numeric(8,2) not null default 0,
  percentage numeric(5,2) not null default 0,
  status public.quiz_attempt_status not null default 'pending_correction',
  passed boolean not null default false,
  submitted_at timestamptz,
  corrected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_text text,
  selected_option_ids uuid[] not null default '{}',
  points_obtained numeric(8,2) not null default 0,
  is_correct boolean,
  needs_manual_correction boolean not null default false,
  coach_feedback text,
  corrected_by uuid references auth.users(id) on delete set null,
  corrected_at timestamptz,
  unique (attempt_id, question_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  type public.calendar_event_type not null,
  coach_id uuid not null references auth.users(id) on delete cascade,
  coachee_id uuid references auth.users(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete cascade,
  status public.calendar_event_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  constraint calendar_time_check check (end_time > start_time)
);

create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  coachee_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  email_type public.transactional_email_type not null,
  subject text not null,
  status public.email_delivery_status not null default 'skipped',
  provider text,
  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint email_logs_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.coachee_goals (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  coachee_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cohort_id uuid references public.cohorts(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  content_id uuid references public.contents(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete cascade,
  position integer not null default 1,
  constraint learning_path_item_payload_check check (content_id is not null or quiz_id is not null)
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists cohorts_coach_id_idx on public.cohorts(coach_id);
create index if not exists cohort_members_user_id_idx on public.cohort_members(user_id);
create index if not exists contents_created_by_idx on public.contents(created_by);
create index if not exists contents_theme_subtheme_idx on public.contents(theme_id, subtheme_id);
create index if not exists contents_status_type_idx on public.contents(status, type);
create index if not exists quizzes_created_by_idx on public.quizzes(created_by);
create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id, position);
create index if not exists assignments_assigned_by_idx on public.assignments(assigned_by);
create index if not exists assignments_user_idx on public.assignments(assigned_to_user_id);
create index if not exists assignments_cohort_idx on public.assignments(assigned_to_cohort_id);
create index if not exists assignments_deadline_status_idx on public.assignments(deadline, status);
create index if not exists assignment_progress_user_idx on public.assignment_progress(user_id, status);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id, status);
create index if not exists messages_participants_idx on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists calendar_events_user_idx on public.calendar_events(coach_id, coachee_id, cohort_id, start_time);
create index if not exists activity_logs_user_idx on public.activity_logs(user_id, created_at desc);
create index if not exists email_logs_recipient_idx on public.email_logs(recipient_user_id, created_at desc);
create index if not exists email_logs_type_idx on public.email_logs(email_type, created_at desc);
create index if not exists email_logs_metadata_gin_idx on public.email_logs using gin (metadata);
create index if not exists learning_paths_cohort_idx on public.learning_paths(cohort_id);
create index if not exists learning_paths_created_by_idx on public.learning_paths(created_by);
create index if not exists learning_path_items_path_idx on public.learning_path_items(learning_path_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contents_touch_updated_at on public.contents;
create trigger contents_touch_updated_at
before update on public.contents
for each row execute function public.touch_updated_at();

drop trigger if exists quizzes_touch_updated_at on public.quizzes;
create trigger quizzes_touch_updated_at
before update on public.quizzes
for each row execute function public.touch_updated_at();

drop trigger if exists assignments_touch_updated_at on public.assignments;
create trigger assignments_touch_updated_at
before update on public.assignments
for each row execute function public.touch_updated_at();

drop trigger if exists assignment_progress_touch_updated_at on public.assignment_progress;
create trigger assignment_progress_touch_updated_at
before update on public.assignment_progress
for each row execute function public.touch_updated_at();

create or replace function public.coach_owns_cohort(target_cohort_id uuid, coach_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cohorts c
    where c.id = target_cohort_id
      and c.coach_id = coach_uuid
  );
$$;

create or replace function public.is_cohort_member(target_cohort_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cohort_members cm
    where cm.cohort_id = target_cohort_id
      and cm.user_id = target_user_id
  );
$$;

create or replace function public.coach_owns_coachee(coach_uuid uuid, coachee_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cohorts c
    join public.cohort_members cm on cm.cohort_id = c.id
    where c.coach_id = coach_uuid
      and cm.user_id = coachee_uuid
  );
$$;

create or replace function public.user_can_see_assignment(target_assignment_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    left join public.cohort_members cm
      on cm.cohort_id = a.assigned_to_cohort_id
      and cm.user_id = target_user_id
    where a.id = target_assignment_id
      and (
        a.assigned_to_user_id = target_user_id
        or cm.user_id is not null
      )
  );
$$;

create or replace function public.user_has_content_assignment(target_content_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    left join public.cohort_members cm
      on cm.cohort_id = a.assigned_to_cohort_id
      and cm.user_id = target_user_id
    where a.content_id = target_content_id
      and (
        a.assigned_to_user_id = target_user_id
        or cm.user_id is not null
      )
  );
$$;

create or replace function public.user_has_quiz_assignment(target_quiz_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    left join public.cohort_members cm
      on cm.cohort_id = a.assigned_to_cohort_id
      and cm.user_id = target_user_id
    where a.quiz_id = target_quiz_id
      and (
        a.assigned_to_user_id = target_user_id
        or cm.user_id is not null
      )
  );
$$;

create or replace function public.user_can_see_learning_path(target_learning_path_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_paths lp
    left join public.cohort_members cm
      on cm.cohort_id = lp.cohort_id
      and cm.user_id = target_user_id
    where lp.id = target_learning_path_id
      and (
        lp.created_by = target_user_id
        or cm.user_id is not null
      )
  );
$$;

create or replace function public.user_owns_learning_path(target_learning_path_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_paths lp
    where lp.id = target_learning_path_id
      and lp.created_by = target_user_id
  );
$$;

create or replace function public.user_has_content_learning_path(target_content_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_path_items lpi
    join public.learning_paths lp on lp.id = lpi.learning_path_id
    left join public.cohort_members cm
      on cm.cohort_id = lp.cohort_id
      and cm.user_id = target_user_id
    where lpi.content_id = target_content_id
      and (
        lp.created_by = target_user_id
        or cm.user_id is not null
      )
  );
$$;

create or replace function public.user_has_quiz_learning_path(target_quiz_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_path_items lpi
    join public.learning_paths lp on lp.id = lpi.learning_path_id
    left join public.cohort_members cm
      on cm.cohort_id = lp.cohort_id
      and cm.user_id = target_user_id
    where lpi.quiz_id = target_quiz_id
      and (
        lp.created_by = target_user_id
        or cm.user_id is not null
      )
  );
$$;

create or replace function public.create_assignment_progress_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_to_user_id is not null then
    insert into public.assignment_progress (assignment_id, user_id, status, is_late)
    values (new.id, new.assigned_to_user_id, new.status, new.deadline < now())
    on conflict (assignment_id, user_id) do nothing;
  end if;

  if new.assigned_to_cohort_id is not null then
    insert into public.assignment_progress (assignment_id, user_id, status, is_late)
    select new.id, cm.user_id, new.status, new.deadline < now()
    from public.cohort_members cm
    where cm.cohort_id = new.assigned_to_cohort_id
    on conflict (assignment_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists assignments_create_progress_rows on public.assignments;
create trigger assignments_create_progress_rows
after insert on public.assignments
for each row execute function public.create_assignment_progress_rows();

create or replace function public.refresh_late_assignments()
returns void
language sql
security definer
as $$
  update public.assignment_progress ap
  set is_late = true,
      status = case when ap.status <> 'completed' then 'late'::public.assignment_status else ap.status end,
      updated_at = now()
  from public.assignments a
  where a.id = ap.assignment_id
    and ap.status <> 'completed'
    and a.deadline < now();

  update public.assignments
  set status = 'late',
      updated_at = now()
  where status <> 'completed'
    and deadline < now();
$$;

create or replace function public.recalculate_quiz_attempt(target_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  max_score numeric := 0;
  obtained_score numeric := 0;
  manual_pending boolean := false;
  passing numeric := 70;
  pct numeric := 0;
begin
  select coalesce(sum(points), 0)
  into max_score
  from public.quiz_questions qq
  join public.quiz_attempts qa on qa.quiz_id = qq.quiz_id
  where qa.id = target_attempt_id;

  select coalesce(sum(points_obtained), 0),
         coalesce(bool_or(needs_manual_correction), false)
  into obtained_score, manual_pending
  from public.quiz_answers
  where attempt_id = target_attempt_id;

  select q.passing_score
  into passing
  from public.quizzes q
  join public.quiz_attempts qa on qa.quiz_id = q.id
  where qa.id = target_attempt_id;

  if max_score > 0 then
    pct := round((obtained_score / max_score) * 100, 2);
  end if;

  update public.quiz_attempts
  set score_obtained = obtained_score,
      score_max = max_score,
      percentage = pct,
      status = case
        when manual_pending then 'pending_correction'::public.quiz_attempt_status
        when pct >= passing then 'passed'::public.quiz_attempt_status
        else 'failed'::public.quiz_attempt_status
      end,
      passed = (not manual_pending and pct >= passing),
      corrected_at = case when manual_pending then corrected_at else now() end
  where id = target_attempt_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.themes enable row level security;
alter table public.subthemes enable row level security;
alter table public.contents enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_progress enable row level security;
alter table public.content_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.messages enable row level security;
alter table public.calendar_events enable row level security;
alter table public.coach_notes enable row level security;
alter table public.activity_logs enable row level security;
alter table public.email_logs enable row level security;
alter table public.coachee_goals enable row level security;
alter table public.reminder_templates enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_items enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or public.is_coach()
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
for update using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "cohorts_select" on public.cohorts;
create policy "cohorts_select" on public.cohorts
for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or public.is_cohort_member(cohorts.id, (select auth.uid()))
);

drop policy if exists "cohorts_write_admin_or_owner" on public.cohorts;
create policy "cohorts_write_admin_or_owner" on public.cohorts
for all using (public.is_admin() or coach_id = (select auth.uid()))
with check (public.is_admin() or coach_id = (select auth.uid()));

drop policy if exists "cohort_members_select" on public.cohort_members;
create policy "cohort_members_select" on public.cohort_members
for select using (
  public.is_admin()
  or user_id = (select auth.uid())
  or public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
);

drop policy if exists "cohort_members_write_coach" on public.cohort_members;
create policy "cohort_members_write_coach" on public.cohort_members
for all using (
  public.is_admin()
  or public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
)
with check (
  public.is_admin()
  or public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
);

drop policy if exists "themes_select_all_authenticated" on public.themes;
create policy "themes_select_all_authenticated" on public.themes
for select using (auth.uid() is not null);

drop policy if exists "themes_write_coach_admin" on public.themes;
create policy "themes_write_coach_admin" on public.themes
for all using (public.is_admin() or created_by = auth.uid())
with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "subthemes_select_all_authenticated" on public.subthemes;
create policy "subthemes_select_all_authenticated" on public.subthemes
for select using (auth.uid() is not null);

drop policy if exists "subthemes_write_theme_owner" on public.subthemes;
create policy "subthemes_write_theme_owner" on public.subthemes
for all using (
  public.is_admin()
  or exists (
    select 1 from public.themes t
    where t.id = subthemes.theme_id and t.created_by = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.themes t
    where t.id = subthemes.theme_id and t.created_by = auth.uid()
  )
);

drop policy if exists "contents_select" on public.contents;
create policy "contents_select" on public.contents
for select using (
  public.is_admin()
  or created_by = (select auth.uid())
  or (
    status = 'published'
    and public.user_has_content_assignment(contents.id, (select auth.uid()))
  )
  or (
    status = 'published'
    and public.user_has_content_learning_path(contents.id, (select auth.uid()))
  )
);

drop policy if exists "contents_write_owner" on public.contents;
create policy "contents_write_owner" on public.contents
for all using (public.is_admin() or created_by = (select auth.uid()))
with check (public.is_admin() or created_by = (select auth.uid()));

drop policy if exists "quizzes_select" on public.quizzes;
create policy "quizzes_select" on public.quizzes
for select using (
  public.is_admin()
  or created_by = (select auth.uid())
  or public.user_has_quiz_assignment(quizzes.id, (select auth.uid()))
  or public.user_has_quiz_learning_path(quizzes.id, (select auth.uid()))
);

drop policy if exists "quizzes_write_owner" on public.quizzes;
create policy "quizzes_write_owner" on public.quizzes
for all using (public.is_admin() or created_by = (select auth.uid()))
with check (public.is_admin() or created_by = (select auth.uid()));

drop policy if exists "quiz_questions_select_via_quiz" on public.quiz_questions;
create policy "quiz_questions_select_via_quiz" on public.quiz_questions
for select using (
  exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id)
);

drop policy if exists "quiz_questions_write_owner" on public.quiz_questions;
create policy "quiz_questions_write_owner" on public.quiz_questions
for all using (
  public.is_admin()
  or exists (
    select 1 from public.quizzes q
    where q.id = quiz_questions.quiz_id and q.created_by = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.quizzes q
    where q.id = quiz_questions.quiz_id and q.created_by = auth.uid()
  )
);

drop policy if exists "quiz_options_select_via_question" on public.quiz_options;
create policy "quiz_options_select_via_question" on public.quiz_options
for select using (
  exists (
    select 1 from public.quiz_questions qq
    where qq.id = quiz_options.question_id
  )
);

drop policy if exists "quiz_options_write_owner" on public.quiz_options;
create policy "quiz_options_write_owner" on public.quiz_options
for all using (
  public.is_admin()
  or exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = quiz_options.question_id and q.created_by = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = quiz_options.question_id and q.created_by = auth.uid()
  )
);

drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select" on public.assignments
for select using (
  public.is_admin()
  or assigned_by = (select auth.uid())
  or public.user_can_see_assignment(id, (select auth.uid()))
);

drop policy if exists "assignments_insert_coach" on public.assignments;
create policy "assignments_insert_coach" on public.assignments
for insert with check (
  public.is_admin()
  or (
    assigned_by = auth.uid()
    and (
      assigned_to_user_id is null
      or public.coach_owns_coachee((select auth.uid()), assigned_to_user_id)
    )
    and (
      assigned_to_cohort_id is null
      or public.coach_owns_cohort(assigned_to_cohort_id, (select auth.uid()))
    )
  )
);

drop policy if exists "assignments_update_owner" on public.assignments;
create policy "assignments_update_owner" on public.assignments
for update using (public.is_admin() or assigned_by = auth.uid())
with check (public.is_admin() or assigned_by = auth.uid());

drop policy if exists "assignment_progress_select" on public.assignment_progress;
create policy "assignment_progress_select" on public.assignment_progress
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.assignments a
    where a.id = assignment_progress.assignment_id
      and a.assigned_by = auth.uid()
  )
);

drop policy if exists "assignment_progress_update_self_or_coach" on public.assignment_progress;
create policy "assignment_progress_update_self_or_coach" on public.assignment_progress
for update using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.assignments a
    where a.id = assignment_progress.assignment_id
      and a.assigned_by = auth.uid()
  )
)
with check (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.assignments a
    where a.id = assignment_progress.assignment_id
      and a.assigned_by = auth.uid()
  )
);

drop policy if exists "content_progress_select" on public.content_progress;
create policy "content_progress_select" on public.content_progress
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or public.coach_owns_coachee(auth.uid(), user_id)
);

drop policy if exists "content_progress_write_self" on public.content_progress;
create policy "content_progress_write_self" on public.content_progress
for all using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "quiz_attempts_select" on public.quiz_attempts;
create policy "quiz_attempts_select" on public.quiz_attempts
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or public.coach_owns_coachee(auth.uid(), user_id)
);

drop policy if exists "quiz_attempts_insert_self" on public.quiz_attempts;
create policy "quiz_attempts_insert_self" on public.quiz_attempts
for insert with check (user_id = auth.uid());

drop policy if exists "quiz_attempts_update_coach" on public.quiz_attempts;
create policy "quiz_attempts_update_coach" on public.quiz_attempts
for update using (
  public.is_admin()
  or public.coach_owns_coachee(auth.uid(), user_id)
)
with check (
  public.is_admin()
  or public.coach_owns_coachee(auth.uid(), user_id)
);

drop policy if exists "quiz_answers_select" on public.quiz_answers;
create policy "quiz_answers_select" on public.quiz_answers
for select using (
  public.is_admin()
  or exists (
    select 1 from public.quiz_attempts qa
    where qa.id = quiz_answers.attempt_id
      and (qa.user_id = auth.uid() or public.coach_owns_coachee(auth.uid(), qa.user_id))
  )
);

drop policy if exists "quiz_answers_insert_self" on public.quiz_answers;
create policy "quiz_answers_insert_self" on public.quiz_answers
for insert with check (
  exists (
    select 1 from public.quiz_attempts qa
    where qa.id = attempt_id and qa.user_id = auth.uid()
  )
);

drop policy if exists "quiz_answers_update_coach" on public.quiz_answers;
create policy "quiz_answers_update_coach" on public.quiz_answers
for update using (
  public.is_admin()
  or exists (
    select 1 from public.quiz_attempts qa
    where qa.id = quiz_answers.attempt_id
      and public.coach_owns_coachee(auth.uid(), qa.user_id)
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.quiz_attempts qa
    where qa.id = quiz_answers.attempt_id
      and public.coach_owns_coachee(auth.uid(), qa.user_id)
  )
);

drop policy if exists "messages_participants" on public.messages;
create policy "messages_participants" on public.messages
for all using (
  public.is_admin()
  or sender_id = auth.uid()
  or receiver_id = auth.uid()
)
with check (
  sender_id = auth.uid()
  and (
    receiver_id = auth.uid()
    or public.is_admin()
    or public.coach_owns_coachee(sender_id, receiver_id)
    or public.coach_owns_coachee(receiver_id, sender_id)
  )
);

drop policy if exists "calendar_events_select" on public.calendar_events;
create policy "calendar_events_select" on public.calendar_events
for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or coachee_id = (select auth.uid())
  or public.is_cohort_member(calendar_events.cohort_id, (select auth.uid()))
);

drop policy if exists "calendar_events_write_coach" on public.calendar_events;
create policy "calendar_events_write_coach" on public.calendar_events
for all using (public.is_admin() or coach_id = auth.uid())
with check (public.is_admin() or coach_id = auth.uid());

drop policy if exists "coach_notes_private" on public.coach_notes;
create policy "coach_notes_private" on public.coach_notes
for all using (public.is_admin() or coach_id = auth.uid())
with check (
  public.is_admin()
  or (
    coach_id = auth.uid()
    and public.coach_owns_coachee(auth.uid(), coachee_id)
  )
);

drop policy if exists "activity_logs_select" on public.activity_logs;
create policy "activity_logs_select" on public.activity_logs
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or public.coach_owns_coachee(auth.uid(), user_id)
);

drop policy if exists "activity_logs_insert_self" on public.activity_logs;
create policy "activity_logs_insert_self" on public.activity_logs
for insert with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "email_logs_select" on public.email_logs;
create policy "email_logs_select" on public.email_logs
for select using (
  public.is_admin()
  or recipient_user_id = auth.uid()
);

drop policy if exists "coachee_goals_policy" on public.coachee_goals;
create policy "coachee_goals_policy" on public.coachee_goals
for all using (
  public.is_admin()
  or coach_id = auth.uid()
  or coachee_id = auth.uid()
)
with check (
  public.is_admin()
  or (
    coach_id = auth.uid()
    and public.coach_owns_coachee(auth.uid(), coachee_id)
  )
);

drop policy if exists "reminder_templates_policy" on public.reminder_templates;
create policy "reminder_templates_policy" on public.reminder_templates
for all using (public.is_admin() or coach_id = auth.uid())
with check (public.is_admin() or coach_id = auth.uid());

drop policy if exists "learning_paths_policy" on public.learning_paths;
create policy "learning_paths_policy" on public.learning_paths
for all using (
  public.is_admin()
  or created_by = (select auth.uid())
  or public.is_cohort_member(learning_paths.cohort_id, (select auth.uid()))
)
with check (public.is_admin() or created_by = (select auth.uid()));

drop policy if exists "learning_path_items_policy" on public.learning_path_items;
create policy "learning_path_items_policy" on public.learning_path_items
for all using (
  public.is_admin()
  or public.user_can_see_learning_path(
    learning_path_items.learning_path_id,
    (select auth.uid())
  )
)
with check (
  public.is_admin()
  or public.user_owns_learning_path(
    learning_path_items.learning_path_id,
    (select auth.uid())
  )
);

-- Private Storage bucket for coach library documents.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'coaching-content-files',
  'coaching-content-files',
  false,
  26214400,
  array[
    'application/msword',
    'application/pdf',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "content_files_select_authorized" on storage.objects;
create policy "content_files_select_authorized" on storage.objects
for select to authenticated using (
  bucket_id = 'coaching-content-files'
  and exists (
    select 1
    from public.contents c
    where c.file_url = 'storage://coaching-content-files/' || storage.objects.name
      and (
        public.is_admin()
        or c.created_by = (select auth.uid())
        or (
          c.status = 'published'
          and public.user_has_content_assignment(c.id, (select auth.uid()))
        )
        or (
          c.status = 'published'
          and public.user_has_content_learning_path(c.id, (select auth.uid()))
        )
      )
  )
);

drop policy if exists "content_files_insert_coach_owner" on storage.objects;
create policy "content_files_insert_coach_owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
);

drop policy if exists "content_files_update_coach_owner" on storage.objects;
create policy "content_files_update_coach_owner" on storage.objects
for update to authenticated using (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
)
with check (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
);

drop policy if exists "content_files_delete_coach_owner" on storage.objects;
create policy "content_files_delete_coach_owner" on storage.objects
for delete to authenticated using (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
);
