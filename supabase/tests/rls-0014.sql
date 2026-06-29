-- Bộ test RLS cho 0014 — bảng xếp hạng lớp. GATE: chỉ thành viên đọc được; xếp theo XP giảm dần.
\set ON_ERROR_STOP on

delete from auth.users where id in (
  'aaaa0014-0000-0000-0000-000000000001',
  'bbbb0014-0000-0000-0000-000000000001','bbbb0014-0000-0000-0000-000000000002',
  'cccc0014-0000-0000-0000-000000000001');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','aaaa0014-0000-0000-0000-000000000001','authenticated','authenticated','gvl@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbb0014-0000-0000-0000-000000000001','authenticated','authenticated','hsa@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbb0014-0000-0000-0000-000000000002','authenticated','authenticated','hsb@t.local',crypt('x',gen_salt('bf')),now(),now(),now()),
  ('00000000-0000-0000-0000-000000000000','cccc0014-0000-0000-0000-000000000001','authenticated','authenticated','out@t.local',crypt('x',gen_salt('bf')),now(),now(),now());
update public.profiles set role='teacher', full_name='Cô L' where id='aaaa0014-0000-0000-0000-000000000001';
update public.profiles set full_name='An' where id='bbbb0014-0000-0000-0000-000000000001';
update public.profiles set full_name='Bình' where id='bbbb0014-0000-0000-0000-000000000002';

-- Lớp có An (30 XP) + Bình (50 XP); 'out' không trong lớp.
do $$
declare c uuid;
begin
  insert into public.classes (id, owner_teacher_id, name, invite_code)
  values (gen_random_uuid(),'aaaa0014-0000-0000-0000-000000000001','Lớp L','LDR014') returning id into c;
  insert into public.class_members (class_id, student_id) values
    (c,'bbbb0014-0000-0000-0000-000000000001'),
    (c,'bbbb0014-0000-0000-0000-000000000002');
  insert into public.gamification_state (student_id, total_xp) values
    ('bbbb0014-0000-0000-0000-000000000001', 30),
    ('bbbb0014-0000-0000-0000-000000000002', 50);
  perform set_config('app.c', c::text, false);
end $$;

-- 1. Thành viên (An) đọc được 2 hàng, Bình (50) đứng trước An (30).
do $$
declare c uuid := current_setting('app.c')::uuid; r record; rows text := ''; n int := 0;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','bbbb0014-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  for r in select * from public.class_leaderboard(c) loop
    n := n + 1; rows := rows || r.full_name || '=' || r.total_xp || ';';
  end loop;
  reset role;
  if n <> 2 then raise exception 'FAIL 1a: thành viên phải thấy 2 hàng (n=%)', n; end if;
  if rows <> 'Bình=50;An=30;' then raise exception 'FAIL 1b: thứ tự/điểm sai (%)', rows; end if;
  raise notice 'RLS 0014 member-sees-ranked: OK';
end $$;

-- 2. Người NGOÀI lớp → 0 hàng (gate is_member).
do $$
declare c uuid := current_setting('app.c')::uuid; n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','cccc0014-0000-0000-0000-000000000001','role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.class_leaderboard(c);
  reset role;
  if n <> 0 then raise exception 'FAIL 2: người ngoài đọc được BXH (n=%)', n; end if;
  raise notice 'RLS 0014 outsider-blocked: OK';
end $$;

delete from auth.users where id in (
  'aaaa0014-0000-0000-0000-000000000001',
  'bbbb0014-0000-0000-0000-000000000001','bbbb0014-0000-0000-0000-000000000002',
  'cccc0014-0000-0000-0000-000000000001');

select 'RLS 0014: PASS' as result;
