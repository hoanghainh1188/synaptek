-- 0020 (loại câu): GỢI Ý/hướng dẫn kèm câu — cột hint + RPC trả thêm hint (hiện khi HS làm bài).
-- Khác `explanation` (lời giải, ẩn khi làm — D4): `hint` là nhắc hỗ trợ, CỐ Ý hiện trong lúc làm.
alter table public.custom_questions add column if not exists hint text;

-- RPC trả thêm hint (đổi return type → drop trước). Vẫn ẩn correct/explanation.
drop function if exists public.custom_questions_for_student(uuid[]);
create or replace function public.custom_questions_for_student(ids uuid[])
  returns table (id uuid, type text, prompt text, choices text[], image_url text, hint text)
  language sql stable security definer set search_path = public as $$
  select cq.id, cq.type, cq.prompt, cq.choices, cq.image_url, cq.hint
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
