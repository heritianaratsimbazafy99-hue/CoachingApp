create index if not exists coach_notes_coachee_created_idx
on public.coach_notes(coachee_id, created_at desc);

create index if not exists coach_notes_coach_created_idx
on public.coach_notes(coach_id, created_at desc);
