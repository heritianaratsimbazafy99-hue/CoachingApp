-- Patch RLS récursion cohorts/cohort_members.
-- Copier-coller dans Supabase SQL Editor, puis Run.

create index if not exists learning_paths_cohort_idx on public.learning_paths(cohort_id);
create index if not exists learning_paths_created_by_idx on public.learning_paths(created_by);
create index if not exists learning_path_items_path_idx on public.learning_path_items(learning_path_id);

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

drop policy if exists "contents_select" on public.contents;
create policy "contents_select" on public.contents
for select using (
  public.is_admin()
  or created_by = (select auth.uid())
  or (
    status = 'published'
    and public.user_has_content_assignment(contents.id, (select auth.uid()))
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
);

drop policy if exists "quizzes_write_owner" on public.quizzes;
create policy "quizzes_write_owner" on public.quizzes
for all using (public.is_admin() or created_by = (select auth.uid()))
with check (public.is_admin() or created_by = (select auth.uid()));

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
    assigned_by = (select auth.uid())
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

drop policy if exists "calendar_events_select" on public.calendar_events;
create policy "calendar_events_select" on public.calendar_events
for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or coachee_id = (select auth.uid())
  or public.is_cohort_member(calendar_events.cohort_id, (select auth.uid()))
);

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
