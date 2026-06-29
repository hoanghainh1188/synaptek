-- 0016 (môn học): nhãn MÔN cho câu tự soạn — cột subject (key: math/vietnamese/english/science).
-- null = Toán (mặc định, tương thích ngược). RLS dùng lại cq_* (tác giả) — không thêm policy.
alter table public.custom_questions add column if not exists subject text;
