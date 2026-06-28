-- Bộ test RLS cho 0005 (M4) — GATE bảo mật PH–con (SC-002/003/004/005).
-- Chạy: docker exec -i supabase_db_<proj> psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < supabase/tests/rls-0005.sql
-- Seed bằng quyền postgres (bỏ qua RLS); kiểm bằng cách giả lập auth.uid() từng user. Sai → RAISE → exit != 0.

\set ON_ERROR_STOP on

-- ── Dọn lần trước ──────────────────────────────────────────────────────────────
delete from auth.users where id in (
  'cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002',
  'dddddddd-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000002');

-- ── Seed: PH1, PH2 (parent) + HS_X, HS_Y (student) ──────────────────────────────
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000001','authenticated','authenticated','ph1@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000002','authenticated','authenticated','ph2@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','dddddddd-0000-0000-0000-000000000001','authenticated','authenticated','hsx@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','dddddddd-0000-0000-0000-000000000002','authenticated','authenticated','hsy@t.local',crypt('x',gen_salt('bf')),now(),now(),now());

update public.profiles set role='parent' where id in
  ('cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002');
-- HS_X có mã liên kết + dữ liệu
update public.profiles set parent_link_code='KIDX01' where id='dddddddd-0000-0000-0000-000000000001';

insert into public.attempts (student_id, question_id, skill_id, answer, is_correct, score) values
  ('dddddddd-0000-0000-0000-000000000001','g4.num.fractions.q001','g4.num.fractions.compare','"1/2"'::jsonb, true, 1);
insert into public.skill_mastery (student_id, skill_id, mastery) values
  ('dddddddd-0000-0000-0000-000000000001','g4.num.fractions.compare', 0.4)
  on conflict (student_id, skill_id) do update set mastery=excluded.mastery;
insert into public.gamification_state (student_id, total_xp, current_streak) values
  ('dddddddd-0000-0000-0000-000000000001', 50, 3)
  on conflict (student_id) do update set total_xp=excluded.total_xp;

-- PH1 liên kết HS_X (qua RPC, dưới danh tính PH1)
do $$
declare sid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  select public.link_parent_by_code('KIDX01') into sid;
  reset role;
  if sid <> 'dddddddd-0000-0000-0000-000000000001' then raise exception 'SEED: link sai student (%).', sid; end if;
end $$;

-- ── Helper kiểm dưới danh tính ──────────────────────────────────────────────────
create or replace function pg_temp.as_user_count(uid text, q text) returns int language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated; execute q into n; reset role; return n;
end $$;

do $$
declare
  ph1 text := 'cccccccc-0000-0000-0000-000000000001';
  ph2 text := 'cccccccc-0000-0000-0000-000000000002';
  hsx text := 'dddddddd-0000-0000-0000-000000000001';
  hsy text := 'dddddddd-0000-0000-0000-000000000002';
  n int;
begin
  -- 1. PH1 ĐỌC dữ liệu con (HS_X)
  n := pg_temp.as_user_count(ph1, 'select count(*) from public.profiles where id='''||hsx||'''');
  if n <> 1 then raise exception 'FAIL 1a: PH1 không đọc được profile con (n=%)', n; end if;
  n := pg_temp.as_user_count(ph1, 'select count(*) from public.attempts where student_id='''||hsx||'''');
  if n < 1 then raise exception 'FAIL 1b: PH1 không đọc được attempts con (n=%)', n; end if;
  n := pg_temp.as_user_count(ph1, 'select count(*) from public.skill_mastery where student_id='''||hsx||'''');
  if n < 1 then raise exception 'FAIL 1c: PH1 không đọc được mastery con (n=%)', n; end if;
  n := pg_temp.as_user_count(ph1, 'select count(*) from public.gamification_state where student_id='''||hsx||'''');
  if n < 1 then raise exception 'FAIL 1d: PH1 không đọc được gamification con (n=%)', n; end if;

  -- 2. PH1 KHÔNG đọc dữ liệu HS_Y (không liên kết)
  n := pg_temp.as_user_count(ph1, 'select count(*) from public.attempts where student_id='''||hsy||'''');
  if n <> 0 then raise exception 'FAIL 2: PH1 đọc được attempts HS không liên kết (n=%)', n; end if;

  -- 3. PH2 KHÔNG đọc dữ liệu HS_X (không phải con PH2)
  n := pg_temp.as_user_count(ph2, 'select count(*) from public.skill_mastery where student_id='''||hsx||'''');
  if n <> 0 then raise exception 'FAIL 3: PH2 đọc được mastery con người khác (n=%)', n; end if;

  raise notice 'RLS 0005 parent-read-isolation: OK';
end $$;

-- 4. PH1 KHÔNG ghi chéo dữ liệu con (read-only) — UPDATE bị RLS lọc → 0 dòng
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  begin
    update public.skill_mastery set mastery=1 where student_id='dddddddd-0000-0000-0000-000000000001';
    get diagnostics n = row_count;
  exception when insufficient_privilege then n := 0;  -- cũng chấp nhận: không có quyền write
  end;
  reset role;
  if n <> 0 then raise exception 'FAIL 4: PH1 ghi đè được mastery con (rows=%)', n; end if;
  raise notice 'RLS 0005 parent-readonly: OK';
end $$;

-- 5. link_parent_by_code: mã sai → lỗi; tự-liên-kết → lỗi
do $$
declare ok boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccccccc-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  begin perform public.link_parent_by_code('SAI___'); exception when others then ok := true; end;
  reset role;
  if not ok then raise exception 'FAIL 5a: mã sai không báo lỗi'; end if;
end $$;
do $$
declare ok boolean := false;
begin
  -- HS_X tự đặt mã của mình rồi tự nhập → cannot_link_self
  perform set_config('request.jwt.claims', json_build_object('sub','dddddddd-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  begin perform public.link_parent_by_code('KIDX01'); exception when others then ok := true; end;
  reset role;
  if not ok then raise exception 'FAIL 5b: tự-liên-kết không bị chặn'; end if;
  raise notice 'RLS 0005 link-guards: OK';
end $$;

-- 6. HS_X thấy liên kết của mình; HS_Y KHÔNG thấy liên kết của HS_X
do $$
declare n1 int; n2 int;
begin
  n1 := pg_temp.as_user_count('dddddddd-0000-0000-0000-000000000001',
    'select count(*) from public.parent_links where student_id=''dddddddd-0000-0000-0000-000000000001''');
  n2 := pg_temp.as_user_count('dddddddd-0000-0000-0000-000000000002',
    'select count(*) from public.parent_links where student_id=''dddddddd-0000-0000-0000-000000000001''');
  if n1 <> 1 then raise exception 'FAIL 6a: HS_X không thấy liên kết của mình (n=%)', n1; end if;
  if n2 <> 0 then raise exception 'FAIL 6b: HS_Y thấy liên kết của HS_X (n=%)', n2; end if;
  raise notice 'RLS 0005 link-visibility: OK';
end $$;

-- 7. HS_X ĐỌC được profile của PH1 (tên PH đang theo dõi — FR-004); HS_Y thì KHÔNG.
do $$
declare n1 int; n2 int;
begin
  n1 := pg_temp.as_user_count('dddddddd-0000-0000-0000-000000000001',
    'select count(*) from public.profiles where id=''cccccccc-0000-0000-0000-000000000001''');
  n2 := pg_temp.as_user_count('dddddddd-0000-0000-0000-000000000002',
    'select count(*) from public.profiles where id=''cccccccc-0000-0000-0000-000000000001''');
  if n1 <> 1 then raise exception 'FAIL 7a: HS_X không đọc được profile PH đang theo dõi (n=%)', n1; end if;
  if n2 <> 0 then raise exception 'FAIL 7b: HS_Y đọc được profile PH không liên quan (n=%)', n2; end if;
  raise notice 'RLS 0005 child-reads-parent-name: OK';
end $$;

-- ── Dọn ──────────────────────────────────────────────────────────────────────
delete from auth.users where id in (
  'cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000002',
  'dddddddd-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000002');

select 'RLS 0005: PASS' as result;
