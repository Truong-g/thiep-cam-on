drop policy if exists "admins read card assets" on storage.objects;
create policy "admins read card assets"
  on storage.objects for select to authenticated
  using (bucket_id = 'thankyou-assets' and (select public.is_admin()));
