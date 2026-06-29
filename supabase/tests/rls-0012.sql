-- Bộ test RLS cho 0012 — giao bài cho HS cụ thể. GATE cô lập.
-- Bài KHÔNG target → cả lớp thấy; bài CÓ target → chỉ HS được nhắm thấy.
\set ON_ERROR_STOP on

delete from auth.users where id in (
  'aaaa0012-0000-0000-0000-000000000001',
  'bbbb0012-0000-0000-0000-000000000001','bbbb0012-0000-0000-0000-000000000002');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','aaaa0012-0000-0000-0000-000000000001','authenticated','authenticated','gvt@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbb0012-0000-0000-0000-000000000001','authenticated','authenticated','hsa@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbb0012-0000-0000-0000-000000000002','authenticated','authenticated','hsb@t.local',crypt('x',gen_salt('bf')),now(),now(),now());
update public.profiles set role='teacher', full_name='Cô T' where id='aaaa0012-0000-0000-0000-000000000001';

-- Lớp có HS_A + HS_B. Bài 1: cả lớp (không target). Bài 2: chỉ HS_A (có target).
do $$
declare c uuid; a1 uuid; a2 uuid;
begin
  insert into public.classes (id, owner_teacher_id, name, invite_code)
  values (gen_random_uuid(),'aaaa0012-0000-0000-0000-000000000001','Lớp T','TGT012') returning id into c;
  insert into public.class_members (class_id, student_id) values
    (c,'bbbb0012-0000-0000-0000-000000000001'),
    (c,'bbbb0012-0000-0000-0000-000000000002');
  insert into public.assignments (id, class_id, title, question_ids)
  values (gen_random_uuid(), c, 'Cả lớp', array['q1']) returning id into a1;
  insert into public.assignments (id, class_id, title, question_ids)
  values (gen_random_uuid(), c, 'Chỉ A', array['q1']) returning id into a2;
  insert into public.assignment_targets (assignment_id, student_id)
  values (a2, 'bbbb0012-0000-0000-0000-000000000001'); -- chỉ HS_A
  perform set_config('app.a1', a1::text, false);
  perform set_config('app.a2', a2::text, false);
end $$;

create or replace function pg_temp.cnt(uid text, q text) returns int language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated; execute q into n; reset role; return n;
end $$;

-- 1. Bài "cả lớp": cả HS_A lẫn HS_B đều thấy.
do $$
declare a1 uuid := current_setting('app.a1')::uuid; na int; nb int;
begin
  na := pg_temp.cnt('bbbb0012-0000-0000-0000-000000000001','select count(*) from public.assignments where id='''||a1||'''');
  nb := pg_temp.cnt('bbbb0012-0000-0000-0000-000000000002','select count(*) from public.assignments where id='''||a1||'''');
  if na <> 1 or nb <> 1 then raise exception 'FAIL 1: bài cả lớp phải hiện cho cả hai (a=%, b=%)', na, nb; end if;
  raise notice 'RLS 0012 whole-class: OK';
end $$;

-- 2. Bài "chỉ A": HS_A thấy, HS_B KHÔNG thấy.
do $$
declare a2 uuid := current_setting('app.a2')::uuid; na int; nb int;
begin
  na := pg_temp.cnt('bbbb0012-0000-0000-0000-000000000001','select count(*) from public.assignments where id='''||a2||'''');
  nb := pg_temp.cnt('bbbb0012-0000-0000-0000-000000000002','select count(*) from public.assignments where id='''||a2||'''');
  if na <> 1 then raise exception 'FAIL 2a: HS được nhắm không thấy bài (n=%)', na; end if;
  if nb <> 0 then raise exception 'FAIL 2b: HS KHÔNG được nhắm vẫn thấy bài (n=%)', nb; end if;
  raise notice 'RLS 0012 targeted: OK';
end $$;

delete from auth.users where id in (
  'aaaa0012-0000-0000-0000-000000000001',
  'bbbb0012-0000-0000-0000-000000000001','bbbb0012-0000-0000-0000-000000000002');

select 'RLS 0012: PASS' as result;
