-- Bộ test cho 0026 — GATE: học sinh KHÔNG tự đổi được vai trò (chống leo thang quyền).
-- Chạy: docker exec -i supabase_db_<proj> psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < supabase/tests/rls-0026.sql
-- Seed bằng quyền postgres (auth.uid() null → trigger bỏ qua). Kiểm bằng giả lập auth.uid() từng user.

\set ON_ERROR_STOP on

-- ── Dọn lần trước ──────────────────────────────────────────────────────────────
delete from auth.users where id in (
  'eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002');

-- ── Seed: HS (student), GV (teacher) ───────────────────────────────────────────
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','eeeeeeee-0000-0000-0000-000000000001','authenticated','authenticated','hs26@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','eeeeeeee-0000-0000-0000-000000000002','authenticated','authenticated','gv26@t.local',crypt('x',gen_salt('bf')),now(),now(),now());
-- profile auto tạo mặc định 'student' (handle_new_user). Đặt GV = teacher bằng postgres (trigger bỏ qua).
update public.profiles set role='teacher' where id='eeeeeeee-0000-0000-0000-000000000002';

-- ── Test 1: HS tự đổi lên teacher → BỊ CHẶN ────────────────────────────────────
do $$
declare ok boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','eeeeeeee-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  begin
    update public.profiles set role='teacher' where id='eeeeeeee-0000-0000-0000-000000000001';
  exception when others then ok := true;
  end;
  reset role;
  if not ok then raise exception 'FAIL 1: học sinh TỰ đổi được vai trò lên teacher (leo thang quyền)'; end if;
  raise notice 'RLS 0026 student-cannot-escalate: OK';
end $$;

-- ── Test 2: HS vẫn là student (không bị đổi) ───────────────────────────────────
do $$
declare r text;
begin
  select role into r from public.profiles where id='eeeeeeee-0000-0000-0000-000000000001';
  if r <> 'student' then raise exception 'FAIL 2: vai trò HS đã bị đổi (role=%)', r; end if;
  raise notice 'RLS 0026 student-role-intact: OK';
end $$;

-- ── Test 3: GV đổi sang parent → CHO PHÉP ──────────────────────────────────────
do $$
declare r text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','eeeeeeee-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  update public.profiles set role='parent' where id='eeeeeeee-0000-0000-0000-000000000002';
  reset role;
  select role into r from public.profiles where id='eeeeeeee-0000-0000-0000-000000000002';
  if r <> 'parent' then raise exception 'FAIL 3: GV không đổi được sang parent (role=%)', r; end if;
  raise notice 'RLS 0026 teacher-to-parent: OK';
end $$;

-- ── Test 4: GV/PH tự hạ xuống student → BỊ CHẶN ────────────────────────────────
do $$
declare ok boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','eeeeeeee-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  begin
    update public.profiles set role='student' where id='eeeeeeee-0000-0000-0000-000000000002';
  exception when others then ok := true;
  end;
  reset role;
  if not ok then raise exception 'FAIL 4: người lớn tự hạ được xuống student (footgun)'; end if;
  raise notice 'RLS 0026 no-demote-to-student: OK';
end $$;

-- ── Test 5: admin (postgres, auth.uid null) sửa được role HS → hỗ trợ ─────────
do $$
declare r text;
begin
  update public.profiles set role='teacher' where id='eeeeeeee-0000-0000-0000-000000000001';
  select role into r from public.profiles where id='eeeeeeee-0000-0000-0000-000000000001';
  if r <> 'teacher' then raise exception 'FAIL 5: admin không sửa được role (role=%)', r; end if;
  update public.profiles set role='student' where id='eeeeeeee-0000-0000-0000-000000000001'; -- trả lại
  raise notice 'RLS 0026 admin-can-fix: OK';
end $$;

-- ── Dọn ────────────────────────────────────────────────────────────────────────
delete from auth.users where id in (
  'eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002');

select 'RLS 0026 ALL PASS' as result;
