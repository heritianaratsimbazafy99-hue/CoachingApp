-- Read-only security/RLS audit helpers for CoachingApp.
-- Run in the Supabase SQL Editor. Every result set should be reviewed.

-- 1. Public application tables that do not have RLS enabled.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname not like 'pg_%'
  and c.relname not like 'supabase_%'
  and not c.relrowsecurity
order by c.relname;

-- 2. Policies that apply to PUBLIC because no role was specified.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and roles = '{public}'
order by schemaname, tablename, policyname;

-- 3. Profiles whose stored role does not match auth.raw_app_meta_data.role.
-- These rows should be checked before relying on profile.role fallback.
select
  u.id as user_id,
  u.email,
  p.role as profile_role,
  coalesce(u.raw_app_meta_data ->> 'role', 'missing') as app_metadata_role
from auth.users u
join public.profiles p on p.user_id = u.id
where coalesce(u.raw_app_meta_data ->> 'role', 'coachee') <> p.role::text
order by u.created_at desc;

-- 4. Direct grants that still allow authenticated users to update protected profile columns.
select
  grantee,
  table_schema,
  table_name,
  column_name,
  privilege_type,
  is_grantable
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('role', 'user_id')
  and privilege_type = 'UPDATE'
  and grantee in ('anon', 'authenticated')
order by grantee, column_name;

-- 5. Policies that call auth.uid() directly. These are valid but can be
-- optimized by using (select auth.uid()) in high-traffic policies.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    qual like '%auth.uid()%'
    or with_check like '%auth.uid()%'
  )
order by tablename, policyname;

-- 6. Security definer functions and their search_path posture.
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '') as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname;
