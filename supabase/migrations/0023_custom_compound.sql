-- 0023 (loại câu): cho phép loại 'compound' (câu nhiều phần a/b/c) ở custom_questions.
-- choices = mảng JSON, mỗi phần tử là spec HIỂN THỊ 1 phần {type,prompt,choices} (HS thấy).
-- correct = JSON mảng đáp án ẨN từng phần {type,correct,options} cùng thứ tự (server chấm qua gradeCompound).
alter table public.custom_questions drop constraint if exists custom_questions_type_check;
alter table public.custom_questions
  add constraint custom_questions_type_check
  check (type in ('mcq','numeric','fraction','true-false','expression','fill-blank','multi','ordering','matching','derivation','compound'));
