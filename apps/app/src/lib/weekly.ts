// Tóm tắt 7 ngày qua cho PH theo dõi con — THUẦN, test được (nhận `now` để tất định).
export interface WeeklyStats {
  practiced: number; // số câu luyện trong 7 ngày
  correct: number;
  accuracy: number | null; // 0..1, null nếu chưa luyện
  submitted: number; // số bài được giao đã nộp trong 7 ngày
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function weeklyStats(
  attempts: { createdAt: string; isCorrect: boolean }[],
  submissions: { submittedAt: string | null }[],
  now: number,
): WeeklyStats {
  const recent = attempts.filter((a) => {
    const t = Date.parse(a.createdAt);
    return Number.isFinite(t) && now - t <= WEEK_MS && now - t >= 0;
  });
  const correct = recent.filter((a) => a.isCorrect).length;
  const submitted = submissions.filter((s) => {
    if (!s.submittedAt) return false;
    const t = Date.parse(s.submittedAt);
    return Number.isFinite(t) && now - t <= WEEK_MS && now - t >= 0;
  }).length;
  return {
    practiced: recent.length,
    correct,
    accuracy: recent.length > 0 ? correct / recent.length : null,
    submitted,
  };
}
