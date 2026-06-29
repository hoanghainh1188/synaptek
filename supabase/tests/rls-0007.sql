-- Bộ test RLS cho 0007 — câu hỏi tự soạn (authoring). GATE: tác giả cô lập; HS KHÔNG đọc `correct`;
-- hàm cho HS chỉ trả câu ĐÃ ĐƯỢC GIAO (prompt+choices). Chạy với ON_ERROR_STOP.

\set ON_ERROR_STOP on

delete from auth.users where id in (
  'eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002',
  'ffffffff-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000002');

-- GV1, GV2 (teacher) + HS_A, HS_B (student)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','eeeeeeee-0000-0000-0000-000000000001','authenticated','authenticated','gv1@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','eeeeeeee-0000-0000-0000-000000000002','authenticated','authenticated','gv2@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','ffffffff-0000-0000-0000-000000000001','authenticated','authenticated','hsa@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','ffffffff-0000-0000-0000-000000000002','authenticated','authenticated','hsb@t.local',crypt('x',gen_salt('bf')),now(),now(),now());
update public.profiles set role='teacher' where id in
  ('eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002');

create or replace function pg_temp.as_user_count(uid text, q text) returns int language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated; execute q into n; reset role; return n;
end $$;

-- GV1 tạo câu tự soạn (mcq). Lưu id vào bảng tạm.
create temp table _q (id uuid);
do $$
declare qid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','eeeeeeee-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  insert into public.custom_questions (author_id, type, prompt, choices, correct)
  values ('eeeeeeee-0000-0000-0000-000000000001','mcq','2+2=?', array['4','5'], '4')
  returning id into qid;
  reset role;
  insert into _q values (qid);
  raise notice 'RLS 0007 author-create: OK';
end $$;

-- 1. GV1 đọc câu mình (có correct); GV2 KHÔNG đọc được.
do $$
declare n1 int; n2 int;
begin
  n1 := pg_temp.as_user_count('eeeeeeee-0000-0000-0000-000000000001',
    'select count(*) from public.custom_questions where author_id=''eeeeeeee-0000-0000-0000-000000000001''');
  n2 := pg_temp.as_user_count('eeeeeeee-0000-0000-0000-000000000002',
    'select count(*) from public.custom_questions where author_id=''eeeeeeee-0000-0000-0000-000000000001''');
  if n1 <> 1 then raise exception 'FAIL 1a: tác giả không đọc được câu mình (n=%)', n1; end if;
  if n2 <> 0 then raise exception 'FAIL 1b: người khác đọc được câu của GV1 (n=%)', n2; end if;
  raise notice 'RLS 0007 author-isolation: OK';
end $$;

-- 2. HS_A KHÔNG đọc trực tiếp được custom_questions (RLS author-only → 0 dòng, không lộ correct).
do $$
declare n int;
begin
  n := pg_temp.as_user_count('ffffffff-0000-0000-0000-000000000001',
    'select count(*) from public.custom_questions');
  if n <> 0 then raise exception 'FAIL 2: HS đọc trực tiếp được custom_questions (n=%)', n; end if;
  raise notice 'RLS 0007 student-no-direct-read: OK';
end $$;

-- 3. Hàm cho HS: chưa được giao → 0 dòng. Sau khi giao (bài lớp có HS_A) → 1 dòng (KHÔNG có cột correct).
do $$
declare qid uuid; cid uuid; n int;
begin
  select id into qid from _q;
  -- chưa giao
  perform set_config('request.jwt.claims', json_build_object('sub','ffffffff-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.custom_questions_for_student(array[qid]);
  reset role;
  if n <> 0 then raise exception 'FAIL 3a: HS lấy được câu CHƯA giao (n=%)', n; end if;

  -- GV1 tạo lớp + HS_A là thành viên + giao bài chứa qid
  insert into public.classes (id, owner_teacher_id, name, invite_code)
  values (gen_random_uuid(), 'eeeeeeee-0000-0000-0000-000000000001', 'Lớp T', 'TCODE1') returning id into cid;
  insert into public.class_members (class_id, student_id) values (cid, 'ffffffff-0000-0000-0000-000000000001');
  insert into public.assignments (class_id, title, question_ids) values (cid, 'BT', array[qid::text]);

  perform set_config('request.jwt.claims', json_build_object('sub','ffffffff-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.custom_questions_for_student(array[qid]);
  reset role;
  if n <> 1 then raise exception 'FAIL 3b: HS được giao không lấy được câu (n=%)', n; end if;

  -- HS_B (không thuộc lớp) → 0
  perform set_config('request.jwt.claims', json_build_object('sub','ffffffff-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.custom_questions_for_student(array[qid]);
  reset role;
  if n <> 0 then raise exception 'FAIL 3c: HS ngoài lớp lấy được câu (n=%)', n; end if;
  raise notice 'RLS 0007 student-fetch-gate: OK';
end $$;

-- 4. Hàm KHÔNG trả cột `correct` (kiểm cấu trúc trả về).
do $$
declare cnt int;
begin
  select count(*) into cnt from information_schema.routines
    where routine_name='custom_questions_for_student'
      and routine_definition like '%correct%';
  if cnt <> 0 then raise exception 'FAIL 4: hàm cho HS có tham chiếu correct'; end if;
  raise notice 'RLS 0007 no-answer-leak: OK';
end $$;

delete from auth.users where id in (
  'eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002',
  'ffffffff-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000002');

select 'RLS 0007: PASS' as result;
