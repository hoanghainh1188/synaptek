-- 0013 (authoring+): NGẪU NHIÊN HOÁ TỪ POOL.
-- question_ids = "pool"; pool_pick_count = số câu mỗi HS nhận ngẫu nhiên (tất định theo HS).
-- NULL hoặc >= số câu trong pool → giao cả pool (hành vi cũ). Chọn bộ con: client + Edge dùng chung
-- pickForStudent(seed = assignmentId|studentId) → chấm đúng bộ HS đã làm (D4).
alter table public.assignments add column if not exists pool_pick_count int
  check (pool_pick_count is null or pool_pick_count >= 1);
