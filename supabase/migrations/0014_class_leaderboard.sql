-- 0014 (TN học sinh): BẢNG XẾP HẠNG LỚP.
-- HS xem top XP của bạn CÙNG LỚP. Giữ gamification_state riêng tư (RLS owner) — chỉ lộ bảng tổng hợp
-- qua hàm SECURITY DEFINER, GATE: người gọi PHẢI là thành viên lớp (is_member). (kiểu D24)
create or replace function public.class_leaderboard(cid uuid)
  returns table (student_id uuid, full_name text, total_xp int)
  language sql stable security definer set search_path = public as $$
  select m.student_id, p.full_name, coalesce(g.total_xp, 0)::int as total_xp
  from public.class_members m
  join public.profiles p on p.id = m.student_id
  left join public.gamification_state g on g.student_id = m.student_id
  where m.class_id = cid and public.is_member(cid)   -- chỉ thành viên lớp mới đọc được
  order by coalesce(g.total_xp, 0) desc, p.full_name asc;
$$;
revoke all on function public.class_leaderboard(uuid) from public;
grant execute on function public.class_leaderboard(uuid) to authenticated;
