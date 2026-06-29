-- 0012 (authoring+): GIAO CHO HS CỤ THỂ trong lớp (subset).
-- KHÔNG có target → cả lớp thấy (tương thích ngược). CÓ target → chỉ HS trong target thấy + nộp được.

create table if not exists public.assignment_targets (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (assignment_id, student_id)
);
alter table public.assignment_targets enable row level security;

-- GV chủ lớp của bài: toàn quyền targets.
create policy atg_owner on public.assignment_targets for all
  using (public.owns_class((select a.class_id from public.assignments a where a.id = assignment_id)))
  with check (public.owns_class((select a.class_id from public.assignments a where a.id = assignment_id)));
-- HS đọc target của chính mình (phụ trợ; RLS assignment đã lọc hiển thị).
create policy atg_student_self on public.assignment_targets for select
  using (student_id = auth.uid());

grant select, insert, delete on public.assignment_targets to authenticated;

-- Helper: bài giao đúng đối tượng cho HS hiện tại? (không target → cả lớp; có target → phải nằm trong).
-- SECURITY DEFINER để đọc assignment_targets không vướng RLS (tránh hồi quy — D24).
create or replace function public.is_targeted(aid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.assignment_targets t where t.assignment_id = aid)
      or exists (
        select 1 from public.assignment_targets t
        where t.assignment_id = aid and t.student_id = auth.uid()
      );
$$;

-- Quyền đọc bài LỚP: GV chủ lớp luôn thấy; HS chỉ thấy nếu là thành viên VÀ đúng đối tượng.
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select
  using (public.owns_class(class_id) or (public.is_member(class_id) and public.is_targeted(id)));
