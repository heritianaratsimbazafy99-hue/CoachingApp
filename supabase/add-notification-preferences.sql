alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

update public.profiles
set notification_preferences = '{}'::jsonb
where notification_preferences is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_notification_preferences_object_check'
  ) then
    alter table public.profiles
      add constraint profiles_notification_preferences_object_check
      check (jsonb_typeof(notification_preferences) = 'object');
  end if;
end $$;
