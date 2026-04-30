-- Durcit les écritures RLS réservées aux coachs/admins.
-- Copier-coller dans Supabase SQL Editor, puis Run.

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

drop policy if exists "cohorts_write_admin_or_owner" on public.cohorts;
create policy "cohorts_write_admin_or_owner" on public.cohorts
for all using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
);

drop policy if exists "cohort_members_write_coach" on public.cohort_members;
create policy "cohort_members_write_coach" on public.cohort_members
for all to authenticated using (
  public.is_admin()
  or (
    public.is_coach()
    and public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
  )
)
with check (
  (
    public.is_admin()
    or (
      public.is_coach()
      and public.coach_owns_cohort(cohort_members.cohort_id, (select auth.uid()))
    )
  )
  and exists (
    select 1
    from public.profiles p
    where p.user_id = cohort_members.user_id
      and p.role = 'coachee'
  )
);

drop policy if exists "themes_write_coach_admin" on public.themes;
create policy "themes_write_coach_admin" on public.themes
for all using (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
);

drop policy if exists "subthemes_write_theme_owner" on public.subthemes;
create policy "subthemes_write_theme_owner" on public.subthemes
for all using (
  public.is_admin()
  or (
    public.is_coach()
    and exists (
      select 1
      from public.themes t
      where t.id = subthemes.theme_id
        and t.created_by = (select auth.uid())
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and exists (
      select 1
      from public.themes t
      where t.id = subthemes.theme_id
        and t.created_by = (select auth.uid())
    )
  )
);

drop policy if exists "contents_write_owner" on public.contents;
create policy "contents_write_owner" on public.contents
for all using (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
);

drop policy if exists "quizzes_write_owner" on public.quizzes;
create policy "quizzes_write_owner" on public.quizzes
for all using (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
);

drop policy if exists "quiz_questions_write_owner" on public.quiz_questions;
create policy "quiz_questions_write_owner" on public.quiz_questions
for all using (
  public.is_admin()
  or (
    public.is_coach()
    and exists (
      select 1
      from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.created_by = (select auth.uid())
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and exists (
      select 1
      from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.created_by = (select auth.uid())
    )
  )
);

drop policy if exists "quiz_options_write_owner" on public.quiz_options;
create policy "quiz_options_write_owner" on public.quiz_options
for all using (
  public.is_admin()
  or (
    public.is_coach()
    and exists (
      select 1
      from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      where qq.id = quiz_options.question_id
        and q.created_by = (select auth.uid())
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and exists (
      select 1
      from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      where qq.id = quiz_options.question_id
        and q.created_by = (select auth.uid())
    )
  )
);

drop policy if exists "assignments_insert_coach" on public.assignments;
create policy "assignments_insert_coach" on public.assignments
for insert with check (
  public.is_admin()
  or (
    public.is_coach()
    and assigned_by = (select auth.uid())
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
for update using (
  public.is_admin()
  or (public.is_coach() and assigned_by = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and assigned_by = (select auth.uid()))
);

drop policy if exists "calendar_events_write_coach" on public.calendar_events;
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

drop policy if exists "coach_notes_private" on public.coach_notes;
create policy "coach_notes_private" on public.coach_notes
for all using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and coach_id = (select auth.uid())
    and public.coach_owns_coachee((select auth.uid()), coachee_id)
  )
);

drop policy if exists "coachee_goals_policy" on public.coachee_goals;
drop policy if exists "coachee_goals_select" on public.coachee_goals;
drop policy if exists "coachee_goals_insert_coach" on public.coachee_goals;
drop policy if exists "coachee_goals_update_coach" on public.coachee_goals;
drop policy if exists "coachee_goals_delete_coach" on public.coachee_goals;

create policy "coachee_goals_select" on public.coachee_goals
for select using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
  or coachee_id = (select auth.uid())
);

create policy "coachee_goals_insert_coach" on public.coachee_goals
for insert
with check (
  public.is_admin()
  or (
    public.is_coach()
    and coach_id = (select auth.uid())
    and public.coach_owns_coachee((select auth.uid()), coachee_id)
  )
);

create policy "coachee_goals_update_coach" on public.coachee_goals
for update using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and coach_id = (select auth.uid())
    and public.coach_owns_coachee((select auth.uid()), coachee_id)
  )
);

create policy "coachee_goals_delete_coach" on public.coachee_goals
for delete using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
);

drop policy if exists "reminder_templates_policy" on public.reminder_templates;
create policy "reminder_templates_policy" on public.reminder_templates
for all using (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
)
with check (
  public.is_admin()
  or (public.is_coach() and coach_id = (select auth.uid()))
);

drop policy if exists "learning_paths_policy" on public.learning_paths;
create policy "learning_paths_policy" on public.learning_paths
for all using (
  public.is_admin()
  or (public.is_coach() and created_by = (select auth.uid()))
  or public.is_cohort_member(learning_paths.cohort_id, (select auth.uid()))
)
with check (
  public.is_admin()
  or (
    public.is_coach()
    and created_by = (select auth.uid())
    and (
      cohort_id is null
      or public.coach_owns_cohort(cohort_id, (select auth.uid()))
    )
  )
);

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
  or (
    public.is_coach()
    and public.user_owns_learning_path(
      learning_path_items.learning_path_id,
      (select auth.uid())
    )
  )
);

select 'coach_write_rls_hardened' as result;
