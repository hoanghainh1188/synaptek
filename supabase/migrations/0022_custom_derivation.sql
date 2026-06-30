-- 0022 (loại câu): cho phép loại 'derivation' (trình bày từng bước) ở custom_questions.
-- correct = JSON spec {mode, variable, target, start} (ẩn, server chấm qua step-grading); choices = [start, mode, variable] (HS thấy).
alter table public.custom_questions drop constraint if exists custom_questions_type_check;
alter table public.custom_questions
  add constraint custom_questions_type_check
  check (type in ('mcq','numeric','fraction','true-false','expression','fill-blank','multi','ordering','matching','derivation'));
