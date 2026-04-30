-- Correctif idempotent Supabase Auth.
-- A executer dans Supabase SQL Editor si la creation d'un utilisateur Auth
-- echoue avec "Database error creating new user".

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('admin', 'coach', 'coachee');
exception
  when duplicate_object then null;
end $$;

alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'coach';
alter type public.user_role add value if not exists 'coachee';

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
    select coalesce(app_meta, '{}'::jsonb) as safe_app_meta
  )
  select case
    when safe_app_meta ->> 'role' in ('admin', 'coach', 'coachee')
      then (safe_app_meta ->> 'role')::public.user_role
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
