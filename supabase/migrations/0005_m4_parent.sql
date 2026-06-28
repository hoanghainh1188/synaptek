-- Synaptek M4 — Phụ huynh: liên kết PH–con + theo dõi (read-only). Mirror M3 (helper SECURITY DEFINER, D24/D26).
-- PH KHÔNG có quyền ghi chéo (chỉ thêm policy SELECT). M1–M4limits (0001–0004) KHÔNG đổi.

-- ── profiles.parent_link_code (HS đặt; PH nhập) ──────────────────────────────
alter table public.profiles
  add column if not exists parent_link_code text unique;

-- ── parent_links (PH × con, nhiều–nhiều) ─────────────────────────────────────
create table public.parent_links (
  parent_id  uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  linked_at  timestamptz not null default now(),
  primary key (parent_id, student_id),
  check (parent_id <> student_id)            -- không tự liên kết
);
create index on public.parent_links (student_id);

-- ── Helper SECURITY DEFINER (chống đệ quy RLS — D24/D26) ──────────────────────
create or replace function public.is_parent_of(sid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_links pl where pl.student_id = sid and pl.parent_id = auth.uid()
  );
$$;
revoke all on function public.is_parent_of(uuid) from public;
grant execute on function public.is_parent_of(uuid) to authenticated;

-- Chiều ngược: HS có liên kết với PH `pid`? (để HS đọc TÊN phụ huynh đang theo dõi — FR-004)
create or replace function public.is_linked_parent(pid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_links pl where pl.parent_id = pid and pl.student_id = auth.uid()
  );
$$;
revoke all on function public.is_linked_parent(uuid) from public;
grant execute on function public.is_linked_parent(uuid) to authenticated;

-- ── RPC liên kết (con tạo mã → PH nhập; không lộ profiles, chống tự-liên-kết) ──
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

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.parent_links enable row level security;

-- parent_links: PH thấy/gỡ liên kết của mình; HS thấy/gỡ PH của mình. (INSERT qua RPC.)
create policy plinks_select on public.parent_links for select
  using (parent_id = auth.uid() or student_id = auth.uid());
create policy plinks_delete on public.parent_links for delete
  using (parent_id = auth.uid() or student_id = auth.uid());

-- PH đọc dữ liệu con đã liên kết — CHỈ SELECT (read-only). OR với policy "của mình" sẵn có.
create policy profiles_select_child on public.profiles for select
  using (public.is_parent_of(id));
-- HS đọc TÊN của PH đang theo dõi mình (chỉ profile, read-only).
create policy profiles_select_parent on public.profiles for select
  using (public.is_linked_parent(id));
create policy attempts_select_child on public.attempts for select
  using (public.is_parent_of(student_id));
create policy mastery_select_child on public.skill_mastery for select
  using (public.is_parent_of(student_id));
create policy gami_select_child on public.gamification_state for select
  using (public.is_parent_of(student_id));
create policy submissions_select_child on public.submissions for select
  using (public.is_parent_of(student_id));

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select, delete on public.parent_links to authenticated;  -- insert qua RPC

-- ── Vai trò lúc đăng ký: mở rộng nhận 'parent' (D26) ─────────────────────────
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case
      when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'
      when new.raw_user_meta_data ->> 'role' = 'parent' then 'parent'
      else 'student'
    end
  );
  return new;
end; $$;
