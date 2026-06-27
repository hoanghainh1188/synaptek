// Phân tích lớp (M3 US3). TS thuần, tất định. Chỉ tính trên HS TRONG lớp (SC-005).
import { displayScore } from "./grading-policy.ts";

export interface ClassProgress {
  totalStudents: number;
  submittedCount: number;
  averageScore: number | null; // trung bình điểm hiển thị các bài đã nộp; null nếu chưa ai nộp
}

/** Tiến độ một bài tập trong lớp: chỉ tính bài nộp của HS thuộc `memberIds`. */
export function assignmentProgress(
  memberIds: string[],
  submissions: { studentId: string; autoScore: number | null; finalScore: number | null }[],
): ClassProgress {
  const members = new Set(memberIds);
  const scores: number[] = [];
  for (const s of submissions) {
    if (!members.has(s.studentId)) continue; // bỏ người ngoài lớp
    const d = displayScore(s.autoScore, s.finalScore);
    if (d !== null) scores.push(d);
  }
  return {
    totalStudents: members.size,
    submittedCount: scores.length,
    averageScore: scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0) / scores.length,
  };
}

export interface WeakSkill {
  skillId: string;
  avgMastery: number;
}

/** Điểm yếu chung của lớp: trung bình mastery mỗi kỹ năng theo HS trong lớp, yếu nhất trước. */
export function classWeakSkills(
  masteryByStudent: { studentId: string; mastery: Map<string, number> }[],
  limit?: number,
): WeakSkill[] {
  const sums = new Map<string, { total: number; count: number }>();
  for (const { mastery } of masteryByStudent) {
    for (const [skillId, m] of mastery) {
      const cur = sums.get(skillId) ?? { total: 0, count: 0 };
      cur.total += m;
      cur.count += 1;
      sums.set(skillId, cur);
    }
  }
  const out: WeakSkill[] = [...sums.entries()].map(([skillId, { total, count }]) => ({
    skillId,
    avgMastery: total / count,
  }));
  out.sort((a, b) => a.avgMastery - b.avgMastery); // yếu nhất trước
  return limit !== undefined ? out.slice(0, limit) : out;
}
