-- Bộ test RLS cho 0003 (M3) — GATE bảo mật chéo vai trò (SC-002/007).
-- Chạy local: docker exec -i supabase_db_<proj> psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < supabase/tests/rls-0003.sql
-- (hoặc qua npm script). Seed bằng quyền postgres (bỏ qua RLS); kiểm bằng cách giả lập auth.uid() của từng user.
-- Mọi mệnh đề sai → RAISE EXCEPTION (script thoát != 0). In "RLS 0003: PASS" nếu qua hết.

\set ON_ERROR_STOP on

-- ── Dọn lần trước (idempotent) ────────────────────────────────────────────────
delete from auth.users where id in (
  'aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002');

-- ── Seed: 2 GV + 2 HS (profiles auto qua trigger 0001), 2 lớp chéo, bài + bài nộp ──
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','aaaaaaaa-0000-0000-0000-000000000001','authenticated','authenticated','gv1@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','aaaaaaaa-0000-0000-0000-000000000002','authenticated','authenticated','gv2@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbbbbbb-0000-0000-0000-000000000001','authenticated','authenticated','hsa@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbbbbbb-0000-0000-0000-000000000002','authenticated','authenticated','hsb@t.local',crypt('x',gen_salt('bf')),now(),now(),now());

update public.profiles set role = 'teacher' where id in
  ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002');

insert into public.classes (id, owner_teacher_id, name, invite_code) values
  ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Lớp GV1','CODE111'),
  ('cccccccc-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','Lớp GV2','CODE222');

insert into public.class_members (class_id, student_id) values
  ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001'),  -- HS_A ∈ lớp GV1
  ('cccccccc-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002');  -- HS_B ∈ lớp GV2

insert into public.assignments (id, class_id, title, question_ids) values
  ('dddddddd-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','Bài GV1', array['q1']),
  ('dddddddd-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000002','Bài GV2', array['q1']);

insert into public.submissions (id, assignment_id, student_id, answers, auto_score) values
  ('eeeeeeee-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','{}'::jsonb, 0.5),
  ('eeeeeeee-0000-0000-0000-000000000002','dddddddd-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','{}'::jsonb, 0.5);

-- ── Helper kiểm: chạy 1 query đếm dưới danh tính `uid`, so kỳ vọng ───────────────
create or replace function pg_temp.as_user_count(uid text, q text)
  returns int language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated;
  execute q into n;
  reset role;
  return n;
end $$;

do $$
declare
  gv1 text := 'aaaaaaaa-0000-0000-0000-000000000001';
  gv2 text := 'aaaaaaaa-0000-0000-0000-000000000002';
  hsa text := 'bbbbbbbb-0000-0000-0000-000000000001';
  hsb text := 'bbbbbbbb-0000-0000-0000-000000000002';
  n int;
begin
  -- 1. HS_A KHÔNG thấy lớp GV2
  n := pg_temp.as_user_count(hsa, 'select count(*) from public.classes where id=''cccccccc-0000-0000-0000-000000000002''');
  if n <> 0 then raise exception 'FAIL 1: HS_A thấy lớp GV2 (n=%)', n; end if;

  -- 1b. HS_A THẤY lớp mình (GV1) — sanity
  n := pg_temp.as_user_count(hsa, 'select count(*) from public.classes where id=''cccccccc-0000-0000-0000-000000000001''');
  if n <> 1 then raise exception 'FAIL 1b: HS_A KHÔNG thấy lớp mình (n=%)', n; end if;

  -- 2. HS_A KHÔNG thấy submission của HS_B
  n := pg_temp.as_user_count(hsa, 'select count(*) from public.submissions where student_id=''bbbbbbbb-0000-0000-0000-000000000002''');
  if n <> 0 then raise exception 'FAIL 2: HS_A thấy submission HS_B (n=%)', n; end if;

  -- 3. GV2 KHÔNG thấy assignment lớp GV1
  n := pg_temp.as_user_count(gv2, 'select count(*) from public.assignments where class_id=''cccccccc-0000-0000-0000-000000000001''');
  if n <> 0 then raise exception 'FAIL 3: GV2 thấy assignment lớp GV1 (n=%)', n; end if;

  -- 3b. GV1 THẤY submission trong lớp mình (HS_A) — sanity
  n := pg_temp.as_user_count(gv1, 'select count(*) from public.submissions where id=''eeeeeeee-0000-0000-0000-000000000001''');
  if n <> 1 then raise exception 'FAIL 3b: GV1 KHÔNG thấy submission lớp mình (n=%)', n; end if;

  -- 4. GV2 KHÔNG thấy submission lớp GV1
  n := pg_temp.as_user_count(gv2, 'select count(*) from public.submissions where id=''eeeeeeee-0000-0000-0000-000000000001''');
  if n <> 0 then raise exception 'FAIL 4: GV2 thấy submission lớp GV1 (n=%)', n; end if;

  raise notice 'RLS 0003 SELECT-isolation: OK';
end $$;

-- 5. GV2 KHÔNG update được submission lớp GV1 (UPDATE bị RLS lọc → 0 dòng)
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','aaaaaaaa-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  update public.submissions set feedback='hack' where id='eeeeeeee-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  reset role;
  if n <> 0 then raise exception 'FAIL 5: GV2 update submission lớp GV1 (rows=%)', n; end if;
  raise notice 'RLS 0003 teacher-update-isolation: OK';
end $$;

-- 6. HS KHÔNG ghi trực tiếp submissions (nộp đi qua Edge service_role) → insert bị chặn (no grant)
do $$
declare ok boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.submissions (assignment_id, student_id, answers)
      values ('dddddddd-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','{}'::jsonb);
  exception when others then ok := true;  -- bị chặn (không có quyền INSERT)
  end;
  reset role;
  if not ok then raise exception 'FAIL 6: HS insert submission trực tiếp không bị chặn'; end if;
  raise notice 'RLS 0003 student-no-direct-write: OK';
end $$;

-- 7. join_class_by_code: mã sai → lỗi; mã đúng → HS_B (chưa ở lớp GV1) vào được
do $$
declare ok boolean := false; cid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  begin perform public.join_class_by_code('SAI___'); exception when others then ok := true; end;
  if not ok then reset role; raise exception 'FAIL 7a: mã sai không báo lỗi'; end if;
  select public.join_class_by_code('CODE111') into cid;  -- HS_B vào lớp GV1
  reset role;
  if cid <> 'cccccccc-0000-0000-0000-000000000001' then raise exception 'FAIL 7b: join mã đúng sai class (%).', cid; end if;
  raise notice 'RLS 0003 join_class_by_code: OK';
end $$;

-- 8. HS_A KHÔNG tự đặt auto_score (cột bị revoke update khỏi authenticated)
do $$
declare ok boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  begin
    update public.submissions set auto_score=1 where id='eeeeeeee-0000-0000-0000-000000000001';
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  if not ok then raise exception 'FAIL 8: HS_A tự đặt auto_score không bị chặn'; end if;
  raise notice 'RLS 0003 auto_score-column-guard: OK';
end $$;

-- 9. GV1 GHI ĐÈ được final_score/feedback của submission lớp mình (sanity — 1 dòng)
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','aaaaaaaa-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  update public.submissions set final_score=0.9, feedback='Tốt', is_override=true
    where id='eeeeeeee-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  reset role;
  if n <> 1 then raise exception 'FAIL 9: GV1 KHÔNG ghi đè được submission lớp mình (rows=%)', n; end if;
  raise notice 'RLS 0003 teacher-override: OK';
end $$;

-- 10. HS_A KHÔNG tự đặt final_score của mình (không có policy UPDATE cho HS → 0 dòng)
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  update public.submissions set final_score=1 where id='eeeeeeee-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  reset role;
  if n <> 0 then raise exception 'FAIL 10: HS_A tự đặt final_score (rows=%)', n; end if;
  raise notice 'RLS 0003 student-cannot-set-final: OK';
end $$;

-- 11. GV1 ĐỌC được profile HS_A (HS mình dạy — cho roster); GV2 thì KHÔNG.
do $$
declare n1 int; n2 int;
begin
  n1 := pg_temp.as_user_count('aaaaaaaa-0000-0000-0000-000000000001',
    'select count(*) from public.profiles where id=''bbbbbbbb-0000-0000-0000-000000000001''');
  n2 := pg_temp.as_user_count('aaaaaaaa-0000-0000-0000-000000000002',
    'select count(*) from public.profiles where id=''bbbbbbbb-0000-0000-0000-000000000001''');
  if n1 <> 1 then raise exception 'FAIL 11a: GV1 KHÔNG đọc được profile HS mình dạy (n=%)', n1; end if;
  if n2 <> 0 then raise exception 'FAIL 11b: GV2 đọc được profile HS không dạy (n=%)', n2; end if;
  raise notice 'RLS 0003 teacher-reads-taught-profile: OK';
end $$;

-- ── Dọn ──────────────────────────────────────────────────────────────────────
delete from auth.users where id in (
  'aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002');

select 'RLS 0003: PASS' as result;
