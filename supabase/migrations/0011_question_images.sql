-- 0011 (authoring+): ẢNH trong câu tự soạn.
-- Cột image_url (public URL) + bucket Storage công khai + RLS upload theo thư mục uid + RPC trả thêm ảnh.
-- Ảnh minh hoạ KHÔNG nhạy cảm như đáp án → bucket public (đọc tự do); chỉ giới hạn GHI.

-- 1) Cột ảnh (null = không có).
alter table public.custom_questions add column if not exists image_url text;

-- 2) Bucket công khai cho ảnh câu hỏi.
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

-- 3) RLS storage.objects: user đã đăng nhập GHI ảnh trong thư mục của mình ({uid}/...). Đọc: bucket public.
drop policy if exists qimg_insert on storage.objects;
drop policy if exists qimg_update on storage.objects;
drop policy if exists qimg_delete on storage.objects;
create policy qimg_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'question-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy qimg_update on storage.objects for update to authenticated
  using (bucket_id = 'question-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy qimg_delete on storage.objects for delete to authenticated
  using (bucket_id = 'question-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) RPC trả thêm image_url (đổi return type → phải drop trước). Vẫn ẩn correct/explanation (D4).
drop function if exists public.custom_questions_for_student(uuid[]);
create or replace function public.custom_questions_for_student(ids uuid[])
  returns table (id uuid, type text, prompt text, choices text[], image_url text)
  language sql stable security definer set search_path = public as $$
  select cq.id, cq.type, cq.prompt, cq.choices, cq.image_url
  from public.custom_questions cq
  where cq.id = any(ids)
    and exists (
      select 1 from public.assignments a
      where cq.id::text = any(a.question_ids)
        and (
          (a.class_id is not null and public.is_member(a.class_id))
          or a.assignee_student_id = auth.uid()
        )
    );
$$;
revoke all on function public.custom_questions_for_student(uuid[]) from public;
grant execute on function public.custom_questions_for_student(uuid[]) to authenticated;
