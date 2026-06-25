// View-model lộ trình "học gì tiếp" (THUẦN). Dựng SkillNode[] từ curriculum + gọi recommender.
import { recommendNext, type SkillNode, type Recommendation } from "@synaptek/learning-path";
import type { Grade } from "@synaptek/curriculum";

/** Dựng SkillNode[] từ curriculum: kỹ năng + tiên quyết + có câu hỏi hay không. */
export function buildSkillNodes(grades: Grade[], skillsWithQuestions: Set<string>): SkillNode[] {
  return grades
    .flatMap((g) => g.skills)
    .map((s) => ({
      id: s.id,
      prerequisites: s.prerequisites ?? [],
      hasQuestions: skillsWithQuestions.has(s.id),
    }));
}

export interface LearningPath {
  /** Kỹ năng đến hạn ôn — ưu tiên trước. */
  due: Recommendation[];
  /** Kỹ năng mới/yếu nên học. */
  next: Recommendation[];
}

/** Chia lộ trình thành 2 nhóm cho UI: "đến hạn ôn" và "học mới". */
export function buildPath(
  nodes: SkillNode[],
  mastery: Map<string, number>,
  opts: { now: number; dueAt: Map<string, number>; limit?: number },
): LearningPath {
  const recs = recommendNext(nodes, mastery, opts);
  return {
    due: recs.filter((r) => r.reason === "due"),
    next: recs.filter((r) => r.reason !== "due"),
  };
}
