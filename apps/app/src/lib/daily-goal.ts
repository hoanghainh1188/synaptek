// Mục tiêu hằng ngày — đếm số câu ĐÃ luyện hôm nay (giờ VN) so với mục tiêu. THUẦN, test được.
import { dayKeyVN } from "@synaptek/learning-path";

export const DAILY_GOAL = 10; // số câu mục tiêu mỗi ngày

export interface DailyProgress {
  done: number; // số câu đã luyện hôm nay
  goal: number;
  ratio: number; // 0..1 (chặn ở 1)
  met: boolean; // đã đạt mục tiêu chưa
}

/** Tiến độ hôm nay từ attempts (lọc theo ngày VN của `now`). */
export function dailyProgress(
  attempts: { createdAt?: string }[],
  now: number,
  goal: number = DAILY_GOAL,
): DailyProgress {
  const today = dayKeyVN(now);
  let done = 0;
  for (const a of attempts) {
    if (!a.createdAt) continue;
    const t = Date.parse(a.createdAt);
    if (Number.isFinite(t) && dayKeyVN(t) === today) done++;
  }
  return { done, goal, ratio: goal > 0 ? Math.min(1, done / goal) : 0, met: done >= goal };
}
