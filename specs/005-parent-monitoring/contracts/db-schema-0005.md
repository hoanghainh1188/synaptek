# Contract — migration `0005_m4_parent.sql` (storage GATE)

Liên kết PH–con + RLS đọc chéo (read-only). Mirror M3 (helper `SECURITY DEFINER`, D24). PH **không** có
quyền ghi chéo. M1–M4limits (`0001`–`0004`) **không đổi**.

## 1. profiles.parent_link_code

```sql
alter table public.profiles
  add column if not exists parent_link_code text unique;  -- HS đặt; PH nhập. null = chưa tạo.
```

## 2. parent_links (PH × con, nhiều–nhiều)

```sql
create table public.parent_links (
  parent_id  uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  linked_at  timestamptz not null default now(),
  primary key (parent_id, student_id),
  check (parent_id <> student_id)            -- không tự liên kết
);
create index on public.parent_links (student_id);
```

## 3. Helper `SECURITY DEFINER` (chống đệ quy RLS — D24/D26)

```sql
create or replace function public.is_parent_of(sid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_links pl where pl.student_id = sid and pl.parent_id = auth.uid()
  );
$$;
revoke all on function public.is_parent_of(uuid) from public;
grant execute on function public.is_parent_of(uuid) to authenticated;
```

## 4. RPC liên kết (con tạo mã → PH nhập; không lộ profiles, chống tự-liên-kết)

```sql
create or replace function public.link_parent_by_code(code text)
  returns uuid language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select id into sid from public.profiles where parent_link_code = code;
  if sid is null then raise exception 'invalid_code'; end if;
  if sid = auth.uid() then raise exception 'cannot_link_self'; end if;
  insert into public.parent_links (parent_id, student_id) values (auth.uid(), sid)
    on conflict (parent_id, student_id) do nothing;
  return sid;
end; $$;
revoke all on function public.link_parent_by_code(text) from public;
grant execute on function public.link_parent_by_code(text) to authenticated;
```

## 5. RLS

```sql
alter table public.parent_links enable row level security;

-- parent_links: PH thấy/gỡ liên kết của mình; HS thấy/gỡ PH của mình. (INSERT qua RPC.)
create policy plinks_select on public.parent_links for select
  using (parent_id = auth.uid() or student_id = auth.uid());
create policy plinks_delete on public.parent_links for delete
  using (parent_id = auth.uid() or student_id = auth.uid());

-- PH đọc dữ liệu con đã liên kết — CHỈ SELECT (read-only). Thêm policy vào bảng đã có (OR với policy cũ).
create policy profiles_select_child on public.profiles for select using (is_parent_of(id));
create policy attempts_select_child on public.attempts for select using (is_parent_of(student_id));
create policy mastery_select_child on public.skill_mastery for select using (is_parent_of(student_id));
create policy gami_select_child on public.gamification_state for select using (is_parent_of(student_id));
create policy submissions_select_child on public.submissions for select using (is_parent_of(student_id));
```

> **Read-only**: chỉ thêm policy `for select`. KHÔNG thêm insert/update/delete cho PH → PH không thể ghi
> dữ liệu con (SC-004). Grants bảng giữ như cũ (authenticated); RLS quyết định hàng nào đọc được.

## 6. Grants

```sql
grant select, delete on public.parent_links to authenticated;  -- insert qua RPC
```

## 7. Bộ test RLS (GATE — SC-002/003/004/005)

Seed: `PH1`(parent), `PH2`(parent), `HS_X`(student, có attempts/mastery/gami + 1 submission), `HS_Y`(student).
`PH1` liên kết `HS_X`. Khẳng định:

1. `PH1` đọc `profiles/attempts/skill_mastery/gamification_state/submissions` của `HS_X` → **có dòng**.
2. `PH1` đọc dữ liệu `HS_Y` (không liên kết) → **0 dòng**.
3. `PH2` đọc dữ liệu `HS_X` → **0 dòng**.
4. `PH1` UPDATE/DELETE bất kỳ bảng dữ liệu của `HS_X` → **bị chặn** (0 dòng ảnh hưởng).
5. `link_parent_by_code`: mã sai → lỗi; mã của chính `PH1` (nếu có) → `cannot_link_self`; mã `HS_X` đúng → liên kết.
6. `HS_X` thấy liên kết của mình; gỡ được; `HS_Y` không thấy liên kết của `HS_X`.
