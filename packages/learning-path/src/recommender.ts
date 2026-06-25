// Bộ gợi ý "học gì tiếp". TS thuần. Gate: tiên quyết đã đạt ∧ mastery < ngưỡng ∧ có câu hỏi.
import { MASTERED, DEFAULT_BKT } from "./bkt.ts";

export type RecommendReason = "due" | "new" | "weak";

export interface SkillNode {
  id: string;
  prerequisites: string[];
  hasQuestions: boolean;
}

export interface Recommendation {
  skillId: string;
  reason: RecommendReason;
  /** Số nhỏ = ưu tiên cao (đã sắp xếp). */
  priority: number;
}

export interface RecommendOpts {
  /** Thời điểm hiện tại (epoch ms) — so với hạn ôn. */
  now: number;
  /** skillId → hạn ôn (epoch ms). Vắng = chưa lên lịch (kỹ năng mới). */
  dueAt: Map<string, number>;
  /** Giới hạn số kỹ năng trả về. */
  limit?: number;
}

/**
 * Lộ trình kỹ năng nên luyện kế tiếp. KHÔNG BAO GIỜ trả kỹ năng có tiên quyết chưa đạt (SC-002).
 * Xếp: đến hạn (quá hạn lâu hơn trước) → mới/yếu (mastery thấp hơn trước).
 */
export function recommendNext(
  skills: SkillNode[],
  mastery: Map<string, number>,
  opts: RecommendOpts,
): Recommendation[] {
  const { now, dueAt, limit } = opts;
  const m = (id: string): number => mastery.get(id) ?? DEFAULT_BKT.pInit;

  const eligible = skills.filter(
    (s) => s.hasQuestions && m(s.id) < MASTERED && s.prerequisites.every((p) => m(p) >= MASTERED),
  );

  const isDue = (id: string): boolean => {
    const d = dueAt.get(id);
    return d !== undefined && d <= now;
  };
  const reasonOf = (s: SkillNode): RecommendReason =>
    isDue(s.id) ? "due" : mastery.has(s.id) ? "weak" : "new";

  const sorted = eligible.slice().sort((a, b) => {
    const da = isDue(a.id);
    const db = isDue(b.id);
    if (da !== db) return da ? -1 : 1; // đến hạn trước
    if (da && db) return (dueAt.get(a.id) ?? 0) - (dueAt.get(b.id) ?? 0); // quá hạn lâu hơn (due nhỏ hơn) trước
    const dm = m(a.id) - m(b.id); // còn lại: mastery thấp hơn trước
    return dm !== 0 ? dm : a.id < b.id ? -1 : 1;
  });

  const limited = limit !== undefined ? sorted.slice(0, limit) : sorted;
  return limited.map((s, i) => ({ skillId: s.id, reason: reasonOf(s), priority: i }));
}
