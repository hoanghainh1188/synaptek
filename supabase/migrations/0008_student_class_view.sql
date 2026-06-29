-- Synaptek — HS xem lớp đang tham gia: đọc TÊN giáo viên của lớp mình + đếm SĨ SỐ (read-only).
-- Bổ sung RLS tối thiểu (D24 pattern, SECURITY DEFINER). M1–M4 (0001–0007) KHÔNG đổi.

-- HS có học GV `tid` không? (để đọc tên GV của lớp mình — không lộ GV khác).
create or replace function public.is_my_teacher(tid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.classes c
    join public.class_members m on m.class_id = c.id
    where c.owner_teacher_id = tid and m.student_id = auth.uid()
  );
$$;
revoke all on function public.is_my_teacher(uuid) from public;
grant execute on function public.is_my_teacher(uuid) to authenticated;

-- HS đọc profile (tên) của GV đang dạy mình. (Chiều GV→HS đã có ở 0003: profiles_select_taught.)
create policy profiles_select_teacher on public.profiles for select
  using (public.is_my_teacher(id));

-- Sĩ số lớp (chỉ trả COUNT cho thành viên/GV của lớp — KHÔNG lộ danh sách id thành viên).
create or replace function public.class_member_count(cid uuid)
  returns int language sql stable security definer set search_path = public as $$
  select case
    when public.is_member(cid) or public.owns_class(cid)
    then (select count(*)::int from public.class_members where class_id = cid)
    else 0
  end;
$$;
revoke all on function public.class_member_count(uuid) from public;
grant execute on function public.class_member_count(uuid) to authenticated;
