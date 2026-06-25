# Contract — Migration `0002_m2_mastery.sql` (storage M2)

GATE storage. Mirror `0001`: RLS "của mình" + `grant … to authenticated`. Job nền dùng **service role**
(bỏ qua RLS). `skill_mastery` **không đổi** (đã đủ cột ở `0001`). Dưới đây là hợp đồng schema (SQL thật ở
migration khi implement).

## gamification_state

```sql
create table public.gamification_state (
  student_id        uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  total_xp          int not null default 0 check (total_xp >= 0),
  current_streak    int not null default 0 check (current_streak >= 0),
  longest_streak    int not null default 0 check (longest_streak >= 0),
  last_practiced_on date,                       -- ngày VN (Asia/Ho_Chi_Minh)
  updated_at        timestamptz not null default now()
);
alter table public.gamification_state enable row level security;
create policy "gamification_rw_own" on public.gamification_state for all
  using (auth.uid() = student_id) with check (auth.uid() = student_id);
```

## student_badges

```sql
create table public.student_badges (
  student_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  badge_id   text not null,                     -- id trong content/gamification/badges.json
  earned_at  timestamptz not null default now(),
  primary key (student_id, badge_id)            -- mở đúng một lần
);
alter table public.student_badges enable row level security;
create policy "student_badges_rw_own" on public.student_badges for all
  using (auth.uid() = student_id) with check (auth.uid() = student_id);
```

## push_tokens

```sql
create table public.push_tokens (
  student_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  token      text not null,
  platform   text check (platform in ('ios','android','web')),
  enabled    boolean not null default true,     -- FR-019: tắt thông báo → false
  created_at timestamptz not null default now(),
  primary key (student_id, token)
);
alter table public.push_tokens enable row level security;
create policy "push_tokens_rw_own" on public.push_tokens for all
  using (auth.uid() = student_id) with check (auth.uid() = student_id);
```

## review_reminders (idempotency — SC-006)

```sql
create table public.review_reminders (
  student_id uuid not null references public.profiles (id) on delete cascade,
  due_date   date not null,                     -- ngày VN của chu kỳ nhắc
  created_at timestamptz not null default now(),
  pushed_at  timestamptz,                        -- null = chưa/không gửi được
  primary key (student_id, due_date)            -- job nền: insert … on conflict do nothing
);
alter table public.review_reminders enable row level security;
-- HS chỉ đọc nhắc của mình; job nền ghi bằng service role (bỏ qua RLS).
create policy "review_reminders_select_own" on public.review_reminders for select
  using (auth.uid() = student_id);
```

## Grants

```sql
grant select, insert, update, delete on public.gamification_state to authenticated;
grant select, insert, update, delete on public.student_badges     to authenticated;
grant select, insert, update, delete on public.push_tokens        to authenticated;
grant select                         on public.review_reminders   to authenticated;
```

## Ghi chú

- **Không** thêm cột vào `profiles`/`skill_mastery`.
- Idempotency của job nền do PK `(student_id, due_date)` đảm bảo — chạy chồng vô hại.
- `last_practiced_on`/`due_date` lưu **ngày VN** (tính bằng `dayKeyVN`) để khớp logic streak/đến hạn.
