// Quy tắc chấm/nộp bài tập (M3 US2). TS thuần, tất định. Dùng chung client (hiển thị) + edge (chấm).

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Nộp trễ? dueAt null = không hạn → không trễ; trễ khi submittedAt > dueAt (đúng hạn = không trễ). */
export function isLate(submittedAt: number, dueAt: number | null): boolean {
  return dueAt !== null && submittedAt > dueAt;
}

/** Điểm hợp lệ: số hữu hạn trong [0,1] (chặn điểm GV ghi đè sai). */
export function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 1;
}

/** Điểm hiển thị = final ?? auto, clamp [0,1]. null cả hai → null. */
export function displayScore(autoScore: number | null, finalScore: number | null): number | null {
  const v = finalScore ?? autoScore;
  return v === null ? null : clamp01(v);
}

/** Gộp điểm bài = trung bình điểm từng câu. Rỗng → 0. */
export function aggregateScore(perQuestion: { score: number }[]): number {
  if (perQuestion.length === 0) return 0;
  const sum = perQuestion.reduce((s, q) => s + q.score, 0);
  return sum / perQuestion.length;
}
