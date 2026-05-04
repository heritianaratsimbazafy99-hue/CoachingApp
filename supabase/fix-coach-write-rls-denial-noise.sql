-- Nettoie les anciens helpers/policies RLS qui peuvent produire :
-- "return type mismatch in function declared to return app_role"
-- lors d'une tentative d'ecriture interdite par un compte coache.
--
-- Copier-coller dans Supabase SQL Editor, puis Run.

do $$
declare
  jwt_return_type text;
begin
  select pg_get_function_result('public.jwt_role()'::regprocedure)
  into jwt_return_type;

  if lower(coalesce(jwt_return_type, '')) like '%app_role%' then
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
        select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
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
        select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
      $fn$;
    $sql$;
end $$;

do $$
declare
  current_role_return_type text;
begin
  select pg_get_function_result('public."current_role"()'::regprocedure)
  into current_role_return_type;

  if lower(coalesce(current_role_return_type, '')) like '%app_role%' then
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
  else
    execute $sql$
      create or replace function public."current_role"()
      returns text
      language sql
      stable
      as $fn$
        select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
      $fn$;
    $sql$;
  end if;
exception
  when undefined_function then
    null;
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
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('cohorts', 'calendar_events')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy "cohorts_select" on public.cohorts
for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or public.is_cohort_member(cohorts.id, (select auth.uid()))
);

create policy "cohorts_write_admin_or_owner" on public.cohorts
for all using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
);

create policy "calendar_events_select" on public.calendar_events
for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or coachee_id = (select auth.uid())
  or public.is_cohort_member(calendar_events.cohort_id, (select auth.uid()))
);

create policy "calendar_events_write_coach" on public.calendar_events
for all using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and coach_id = (select auth.uid())
    and (
      coachee_id is null
      or public.coach_owns_coachee((select auth.uid()), coachee_id)
    )
    and (
      cohort_id is null
      or public.coach_owns_cohort(cohort_id, (select auth.uid()))
    )
  )
);

select
  'coach_write_rls_denial_noise_fixed' as result,
  pg_get_function_result('public.jwt_role()'::regprocedure) as jwt_role_return_type,
  case
    when to_regprocedure('public."current_role"()') is null then null
    else pg_get_function_result('public."current_role"()'::regprocedure)
  end as current_role_return_type;
