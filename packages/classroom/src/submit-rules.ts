// Luật giới hạn nộp bài (hạn nộp · số lần · thời gian làm). TS thuần, tất định.
// DÙNG CHUNG: client (khoá nút + thông báo) + Edge `grade-assignment` (ENFORCE — D4). Server là nguồn đáng tin.

/** Cho phép trễ một chút khi auto-submit lúc hết giờ (đồng hồ client/server lệch). */
const TIMER_GRACE_MS = 15_000;

export interface SubmitRules {
  dueAt: number | null; // epoch ms; null = không hạn
  allowLate: boolean; // true = cho nộp sau hạn (đánh dấu trễ); false = chặn sau hạn
  maxAttempts: number | null; // null = không giới hạn
  timeLimitMinutes: number | null; // null = không có đồng hồ
}

export interface SubmitState {
  attemptCount: number; // số lần đã nộp
  startedAt: number | null; // epoch ms bắt đầu làm (cho timer); null = chưa bắt đầu
}

export type SubmitBlock = "past_due" | "no_attempts_left" | "time_expired";

export interface SubmitDecision {
  allowed: boolean;
  reason?: SubmitBlock;
}

/** Có được nộp không? Thứ tự kiểm: hạn nộp → số lần → thời gian. (Server gọi để CHẶN; client để khoá nút.) */
export function checkSubmitAllowed(
  rules: SubmitRules,
  state: SubmitState,
  now: number,
): SubmitDecision {
  if (!rules.allowLate && rules.dueAt !== null && now > rules.dueAt) {
    return { allowed: false, reason: "past_due" };
  }
  if (rules.maxAttempts !== null && state.attemptCount >= rules.maxAttempts) {
    return { allowed: false, reason: "no_attempts_left" };
  }
  if (
    rules.timeLimitMinutes !== null &&
    state.startedAt !== null &&
    now > state.startedAt + rules.timeLimitMinutes * 60_000 + TIMER_GRACE_MS
  ) {
    return { allowed: false, reason: "time_expired" };
  }
  return { allowed: true };
}
