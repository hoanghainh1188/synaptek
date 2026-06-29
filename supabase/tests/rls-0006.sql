-- Bộ test RLS cho 0006 — bài tại nhà (PH→con). GATE: chỉ PH của con mới giao được; cô lập đọc/ghi.
-- Chạy: docker exec -i supabase_db_<proj> psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/rls-0006.sql

\set ON_ERROR_STOP on

delete from auth.users where id in (
  'cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002',
  'dddddddd-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000002');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000001','authenticated','authenticated','ph1@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000002','authenticated','authenticated','ph2@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','dddddddd-0000-0000-0000-000000000001','authenticated','authenticated','hsx@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','dddddddd-0000-0000-0000-000000000002','authenticated','authenticated','hsy@t.local',crypt('x',gen_salt('bf')),now(),now(),now());

update public.profiles set role='parent' where id in
  ('cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002');
update public.profiles set parent_link_code='KIDX01' where id='dddddddd-0000-0000-0000-000000000001';

-- PH1 liên kết HS_X
do $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  perform public.link_parent_by_code('KIDX01');
  reset role;
end $$;

-- Helper: chạy 1 câu dưới danh tính, trả số dòng ảnh hưởng/đếm
create or replace function pg_temp.as_user_count(uid text, q text) returns int language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated; execute q into n; reset role; return n;
end $$;

-- 1. PH1 tạo bài tại nhà cho con HS_X → OK; lấy id.
do $$
declare aid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  insert into public.assignments (title, question_ids, assignee_student_id, owner_parent_id)
  values ('Bài về nhà', array['g4.num.fractions.q001'], 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001')
  returning id into aid;
  reset role;
  if aid is null then raise exception 'FAIL 1: PH1 không tạo được bài cho con'; end if;
  raise notice 'RLS 0006 home-create: OK';
end $$;

-- 2. PH1 KHÔNG tạo được bài cho HS_Y (không phải con) → bị chặn (RLS với check is_parent_of).
do $$
declare ok boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.assignments (title, question_ids, assignee_student_id, owner_parent_id)
    values ('Lén', array['g4.num.fractions.q001'], 'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001');
  exception when others then ok := true; end;
  reset role;
  if not ok then raise exception 'FAIL 2: PH1 giao được bài cho HS không phải con'; end if;
  raise notice 'RLS 0006 home-create-guard: OK';
end $$;

-- 3. Hiển thị: HS_X & PH1 thấy bài; HS_Y & PH2 KHÔNG.
do $$
declare nx int; ny int; np1 int; np2 int;
begin
  nx := pg_temp.as_user_count('dddddddd-0000-0000-0000-000000000001',
    'select count(*) from public.assignments where assignee_student_id=''dddddddd-0000-0000-0000-000000000001''');
  ny := pg_temp.as_user_count('dddddddd-0000-0000-0000-000000000002',
    'select count(*) from public.assignments where assignee_student_id=''dddddddd-0000-0000-0000-000000000001''');
  np1 := pg_temp.as_user_count('cccccccc-0000-0000-0000-000000000001',
    'select count(*) from public.assignments where owner_parent_id=''cccccccc-0000-0000-0000-000000000001''');
  np2 := pg_temp.as_user_count('cccccccc-0000-0000-0000-000000000002',
    'select count(*) from public.assignments where owner_parent_id=''cccccccc-0000-0000-0000-000000000001''');
  if nx <> 1 then raise exception 'FAIL 3a: con không thấy bài được giao (n=%)', nx; end if;
  if ny <> 0 then raise exception 'FAIL 3b: HS_Y thấy bài của HS_X (n=%)', ny; end if;
  if np1 <> 1 then raise exception 'FAIL 3c: PH1 không thấy bài mình giao (n=%)', np1; end if;
  if np2 <> 0 then raise exception 'FAIL 3d: PH2 thấy bài của PH1 (n=%)', np2; end if;
  raise notice 'RLS 0006 home-visibility: OK';
end $$;

-- 4. PH2 KHÔNG sửa/xoá được bài của PH1 (0 dòng); PH1 xoá được.
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  update public.assignments set title='hack' where owner_parent_id='cccccccc-0000-0000-0000-000000000001';
  get diagnostics n = row_count; reset role;
  if n <> 0 then raise exception 'FAIL 4: PH2 sửa được bài PH1 (rows=%)', n; end if;

  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  delete from public.assignments where owner_parent_id='cccccccc-0000-0000-0000-000000000001';
  get diagnostics n = row_count; reset role;
  if n <> 1 then raise exception 'FAIL 4b: PH1 không xoá được bài của mình (rows=%)', n; end if;
  raise notice 'RLS 0006 home-modify-guard: OK';
end $$;

delete from auth.users where id in (
  'cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002',
  'dddddddd-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000002');

select 'RLS 0006: PASS' as result;
