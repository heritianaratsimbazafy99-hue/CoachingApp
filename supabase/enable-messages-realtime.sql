-- Enable Supabase Realtime events for the WhatsApp-style messaging screen.
-- Safe to run more than once.

alter table public.messages replica identity full;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.messages;
    exception
      when duplicate_object then
        null;
      when undefined_object then
        null;
    end;
  end if;
end $$;
