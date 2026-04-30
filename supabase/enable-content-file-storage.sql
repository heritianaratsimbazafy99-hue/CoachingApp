-- Enable private Supabase Storage for coach library documents.
-- Safe to run more than once.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'coaching-content-files',
  'coaching-content-files',
  false,
  26214400,
  array[
    'application/msword',
    'application/pdf',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "content_files_select_authorized" on storage.objects;
create policy "content_files_select_authorized" on storage.objects
for select to authenticated using (
  bucket_id = 'coaching-content-files'
  and exists (
    select 1
    from public.contents c
    where c.file_url = 'storage://coaching-content-files/' || storage.objects.name
      and (
        public.is_admin()
        or c.created_by = (select auth.uid())
        or (
          c.status = 'published'
          and public.user_has_content_assignment(c.id, (select auth.uid()))
        )
        or (
          c.status = 'published'
          and public.user_has_content_learning_path(c.id, (select auth.uid()))
        )
      )
  )
);

drop policy if exists "content_files_insert_coach_owner" on storage.objects;
create policy "content_files_insert_coach_owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
);

drop policy if exists "content_files_update_coach_owner" on storage.objects;
create policy "content_files_update_coach_owner" on storage.objects
for update to authenticated using (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
)
with check (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
);

drop policy if exists "content_files_delete_coach_owner" on storage.objects;
create policy "content_files_delete_coach_owner" on storage.objects
for delete to authenticated using (
  bucket_id = 'coaching-content-files'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'coach'
    )
  )
);
