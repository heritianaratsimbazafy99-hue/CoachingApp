-- Fix legacy role helpers that can break the messages RLS policy with:
-- "return type mismatch in function declared to return app_role".
-- Safe to run after supabase/harden-auth-profile-rls.sql.

do $$
begin
  create type public.user_role as enum ('admin', 'coach', 'coachee');
exception
  when duplicate_object then null;
end $$;

alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'coach';
alter type public.user_role add value if not exists 'coachee';

do $$
declare
  jwt_return_type text;
begin
  select pg_get_function_result('public.jwt_role()'::regprocedure)
  into jwt_return_type;

  if jwt_return_type in ('app_role', 'public.app_role') then
    execute $sql$
      create or replace function public.jwt_role()
      returns public.app_role
      language sql
      stable
      as $fn$
        select case
          when auth.jwt() -> 'app_metadata' ->> 'role' in ('admin', 'coach', 'coachee')
            then (auth.jwt() -> 'app_metadata' ->> 'role')::public.app_role
          else 'coachee'::public.app_role
        end;
      $fn$;
    $sql$;
  else
    execute $sql$
      create or replace function public.jwt_role()
      returns text
      language sql
      stable
      as $fn$
        select coalesce(
          auth.jwt() -> 'app_metadata' ->> 'role',
          ''
        );
      $fn$;
    $sql$;
  end if;
exception
  when undefined_function then
    execute $sql$
      create function public.jwt_role()
      returns text
      language sql
      stable
      as $fn$
        select coalesce(
          auth.jwt() -> 'app_metadata' ->> 'role',
          ''
        );
      $fn$;
    $sql$;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role()::text = 'admin';
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
as $$
  select public.jwt_role()::text = 'coach';
$$;

do $$
begin
  if to_regtype('public.app_role') is not null then
    execute $sql$
      create or replace function public."current_role"()
      returns public.app_role
      language sql
      stable
      as $fn$
        select case
          when auth.jwt() -> 'app_metadata' ->> 'role' in ('admin', 'coach', 'coachee')
            then (auth.jwt() -> 'app_metadata' ->> 'role')::public.app_role
          else 'coachee'::public.app_role
        end;
      $fn$;
    $sql$;
  end if;
end $$;

drop trigger if exists auth_users_sync_profile on auth.users;
drop function if exists public.handle_auth_user_profile();
drop function if exists public.resolve_user_role(jsonb, jsonb);

create function public.resolve_user_role(
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

create function public.handle_auth_user_profile()
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

drop policy if exists "messages_participants" on public.messages;
create policy "messages_participants" on public.messages
for all to authenticated using (
  public.is_admin()
  or sender_id = (select auth.uid())
  or receiver_id = (select auth.uid())
)
with check (
  sender_id = (select auth.uid())
  and (
    receiver_id = (select auth.uid())
    or public.is_admin()
    or public.coach_owns_coachee(sender_id, receiver_id)
    or public.coach_owns_coachee(receiver_id, sender_id)
  )
);

select 'messaging_role_helpers_fixed' as result;
