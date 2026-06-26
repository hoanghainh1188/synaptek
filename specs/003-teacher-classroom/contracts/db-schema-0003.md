# Contract — migration `0003_m3_classroom.sql` (storage GATE)

Bảng + RLS chéo vai trò cho M3. Helper `SECURITY DEFINER` phá đệ quy RLS (R3/D24). Mirror phong cách
`0001`/`0002` (RLS "của mình" + grants `authenticated`). Server (service-role) ghi `auto_score`.

> Đây là **hợp đồng** — bản migration thật bám sát; thay đổi phải cập nhật file này (D6 spirit). SQL dưới
> là nguồn để viết `supabase/migrations/0003_m3_classroom.sql`.

## 1. profiles.role

```sql
alter table public.profiles
  add column if not exists role text not null default 'student'
  check (role in ('student','teacher'));
```

## 2. Bảng

```sql
create table public.classes (
  id                uuid primary key default gen_random_uuid(),
  owner_teacher_id  uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name              text not null,
  invite_code       text not null unique,
  invite_expires_at timestamptz,
  created_at        timestamptz not null default now()
);

create table public.class_members (
  class_id   uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table public.assignments (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes(id) on delete cascade,
  title        text not null,
  question_ids text[] not null check (cardinality(question_ids) >= 1),
  due_at       timestamptz,
  created_at   timestamptz not null default now()
);

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  answers       jsonb not null,
  auto_score    numeric(4,3) check (auto_score between 0 and 1),
  final_score   numeric(4,3) check (final_score between 0 and 1),
  is_override   boolean not null default false,
  feedback      text,
  submitted_at  timestamptz not null default now(),
  graded_at     timestamptz,
  unique (assignment_id, student_id),
  check (not is_override or final_score is not null)
);

create index on public.class_members (student_id);
create index on public.assignments (class_id);
create index on public.submissions (assignment_id);
create index on public.submissions (student_id);
```

## 3. Helper `SECURITY DEFINER` (chống đệ quy RLS — D24)

```sql
create or replace function public.owns_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c where c.id = cid and c.owner_teacher_id = auth.uid());
$$;

create or replace function public.is_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members m where m.class_id = cid and m.student_id = auth.uid());
$$;

revoke all on function public.owns_class(uuid) from public;
revoke all on function public.is_member(uuid)  from public;
grant execute on function public.owns_class(uuid) to authenticated;
grant execute on function public.is_member(uuid)  to authenticated;
```

## 4. RPC tham gia lớp (auto-join, không lộ bảng classes — R4)

```sql
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
```

## 5. RLS

```sql
alter table public.classes       enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments   enable row level security;
alter table public.submissions   enable row level security;

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

-- class_members: HS thấy/ rời row của mình; GV thấy & xóa thành viên lớp mình.
-- (INSERT đi qua RPC join_class_by_code — security definer; không mở INSERT trực tiếp.)
create policy members_select on public.class_members for select
  using (student_id = auth.uid() or owns_class(class_id));
create policy members_delete on public.class_members for delete
  using (student_id = auth.uid() or owns_class(class_id));

-- assignments: GV lớp sửa; thành viên đọc.
create policy assignments_select on public.assignments for select
  using (owns_class(class_id) or is_member(class_id));
create policy assignments_write on public.assignments for all
  using (owns_class(class_id)) with check (owns_class(class_id));

-- submissions: HS đọc/ghi của mình (trước hạn — kiểm ở app/edge); GV lớp đọc + ghi đè điểm/nhận xét.
create policy submissions_select on public.submissions for select
  using (student_id = auth.uid()
    or owns_class((select a.class_id from public.assignments a where a.id = assignment_id)));
create policy submissions_student_write on public.submissions for insert
  with check (student_id = auth.uid()
    and is_member((select a.class_id from public.assignments a where a.id = assignment_id)));
create policy submissions_student_update on public.submissions for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy submissions_teacher_update on public.submissions for update
  using (owns_class((select a.class_id from public.assignments a where a.id = assignment_id)))
  with check (owns_class((select a.class_id from public.assignments a where a.id = assignment_id)));
```

> Lưu ý: `auto_score` chỉ nên do **service-role** (Edge `grade-assignment`) ghi — service-role bỏ qua RLS.
> Policy `submissions_student_*` cho HS ghi `answers` (nộp); auto_score do server cập nhật sau. Cân nhắc
> column-level: thu hồi UPDATE cột `auto_score` khỏi `authenticated` để HS không tự đặt điểm.

## 6. Grants

```sql
grant select, insert, update, delete on public.classes       to authenticated;
grant select,         delete         on public.class_members to authenticated; -- insert qua RPC
grant select, insert, update, delete on public.assignments   to authenticated;
grant select, insert, update         on public.submissions   to authenticated;
-- service_role cho Edge grade-assignment (đọc bài + ghi auto_score xuyên HS):
grant select, update on public.submissions to service_role;
grant select on public.assignments, public.class_members to service_role;
-- thu hồi quyền HS tự đặt auto_score (chỉ server):
revoke update (auto_score) on public.submissions from authenticated;
```

## 7. Bộ test RLS (GATE — SC-002/007)

Script SQL/integration local: tạo `GV1, GV2` (role teacher), `HS_A` (member lớp GV1), `HS_B` (member lớp
GV2). Khẳng định:

1. `HS_A` SELECT lớp/assignments/submissions của GV2 → **0 dòng**.
2. `HS_A` SELECT submission của `HS_B` → **0 dòng**.
3. `GV2` UPDATE submission thuộc lớp GV1 → **bị chặn** (0 dòng ảnh hưởng).
4. `HS_A` INSERT submission cho assignment lớp GV2 → **bị chặn** (with check fail).
5. `join_class_by_code` mã hết hạn/sai → exception; mã đúng → `HS` vào lớp (idempotent).
6. `HS_A` UPDATE `auto_score` của chính mình → **bị chặn** (column revoke).
