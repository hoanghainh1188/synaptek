-- 0025 (D52): XÓA TÀI KHOẢN — soft delete. Cột đánh dấu THỜI ĐIỂM tự xóa (audit/tương lai lọc khỏi
-- roster/leaderboard nếu cần) — việc xóa THẬT (vô hiệu hoá đăng nhập) làm qua
-- supabase.auth.admin.deleteUser(id, true) trong Edge Function delete-account (cần service-role,
-- KHÔNG thể gọi từ client — xem D52).
alter table public.profiles add column if not exists deleted_at timestamptz;

-- service_role KHÔNG tự bypass GRANT bảng (chỉ bypass RLS) — project này grant tường minh từng bảng
-- cho service_role (xem D21/0002, 0003, 0007). Edge delete-account cần đọc role/lớp sở hữu + ghi
-- deleted_at. class_members đã grant sẵn ở 0003.
grant select, update on public.profiles to service_role;
grant select on public.classes to service_role;
