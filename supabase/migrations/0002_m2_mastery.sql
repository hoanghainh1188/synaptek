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
