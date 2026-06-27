-- Synaptek M3 — Giáo viên: lớp · thành viên · bài tập · bài nộp + RLS chéo vai trò.
-- M1=0001, M2=0002 KHÔNG đổi. RLS chéo vai trò qua helper SECURITY DEFINER (chống đệ quy — D24).
-- Quyền GV trên HS đến từ QUAN HỆ LỚP (sở hữu + thành viên), không từ profiles.role (D22).

-- ── profiles.role (D22) ──────────────────────────────────────────────────────
-- `role` ĐÃ CÓ ở 0001 (check: 'student'|'teacher'|'parent', default 'student') — M0/M1 đã lường trước.
-- M3 dùng 'teacher' (parent để M4). KHÔNG cần thêm cột; chỉ dùng giá trị 'teacher' cho vai trò GV.

-- ── Bảng (D23) ───────────────────────────────────────────────────────────────
create table public.classes (
  id                uuid primary key default gen_random_uuid(),
  owner_teacher_id  uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name              text not null,
  invite_code       text not null unique,
  invite_expires_at timestamptz,                 -- null = không hạn
  created_at        timestamptz not null default now()
);

create table public.class_members (
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)             -- HS thuộc nhiều lớp
);

create table public.assignments (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes (id) on delete cascade,
  title        text not null,
  question_ids text[] not null check (cardinality(question_ids) >= 1),  -- trỏ content/ (D6)
  due_at       timestamptz,
  created_at   timestamptz not null default now()
);

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  answers       jsonb not null,
  auto_score    numeric(4, 3) check (auto_score between 0 and 1),   -- máy chấm (chỉ server ghi)
  final_score   numeric(4, 3) check (final_score between 0 and 1),  -- GV ghi đè (null = dùng auto)
  is_override   boolean not null default false,
  feedback      text,
  submitted_at  timestamptz not null default now(),
  graded_at     timestamptz,
  unique (assignment_id, student_id),            -- 1 bài nộp/HS; nộp lại = update
  check (not is_override or final_score is not null)  -- audit: override ⇒ có final
);

create index on public.class_members (student_id);
create index on public.assignments (class_id);
create index on public.submissions (assignment_id);
create index on public.submissions (student_id);

-- ── Helper SECURITY DEFINER (phá đệ quy RLS — D24) ──────────────────────────────
create or replace function public.owns_class(cid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c where c.id = cid and c.owner_teacher_id = auth.uid());
$$;

create or replace function public.is_member(cid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members m where m.class_id = cid and m.student_id = auth.uid());
$$;

-- GV có dạy HS này? (HS là thành viên lớp GV sở hữu) — cho roster đọc tên HS (profiles).
create or replace function public.teaches_student(pid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_members m
      join public.classes c on c.id = m.class_id
    where m.student_id = pid and c.owner_teacher_id = auth.uid()
  );
$$;

revoke all on function public.owns_class(uuid) from public;
revoke all on function public.is_member(uuid) from public;
revoke all on function public.teaches_student(uuid) from public;
grant execute on function public.owns_class(uuid) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.teaches_student(uuid) to authenticated;

-- ── RPC tham gia lớp (auto-join; không lộ bảng classes — D24/R4) ─────────────────
create or replace function public.join_class_by_code(code text)
  returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select id into cid from public.classes
   where invite_code = code and (invite_expires_at is null or invite_expires_at > now());
  if cid is null then raise exception 'invalid_or_expired_code'; end if;
  insert into public.class_members (class_id, student_id) values (cid, auth.uid())
    on conflict (class_id, student_id) do nothing;
  return cid;
end; $$;

revoke all on function public.join_class_by_code(text) from public;
grant execute on function public.join_class_by_code(text) to authenticated;

-- ── RLS ────────────────────────────────────────────────────────────────────────
alter table public.classes       enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments   enable row level security;
alter table public.submissions   enable row level security;

-- profiles (0001 chỉ cho đọc của mình) — THÊM: GV đọc được profile HS mình dạy (roster hiển thị tên).
-- Policy OR với policy 0001 (không nới ngoài HS trong lớp GV). Chỉ SELECT.
create policy profiles_select_taught on public.profiles for select
  using (public.teaches_student(id));

-- classes: GV sở hữu thấy & sửa; thành viên chỉ đọc. Tạo lớp cần role=teacher.
create policy classes_select on public.classes for select
  using (owns_class(id) or is_member(id));
create policy classes_insert on public.classes for insert
  with check (owner_teacher_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));
create policy classes_update on public.classes for update
  using (owner_teacher_id = auth.uid()) with check (owner_teacher_id = auth.uid());
create policy classes_delete on public.classes for delete
  using (owner_teacher_id = auth.uid());

-- class_members: HS thấy/rời row của mình; GV thấy & xóa thành viên lớp mình.
-- (INSERT đi qua RPC join_class_by_code — security definer; KHÔNG mở INSERT trực tiếp.)
create policy members_select on public.class_members for select
  using (student_id = auth.uid() or owns_class(class_id));
create policy members_delete on public.class_members for delete
  using (student_id = auth.uid() or owns_class(class_id));

-- assignments: GV lớp sửa; thành viên đọc.
create policy assignments_select on public.assignments for select
  using (owns_class(class_id) or is_member(class_id));
create policy assignments_write on public.assignments for all
  using (owns_class(class_id)) with check (owns_class(class_id));

-- submissions: HS chỉ ĐỌC của mình; GV lớp ĐỌC + GHI ĐÈ điểm/nhận xét.
-- HS KHÔNG ghi trực tiếp — nộp bài đi qua Edge `grade-assignment` (service_role) để server ghi
-- answers + auto_score (D4). Nhờ vậy HS không thể tự đặt auto_score/final_score.
create policy submissions_select on public.submissions for select
  using (student_id = auth.uid()
    or owns_class((select a.class_id from public.assignments a where a.id = assignment_id)));
create policy submissions_teacher_update on public.submissions for update
  using (owns_class((select a.class_id from public.assignments a where a.id = assignment_id)))
  with check (owns_class((select a.class_id from public.assignments a where a.id = assignment_id)));

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.classes       to authenticated;
grant select,                 delete on public.class_members to authenticated;  -- insert qua RPC
grant select, insert, update, delete on public.assignments   to authenticated;
-- submissions: HS chỉ SELECT; GV ghi đè CHỈ các cột (final_score/feedback/is_override) — cấp quyền
-- theo CỘT (không grant table-level UPDATE) để authenticated KHÔNG đụng được auto_score/answers.
grant select on public.submissions to authenticated;
grant update (final_score, feedback, is_override) on public.submissions to authenticated;

-- Edge `grade-assignment` (service_role bỏ qua RLS): ghi answers + auto_score xuyên HS.
grant select, insert, update on public.submissions to service_role;
grant select on public.assignments, public.class_members to service_role;

-- ── Vai trò lúc đăng ký (D22) ──────────────────────────────────────────────────
-- Trigger 0001 chỉ set full_name → thay để cũng copy `role` từ metadata đăng ký (atomic, không race
-- client). Chỉ chấp nhận 'teacher'/'student' (mặc định student); 'parent' để M4.
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher' else 'student' end
  );
  return new;
end; $$;
