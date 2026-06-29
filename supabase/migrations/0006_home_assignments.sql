-- Synaptek — Giao bài tại nhà (mở rộng M4): PH giao bài cho con đã liên kết.
-- Tổng quát hoá `assignments`: bài LỚP (class_id) XOR bài TẠI NHÀ (owner_parent_id + assignee_student_id).
-- Chấm vẫn server-side (D4) qua grade-assignment. PH chỉ tạo/sửa/xoá bài + XEM kết quả (read-only, D26).
-- M1–M4 (0001–0005) KHÔNG đổi hành vi: bài lớp giữ nguyên (class_id not null).

-- ── Cột mới + nới ràng buộc class_id ─────────────────────────────────────────
alter table public.assignments alter column class_id drop not null;
alter table public.assignments
  add column if not exists assignee_student_id uuid references public.profiles (id) on delete cascade,
  add column if not exists owner_parent_id uuid references public.profiles (id) on delete cascade;

-- Đúng một chế độ: bài lớp (class_id, không assignee/owner) XOR bài nhà (assignee+owner, không class).
alter table public.assignments add constraint assignments_mode_chk check (
  (class_id is not null and assignee_student_id is null and owner_parent_id is null)
  or (class_id is null and assignee_student_id is not null and owner_parent_id is not null)
);
create index on public.assignments (assignee_student_id);
create index on public.assignments (owner_parent_id);

-- ── RLS — thêm policy cho bài tại nhà (OR với policy lớp sẵn có) ───────────────
-- Đọc: PH chủ bài hoặc con được giao. (owns_class/is_member với class_id null → false, an toàn.)
create policy assignments_select_home on public.assignments for select
  using (owner_parent_id = auth.uid() or assignee_student_id = auth.uid());

-- Tạo bài nhà: PH chủ bài, là PH của con (is_parent_of), bắt buộc class_id null.
create policy assignments_insert_home on public.assignments for insert
  with check (
    class_id is null
    and owner_parent_id = auth.uid()
    and public.is_parent_of(assignee_student_id)
  );

-- Sửa/xoá bài nhà: chỉ PH chủ bài.
create policy assignments_update_home on public.assignments for update
  using (owner_parent_id = auth.uid()) with check (owner_parent_id = auth.uid());
create policy assignments_delete_home on public.assignments for delete
  using (owner_parent_id = auth.uid());
