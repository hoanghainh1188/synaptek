// Tóm tắt tuần lớp cho GV — THUẦN, test được (nhận `now`). 7 ngày gần nhất.
export interface ClassWeekly {
  submitted: number; // số lượt nộp trong tuần
  accuracy: number | null; // điểm TB (0..1) các lượt nộp trong tuần; null nếu chưa có
  activeStudents: number; // số HS có nộp trong tuần
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function classWeekly(
  subs: { studentId: string; submittedAt: string | null; displayScore: number | null }[],
  now: number,
): ClassWeekly {
  const recent = subs.filter((s) => {
    if (!s.submittedAt) return false;
    const t = Date.parse(s.submittedAt);
    return Number.isFinite(t) && now - t <= WEEK_MS && now - t >= 0;
  });
  const scored = recent.map((s) => s.displayScore).filter((v): v is number => v != null);
  const accuracy = scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  return {
    submitted: recent.length,
    accuracy,
    activeStudents: new Set(recent.map((s) => s.studentId)).size,
  };
}
