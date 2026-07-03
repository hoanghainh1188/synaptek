-- 0024 (D51): AVATAR ẢNH THẬT — lựa chọn THÊM bên cạnh emoji mở khoá theo XP (D15/0015), không thay thế.
-- Cột avatar_photo_url (public URL, null = chưa đặt/đang dùng emoji) + bucket Storage riêng (không
-- dùng chung question-images vì đối tượng khác: ảnh đại diện cá nhân, giới hạn kích thước nhỏ hơn).

-- 1) Cột ảnh đại diện thật.
alter table public.profiles add column if not exists avatar_photo_url text;

-- 2) Bucket công khai cho avatar — giới hạn 2MB + chỉ ảnh (chặn ở tầng Storage, không chỉ client).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) RLS storage.objects: user GHI ảnh trong thư mục của mình ({uid}/...). Đọc: bucket public.
drop policy if exists avatar_insert on storage.objects;
drop policy if exists avatar_update on storage.objects;
drop policy if exists avatar_delete on storage.objects;
create policy avatar_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatar_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatar_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
