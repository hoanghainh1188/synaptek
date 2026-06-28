-- ⚠️ Synaptek — GỘP migration 0001→0004 để dán vào Supabase Dashboard → SQL Editor (chạy MỘT lần trên project hosted MỚI).
-- Tự sinh từ supabase/migrations/. Thứ tự quan trọng. (deploy headless từ xa)

-- ════════════════════════════════════════════════════════════════
-- supabase/migrations/0001_init.sql
-- ════════════════════════════════════════════════════════════════
-- Synaptek — schema khởi tạo (M0/M1: vòng luyện tập học sinh).
-- Phạm vi: profiles + attempts + skill_mastery (đủ cho M1). Các bảng giáo viên/phụ huynh
-- (classes, assignments, parent_links) để migration sau (M3) khi RLS chéo-vai-trò được thiết kế kỹ.
-- Nội dung (curriculum + câu hỏi) KHÔNG ở DB — là JSON versioned trong content/ (D6).

-- ── profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'student' check (role in ('student', 'teacher', 'parent')),
  full_name   text,
  grade_level int check (grade_level between 1 and 12),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Tự tạo profile khi có user mới đăng ký.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── attempts (mỗi lần trả lời một câu) ───────────────────────────────────────
create table public.attempts (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  question_id text not null,
  skill_id    text,
  answer      jsonb,
  is_correct  boolean not null,
  score       numeric(4, 3) not null default 0 check (score between 0 and 1),
  created_at  timestamptz not null default now()
);

create index attempts_student_created_idx on public.attempts (student_id, created_at desc);

alter table public.attempts enable row level security;

create policy "attempts_rw_own"
  on public.attempts for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- ── skill_mastery (tiến độ theo từng kỹ năng) ────────────────────────────────
create table public.skill_mastery (
  student_id     uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  skill_id       text not null,
  mastery        numeric(4, 3) not null default 0 check (mastery between 0 and 1),
  attempts_count int not null default 0,
  last_reviewed  timestamptz,
  due_at         timestamptz,
  primary key (student_id, skill_id)
);

alter table public.skill_mastery enable row level security;

create policy "skill_mastery_rw_own"
  on public.skill_mastery for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- ── Quyền bảng ───────────────────────────────────────────────────────────────
-- RLS lọc HÀNG, nhưng vai trò vẫn cần GRANT để truy cập BẢNG. Cấp cho HS đã đăng nhập.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.attempts to authenticated;
grant select, insert, update, delete on public.skill_mastery to authenticated;


-- ════════════════════════════════════════════════════════════════
-- supabase/migrations/0002_m2_mastery.sql
-- ════════════════════════════════════════════════════════════════
-- Synaptek M2 — Mastery & Lộ trình: trạng thái gamification + push + nhắc ôn.
-- skill_mastery (0001) KHÔNG đổi (đã đủ cột: mastery/attempts_count/last_reviewed/due_at).
-- RLS "của mình" + grant cho authenticated (mirror 0001). Job nền chạy bằng service role (bỏ qua RLS).

-- ── gamification_state (XP + streak, 1 dòng/học sinh) ────────────────────────
create table public.gamification_state (
  student_id        uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  total_xp          int not null default 0 check (total_xp >= 0),
  current_streak    int not null default 0 check (current_streak >= 0),
  longest_streak    int not null default 0 check (longest_streak >= 0),
  last_practiced_on date,                       -- ngày VN (Asia/Ho_Chi_Minh)
  updated_at        timestamptz not null default now()
);

alter table public.gamification_state enable row level security;

create policy "gamification_rw_own"
  on public.gamification_state for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- ── student_badges (huy hiệu đã mở — mở đúng một lần) ────────────────────────
create table public.student_badges (
  student_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  badge_id   text not null,                     -- id trong content/gamification/badges.json
  earned_at  timestamptz not null default now(),
  primary key (student_id, badge_id)
);

alter table public.student_badges enable row level security;

create policy "student_badges_rw_own"
  on public.student_badges for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- ── push_tokens (đăng ký thiết bị nhận thông báo) ────────────────────────────
create table public.push_tokens (
  student_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  token      text not null,
  platform   text check (platform in ('ios', 'android', 'web')),
  enabled    boolean not null default true,     -- tắt thông báo → false (FR-019)
  created_at timestamptz not null default now(),
  primary key (student_id, token)
);

alter table public.push_tokens enable row level security;

create policy "push_tokens_rw_own"
  on public.push_tokens for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- ── review_reminders (idempotency nhắc ôn — job nền insert on conflict do nothing) ──
create table public.review_reminders (
  student_id uuid not null references public.profiles (id) on delete cascade,
  due_date   date not null,                     -- ngày VN của chu kỳ nhắc
  created_at timestamptz not null default now(),
  pushed_at  timestamptz,                        -- null = chưa/không gửi được push
  primary key (student_id, due_date)
);

alter table public.review_reminders enable row level security;

create policy "review_reminders_select_own"
  on public.review_reminders for select
  using (auth.uid() = student_id);

-- ── Quyền bảng ───────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.gamification_state to authenticated;
grant select, insert, update, delete on public.student_badges     to authenticated;
grant select, insert, update, delete on public.push_tokens        to authenticated;
grant select                         on public.review_reminders   to authenticated;

-- Job nền `review-scheduler` chạy bằng service_role (bypass RLS) → cần grant bảng tường minh (D21).
-- skill_mastery (0001) chỉ grant authenticated; bổ sung service_role ở đây cho job đọc xuyên HS.
grant select          on public.skill_mastery    to service_role;
grant select          on public.push_tokens      to service_role;
grant select, insert, update on public.review_reminders to service_role;


-- ════════════════════════════════════════════════════════════════
-- supabase/migrations/0003_m3_classroom.sql
-- ════════════════════════════════════════════════════════════════
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

-- skill_mastery (0001 chỉ cho đọc của mình) — THÊM: GV đọc mastery HS mình dạy (phân tích lớp — FR-014).
-- Chỉ SELECT, scoped theo teaches_student. KHÔNG nới `attempts` (R6).
create policy skill_mastery_select_taught on public.skill_mastery for select
  using (public.teaches_student(student_id));

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


-- ════════════════════════════════════════════════════════════════
-- supabase/migrations/0004_assignment_limits.sql
-- ════════════════════════════════════════════════════════════════
-- Synaptek — Giới hạn nộp bài (hạn cứng · số lần · thời gian làm). Mở rộng M3 (0003). (D25)
-- Enforce ở server: Edge `grade-assignment` dùng checkSubmitAllowed (logic thuần @synaptek/classroom qua _shared).

-- ── assignments: cấu hình giới hạn (GV đặt mỗi bài) ──────────────────────────
alter table public.assignments
  add column if not exists allow_late         boolean not null default true,  -- false = chặn nộp sau hạn
  add column if not exists max_attempts       int check (max_attempts is null or max_attempts >= 1),
  add column if not exists time_limit_minutes int check (time_limit_minutes is null or time_limit_minutes >= 1);

-- ── submissions: theo dõi số lần + mốc bắt đầu (timer) ───────────────────────
alter table public.submissions
  add column if not exists attempt_count int not null default 0,
  add column if not exists started_at    timestamptz;

-- answers cho phép mặc định rỗng để "bắt đầu làm" tạo được dòng trước khi nộp.
alter table public.submissions alter column answers set default '{}'::jsonb;

-- ── RPC bắt đầu làm bài (đặt started_at lần đầu — cho đồng hồ đếm ngược) ──────
-- Security definer: kiểm HS là thành viên lớp của bài; tạo dòng submission rỗng + started_at nếu chưa có.
-- Trả started_at (mốc server, đáng tin) để client hiển thị countdown.
create or replace function public.start_attempt(p_assignment_id uuid)
  returns timestamptz language plpgsql security definer set search_path = public as $$
declare cid uuid; ts timestamptz;
begin
  select class_id into cid from public.assignments where id = p_assignment_id;
  if cid is null then raise exception 'unknown_assignment'; end if;
  if not public.is_member(cid) then raise exception 'not_member'; end if;

  insert into public.submissions (assignment_id, student_id, answers, started_at)
  values (p_assignment_id, auth.uid(), '{}'::jsonb, now())
  on conflict (assignment_id, student_id) do nothing;

  select started_at into ts from public.submissions
   where assignment_id = p_assignment_id and student_id = auth.uid();
  return ts;
end; $$;

revoke all on function public.start_attempt(uuid) from public;
grant execute on function public.start_attempt(uuid) to authenticated;


