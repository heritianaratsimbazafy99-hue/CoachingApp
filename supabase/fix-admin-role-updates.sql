-- Fix admin role updates from the application.
-- The auth.users -> profiles sync trigger updates protected profile fields.
-- This migration allows only the trusted admin role RPC to bypass that guard.

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
