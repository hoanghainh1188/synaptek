-- Synaptek — Câu tự soạn: thêm loại 'fill-blank' (điền chỗ trống). Đáp án nhiều ô lưu dạng JSON trong
-- cột `correct` (text); Edge JSON.parse khi chấm. Số ô suy từ dấu `__` trong prompt (ẩn đáp án với HS — D4).
-- M1–M4/0007/0009 KHÔNG đổi hành vi.

alter table public.custom_questions drop constraint if exists custom_questions_type_check;
alter table public.custom_questions
  add constraint custom_questions_type_check
  check (type in ('mcq', 'numeric', 'fraction', 'true-false', 'expression', 'fill-blank'));
