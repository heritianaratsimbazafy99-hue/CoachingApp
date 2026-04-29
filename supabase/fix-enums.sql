-- Patch à exécuter une seule fois si les enums existaient déjà avant le schema V1
-- ou si le premier lancement SQL s'est arrêté au milieu.
-- Important : exécuter ce fichier seul, attendre le succès, puis relancer supabase/schema.sql.

do $$
begin
  create type public.user_role as enum ('admin', 'coach', 'coachee');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_type as enum ('text', 'video', 'external_link', 'document', 'quiz');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.assignment_type as enum ('content', 'quiz', 'content_quiz', 'path');
exception
  when duplicate_object then null;
end $$;

alter type public.content_status add value if not exists 'draft';
alter type public.content_status add value if not exists 'published';

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
  create type public.priority_level as enum ('normal', 'high');
exception
  when duplicate_object then null;
end $$;

alter type public.priority_level add value if not exists 'normal';
alter type public.priority_level add value if not exists 'high';

do $$
begin
  create type public.question_type as enum ('single_choice', 'multiple_choice', 'open');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_attempt_status as enum ('passed', 'failed', 'pending_correction');
exception
  when duplicate_object then null;
end $$;

alter type public.quiz_attempt_status add value if not exists 'passed';
alter type public.quiz_attempt_status add value if not exists 'failed';
alter type public.quiz_attempt_status add value if not exists 'pending_correction';

do $$
begin
  create type public.calendar_event_type as enum ('individual_coaching', 'collective_workshop', 'reminder', 'info_meeting');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.calendar_event_status as enum ('scheduled', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;
