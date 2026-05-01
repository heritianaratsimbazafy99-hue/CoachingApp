-- Harden auth/profile role boundaries and cohort membership writes.
-- Run in the Supabase SQL Editor after the main schema.

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );
$$;

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

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if current_setting('app.profile_role_update_bypass', true) = 'on'
    or auth.role() = 'service_role'
    or public.is_admin() then
    return new;
  end if;

  if old.user_id is distinct from new.user_id
    or old.role is distinct from new.role then
    raise exception 'Modification non autorisée des champs protégés du profil.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
before update of user_id, role on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.admin_set_user_role(
  target_user_id uuid,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_role public.user_role;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Action réservée aux admins.'
      using errcode = '42501';
  end if;

  if target_role not in ('admin', 'coach', 'coachee') then
    raise exception 'Rôle utilisateur invalide.'
      using errcode = '22023';
  end if;

  resolved_role := target_role::public.user_role;

  perform set_config('app.profile_role_update_bypass', 'on', true);

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', resolved_role::text)
  where id = target_user_id;

  if not found then
    raise exception 'Utilisateur introuvable.'
      using errcode = 'P0002';
  end if;

  insert into public.profiles (
    user_id,
    full_name,
    role,
    avatar_url,
    notification_preferences
  )
  select
    id,
    coalesce(
      nullif(raw_user_meta_data ->> 'full_name', ''),
      nullif(raw_user_meta_data ->> 'name', ''),
      nullif(email, ''),
      'Utilisateur'
    ),
    resolved_role,
    nullif(raw_user_meta_data ->> 'avatar_url', ''),
    '{}'::jsonb
  from auth.users
  where id = target_user_id
  on conflict (user_id) do update
  set
    role = excluded.role,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    notification_preferences = coalesce(
      public.profiles.notification_preferences,
      '{}'::jsonb
    );
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to service_role;

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert to authenticated with check (
  public.is_admin()
  or (
    user_id = (select auth.uid())
    and role = case
      when public.jwt_role() in ('admin', 'coach', 'coachee')
        then public.jwt_role()::public.user_role
      else 'coachee'::public.user_role
    end
  )
);

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select to authenticated using (
  public.is_admin()
  or user_id = (select auth.uid())
  or public.is_coach()
);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
for update to authenticated using (
  public.is_admin()
  or user_id = (select auth.uid())
)
with check (
  public.is_admin()
  or user_id = (select auth.uid())
);

revoke update on public.profiles from anon;
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, notification_preferences) on public.profiles to authenticated;
grant update on public.profiles to service_role;

drop policy if exists "cohort_members_select" on public.cohort_members;
create policy "cohort_members_select" on public.cohort_members
for select to authenticated using (
  public.is_admin()
  or user_id = (select auth.uid())
  or public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
);

drop policy if exists "cohort_members_write_coach" on public.cohort_members;
create policy "cohort_members_write_coach" on public.cohort_members
for all to authenticated using (
  public.is_admin()
  or public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
)
with check (
  (
    public.is_admin()
    or public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
  )
  and exists (
    select 1
    from public.profiles p
    where p.user_id = cohort_members.user_id
      and p.role = 'coachee'
  )
);

select 'auth_profile_rls_hardened' as result;
