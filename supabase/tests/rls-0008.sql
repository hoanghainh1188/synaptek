-- Bộ test RLS cho 0008 — HS đọc tên GV của lớp mình + đếm sĩ số. GATE cô lập.
\set ON_ERROR_STOP on

delete from auth.users where id in (
  'eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002',
  'ffffffff-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000002');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','eeeeeeee-0000-0000-0000-000000000001','authenticated','authenticated','gv1@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','eeeeeeee-0000-0000-0000-000000000002','authenticated','authenticated','gv2@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','ffffffff-0000-0000-0000-000000000001','authenticated','authenticated','hsa@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','ffffffff-0000-0000-0000-000000000002','authenticated','authenticated','hsb@t.local',crypt('x',gen_salt('bf')),now(),now(),now());
update public.profiles set role='teacher', full_name='Cô Giáo 1' where id='eeeeeeee-0000-0000-0000-000000000001';
update public.profiles set role='teacher', full_name='Thầy Giáo 2' where id='eeeeeeee-0000-0000-0000-000000000002';

-- GV1 lớp có HS_A + HS_B (sĩ số 2); GV2 lớp riêng không liên quan.
do $$
declare c1 uuid;
begin
  insert into public.classes (id, owner_teacher_id, name, invite_code)
  values (gen_random_uuid(),'eeeeeeee-0000-0000-0000-000000000001','Lớp 1','CODE01') returning id into c1;
  insert into public.class_members (class_id, student_id) values
    (c1,'ffffffff-0000-0000-0000-000000000001'),
    (c1,'ffffffff-0000-0000-0000-000000000002');
  perform set_config('app.c1', c1::text, false);
end $$;

create or replace function pg_temp.as_user_count(uid text, q text) returns int language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated; execute q into n; reset role; return n;
end $$;

-- 1. HS_A đọc được tên GV1 (GV của lớp mình); KHÔNG đọc được GV2.
do $$
declare n1 int; n2 int;
begin
  n1 := pg_temp.as_user_count('ffffffff-0000-0000-0000-000000000001',
    'select count(*) from public.profiles where id=''eeeeeeee-0000-0000-0000-000000000001''');
  n2 := pg_temp.as_user_count('ffffffff-0000-0000-0000-000000000001',
    'select count(*) from public.profiles where id=''eeeeeeee-0000-0000-0000-000000000002''');
  if n1 <> 1 then raise exception 'FAIL 1a: HS không đọc được tên GV lớp mình (n=%)', n1; end if;
  if n2 <> 0 then raise exception 'FAIL 1b: HS đọc được GV không liên quan (n=%)', n2; end if;
  raise notice 'RLS 0008 read-my-teacher: OK';
end $$;

-- 2. class_member_count: thành viên thấy sĩ số đúng (2); người ngoài → 0.
do $$
declare c1 uuid := current_setting('app.c1')::uuid; n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','ffffffff-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  select public.class_member_count(c1) into n; reset role;
  if n <> 2 then raise exception 'FAIL 2a: sĩ số sai cho thành viên (n=%)', n; end if;

  -- GV2 (không liên quan lớp 1) → 0
  perform set_config('request.jwt.claims', json_build_object('sub','eeeeeeee-0000-0000-0000-000000000002','role','authenticated')::text, true);
  set local role authenticated;
  select public.class_member_count(c1) into n; reset role;
  if n <> 0 then raise exception 'FAIL 2b: người ngoài đọc được sĩ số (n=%)', n; end if;
  raise notice 'RLS 0008 member-count: OK';
end $$;

-- 3. HS_A đọc được class row + assignments của lớp (đã có từ 0003) — xác nhận không hồi quy.
do $$
declare c1 uuid := current_setting('app.c1')::uuid; n int;
begin
  n := pg_temp.as_user_count('ffffffff-0000-0000-0000-000000000001',
    'select count(*) from public.classes where id='''||c1||'''');
  if n <> 1 then raise exception 'FAIL 3: HS không đọc được lớp mình (n=%)', n; end if;
  raise notice 'RLS 0008 read-class: OK';
end $$;

delete from auth.users where id in (
  'eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002',
  'ffffffff-0000-0000-0000-000000000001','ffffffff-0000-0000-0000-000000000002');

select 'RLS 0008: PASS' as result;
