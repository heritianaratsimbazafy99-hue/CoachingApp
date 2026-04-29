-- Patch pour bases Supabase où assignment_progress.status, content_progress.status
-- ou assignments.status existent déjà avec un ancien enum public.progress_status.
-- Exécuter ce fichier seul, attendre le succès, puis relancer supabase/schema.sql.

drop view if exists public.assignment_progress_effective cascade;

do $$
begin
  create type public.assignment_status as enum ('assigned', 'in_progress', 'completed', 'late');
exception
  when duplicate_object then null;
end $$;

alter type public.assignment_status add value if not exists 'assigned';
alter type public.assignment_status add value if not exists 'in_progress';
alter type public.assignment_status add value if not exists 'completed';
alter type public.assignment_status add value if not exists 'late';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assignment_progress'
      and column_name = 'status'
      and udt_name <> 'assignment_status'
  ) then
    alter table public.assignment_progress
      alter column status drop default,
      alter column status type public.assignment_status
        using (
          case status::text
            when 'not_started' then 'assigned'
            when 'pending' then 'assigned'
            when 'done' then 'completed'
            else status::text
          end
        )::public.assignment_status,
      alter column status set default 'assigned'::public.assignment_status;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'content_progress'
      and column_name = 'status'
      and udt_name <> 'assignment_status'
  ) then
    alter table public.content_progress
      alter column status drop default,
      alter column status type public.assignment_status
        using (
          case status::text
            when 'not_started' then 'assigned'
            when 'pending' then 'assigned'
            when 'done' then 'completed'
            else status::text
          end
        )::public.assignment_status,
      alter column status set default 'assigned'::public.assignment_status;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assignments'
      and column_name = 'status'
      and udt_name <> 'assignment_status'
  ) then
    alter table public.assignments
      alter column status drop default,
      alter column status type public.assignment_status
        using (
          case status::text
            when 'not_started' then 'assigned'
            when 'pending' then 'assigned'
            when 'done' then 'completed'
            else status::text
          end
        )::public.assignment_status,
      alter column status set default 'assigned'::public.assignment_status;
  end if;
end $$;

create or replace view public.assignment_progress_effective as
select
  ap.id,
  ap.assignment_id,
  ap.user_id,
  case
    when ap.status <> 'completed'::public.assignment_status
      and a.deadline < now()
    then 'late'::public.assignment_status
    else ap.status
  end as status,
  ap.started_at,
  ap.completed_at,
  (
    ap.is_late
    or (
      ap.status <> 'completed'::public.assignment_status
      and a.deadline < now()
    )
  ) as is_late,
  ap.created_at,
  ap.updated_at,
  a.deadline
from public.assignment_progress ap
join public.assignments a on a.id = ap.assignment_id;
