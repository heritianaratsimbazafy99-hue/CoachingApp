-- Repair legacy role helpers that may still be declared with app_role and
-- throw "return type mismatch in function declared to return app_role".
-- Safe to run before/after the coach interview notes feature.

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

  if current_role_return_type in ('app_role', 'public.app_role') then
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

create index if not exists coach_notes_coachee_created_idx
on public.coach_notes(coachee_id, created_at desc);

create index if not exists coach_notes_coach_created_idx
on public.coach_notes(coach_id, created_at desc);
