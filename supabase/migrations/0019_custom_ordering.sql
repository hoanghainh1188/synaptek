-- 0019 (loại câu): cho phép loại 'ordering' (sắp thứ tự) ở custom_questions.
alter table public.custom_questions drop constraint if exists custom_questions_type_check;
alter table public.custom_questions
  add constraint custom_questions_type_check
  check (type in ('mcq','numeric','fraction','true-false','expression','fill-blank','multi','ordering'));
