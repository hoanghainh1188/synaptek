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
