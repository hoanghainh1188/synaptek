-- Synaptek — Giới hạn nộp bài (hạn cứng · số lần · thời gian làm). Mở rộng M3 (0003). (D25)
-- Enforce ở server: Edge `grade-assignment` dùng checkSubmitAllowed (logic thuần @synaptek/classroom qua _shared).

-- ── assignments: cấu hình giới hạn (GV đặt mỗi bài) ──────────────────────────
alter table public.assignments
  add column if not exists allow_late         boolean not null default true,  -- false = chặn nộp sau hạn
  add column if not exists max_attempts       int check (max_attempts is null or max_attempts >= 1),
  add column if not exists time_limit_minutes int check (time_limit_minutes is null or time_limit_minutes >= 1);

-- ── submissions: theo dõi số lần + mốc bắt đầu (timer) ───────────────────────
alter table public.submissions
  add column if not exists attempt_count int not null default 0,
  add column if not exists started_at    timestamptz;

-- answers cho phép mặc định rỗng để "bắt đầu làm" tạo được dòng trước khi nộp.
alter table public.submissions alter column answers set default '{}'::jsonb;

-- ── RPC bắt đầu làm bài (đặt started_at lần đầu — cho đồng hồ đếm ngược) ──────
-- Security definer: kiểm HS là thành viên lớp của bài; tạo dòng submission rỗng + started_at nếu chưa có.
-- Trả started_at (mốc server, đáng tin) để client hiển thị countdown.
create or replace function public.start_attempt(p_assignment_id uuid)
  returns timestamptz language plpgsql security definer set search_path = public as $$
declare cid uuid; ts timestamptz;
begin
  select class_id into cid from public.assignments where id = p_assignment_id;
  if cid is null then raise exception 'unknown_assignment'; end if;
  if not public.is_member(cid) then raise exception 'not_member'; end if;

  insert into public.submissions (assignment_id, student_id, answers, started_at)
  values (p_assignment_id, auth.uid(), '{}'::jsonb, now())
  on conflict (assignment_id, student_id) do nothing;

  select started_at into ts from public.submissions
   where assignment_id = p_assignment_id and student_id = auth.uid();
  return ts;
end; $$;

revoke all on function public.start_attempt(uuid) from public;
grant execute on function public.start_attempt(uuid) to authenticated;
