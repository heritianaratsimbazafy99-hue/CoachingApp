-- Allow coachees to open published contents and quizzes that belong to a visible learning path.

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

drop policy if exists "quizzes_select" on public.quizzes;
create policy "quizzes_select" on public.quizzes
for select using (
  public.is_admin()
  or created_by = (select auth.uid())
  or public.user_has_quiz_assignment(quizzes.id, (select auth.uid()))
  or public.user_has_quiz_learning_path(quizzes.id, (select auth.uid()))
);
