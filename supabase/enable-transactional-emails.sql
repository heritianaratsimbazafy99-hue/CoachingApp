-- Transactional email audit/outbox support for CoachingApp.
-- Copier-coller ce fichier dans Supabase SQL Editor puis Run.

do $$
begin
  create type public.transactional_email_type as enum (
    'invitation',
    'password_reset',
    'path_reminder',
    'quiz_correction',
    'message_received',
    'calendar_event',
    'calendar_event_reminder'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.transactional_email_type add value if not exists 'invitation';
alter type public.transactional_email_type add value if not exists 'password_reset';
alter type public.transactional_email_type add value if not exists 'path_reminder';
alter type public.transactional_email_type add value if not exists 'quiz_correction';
alter type public.transactional_email_type add value if not exists 'message_received';
alter type public.transactional_email_type add value if not exists 'calendar_event';
alter type public.transactional_email_type add value if not exists 'calendar_event_reminder';

do $$
begin
  create type public.email_delivery_status as enum ('skipped', 'sent', 'failed');
exception
  when duplicate_object then null;
end $$;

alter type public.email_delivery_status add value if not exists 'skipped';
alter type public.email_delivery_status add value if not exists 'sent';
alter type public.email_delivery_status add value if not exists 'failed';

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  email_type public.transactional_email_type not null,
  subject text not null,
  status public.email_delivery_status not null default 'skipped',
  provider text,
  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint email_logs_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists email_logs_recipient_idx
  on public.email_logs(recipient_user_id, created_at desc);

create index if not exists email_logs_type_idx
  on public.email_logs(email_type, created_at desc);

create index if not exists email_logs_metadata_gin_idx
  on public.email_logs using gin (metadata);

alter table public.email_logs enable row level security;

drop policy if exists "email_logs_select" on public.email_logs;
create policy "email_logs_select" on public.email_logs
for select using (
  public.is_admin()
  or recipient_user_id = auth.uid()
);
