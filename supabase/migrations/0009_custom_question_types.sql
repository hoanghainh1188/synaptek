-- Synaptek — Mở rộng loại câu tự soạn: thêm 'true-false' + 'expression' (engine + AnswerInput đã hỗ trợ).
-- fill-blank để đợt sau (cần lưu đáp án dạng mảng + đếm ô chỗ trống). M1–M4/0007 KHÔNG đổi hành vi.

alter table public.custom_questions drop constraint if exists custom_questions_type_check;
alter table public.custom_questions
  add constraint custom_questions_type_check
  check (type in ('mcq', 'numeric', 'fraction', 'true-false', 'expression'));
