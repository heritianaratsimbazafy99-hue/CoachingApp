-- Enable Realtime events used by the app shell badges and alert strip.
-- Safe to run more than once.

alter table public.messages replica identity full;
alter table public.activity_logs replica identity full;
alter table public.assignment_progress replica identity full;
alter table public.content_progress replica identity full;
alter table public.quiz_attempts replica identity full;

do $$
declare
  target_table text;
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    return;
  end if;

  foreach target_table in array array[
    'messages',
    'activity_logs',
    'assignment_progress',
    'content_progress',
    'quiz_attempts'
  ]
  loop
    begin
      execute format(
        'alter publication supabase_realtime add table public.%I',
        target_table
      );
    exception
      when duplicate_object then
        null;
      when undefined_object then
        null;
    end;
  end loop;
end $$;
