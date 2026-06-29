-- Synaptek — Câu hỏi tự soạn (authoring): GV/PH tạo câu của riêng mình để giao (ngoài bank content/ — D28).
-- Chấm vẫn server-side ẩn đáp án (D4): HS chỉ nhận prompt+choices qua hàm SECURITY DEFINER; `correct` chỉ
-- service_role (Edge) đọc. M1–M4 (0001–0006) KHÔNG đổi. Loại đầu: mcq · numeric · fraction.

create table public.custom_questions (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  type        text not null check (type in ('mcq', 'numeric', 'fraction')),
  prompt      text not null check (length(prompt) >= 1),
  choices     text[],
  correct     text not null check (length(correct) >= 1),
  explanation text,
  created_at  timestamptz not null default now(),
  -- mcq: phải có ≥2 lựa chọn và đáp án nằm trong lựa chọn.
  check (type <> 'mcq' or (choices is not null and cardinality(choices) >= 2 and correct = any(choices)))
);
create index on public.custom_questions (author_id);

alter table public.custom_questions enable row level security;

-- Tác giả toàn quyền trên câu của MÌNH (đọc cả `correct` để sửa). Người khác: 0 dòng (kể cả HS).
create policy cq_select_own on public.custom_questions for select using (author_id = auth.uid());
create policy cq_insert_own on public.custom_questions for insert with check (author_id = auth.uid());
create policy cq_update_own on public.custom_questions for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy cq_delete_own on public.custom_questions for delete using (author_id = auth.uid());

grant select, insert, update, delete on public.custom_questions to authenticated;
grant select on public.custom_questions to service_role;  -- Edge chấm đọc `correct` (D4)

-- HS lấy câu tự soạn ĐÃ ĐƯỢC GIAO — chỉ prompt+choices (KHÔNG `correct`/`explanation`). D4.
-- Gate: id phải nằm trong một assignment mà HS là thành viên lớp hoặc được giao tại nhà.
create or replace function public.custom_questions_for_student(ids uuid[])
  returns table (id uuid, type text, prompt text, choices text[])
  language sql stable security definer set search_path = public as $$
  select cq.id, cq.type, cq.prompt, cq.choices
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
