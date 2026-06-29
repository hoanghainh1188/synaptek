-- 0015 (TN học sinh): AVATAR mở khoá theo XP — cột chọn avatar trên profile (key emoji, vd 'dragon').
-- RLS: dùng lại profiles_update_own (tự sửa hồ sơ mình) — không thêm policy.
alter table public.profiles add column if not exists avatar text;
