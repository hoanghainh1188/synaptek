-- 0026: KHOÁ vai trò HỌC SINH — vai trò 'student' cố định từ lúc đăng ký (handle_new_user set theo
-- metadata lúc INSERT, 0005). Trước đây role tự-chọn (D22): client `useSetRole` update thẳng
-- profiles.role, mà RLS `profiles_update_own` cho user ghi hàng của mình GỒM cột role → BẤT KỲ user nào
-- (kể cả học sinh) tự đổi vai trò được qua API. Học sinh là TRẺ EM → không nên tự "leo" lên GV/PH (leo
-- thang quyền). Ẩn UI KHÔNG đủ (API vẫn mở) → chặn ở DB.
--
-- Bất biến: KHÔNG cho CHÍNH CHỦ tự đổi TO hoặc FROM 'student' (student cố định; cũng chống GV/PH lỡ hạ
-- xuống student rồi kẹt). GV <-> PH vẫn đổi được. Chỉ áp cho chính chủ (auth.uid() = id); service_role/
-- admin (auth.uid() null, vd hỗ trợ sửa role, seed test bằng postgres) KHÔNG bị chặn.
create or replace function public.guard_student_role()
  returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() = old.id
     and (old.role = 'student' or new.role = 'student') then
    raise exception 'Không thể tự đổi vai trò học sinh' using errcode = 'check_violation';
  end if;
  return new;
end; $$;

drop trigger if exists profiles_guard_student_role on public.profiles;
create trigger profiles_guard_student_role
  before update on public.profiles
  for each row execute function public.guard_student_role();
