-- 0018 (loại câu): tùy chọn chấm cho câu tự soạn — cột options jsonb.
-- Vd numeric {"roundTo":2,"tolerance":0.01}; fill-blank {"unordered":true}. null = mặc định.
alter table public.custom_questions add column if not exists options jsonb;
