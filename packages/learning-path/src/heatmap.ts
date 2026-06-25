// Bản đồ điểm yếu — gộp attempts theo kỹ năng + suy dạng lỗi hay mắc. TS thuần.
import { DEFAULT_BKT } from "./bkt.ts";

export interface HeatCell {
  skillId: string;
  /** Mastery hiện tại [0,1]. */
  mastery: number;
  /** Tỉ lệ đúng trên các attempt được truyền vào. */
  recentAccuracy: number;
  /** Số lần làm. */
  attempts: number;
}

/** Nhãn dạng lỗi theo loại câu (tiếng Việt, thân thiện). */
const ERROR_LABEL: Record<string, string> = {
  mcq: "chọn sai đáp án",
  "true-false": "nhầm đúng/sai",
  numeric: "sai kết quả tính",
  fraction: "sai phân số",
  expression: "sai biểu thức",
  "fill-blank": "điền thiếu/sai chỗ trống",
};

/** Mỗi kỹ năng một ô, xếp yếu nhất trước (mastery thấp → cao, rồi accuracy thấp → cao). */
export function skillWeakness(
  attempts: { skillId: string; isCorrect: boolean }[],
  mastery: Map<string, number>,
): HeatCell[] {
  const agg = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const g = agg.get(a.skillId) ?? { correct: 0, total: 0 };
    g.total += 1;
    if (a.isCorrect) g.correct += 1;
    agg.set(a.skillId, g);
  }
  const cells: HeatCell[] = [];
  for (const [skillId, g] of agg) {
    cells.push({
      skillId,
      mastery: mastery.get(skillId) ?? DEFAULT_BKT.pInit,
      recentAccuracy: g.total ? g.correct / g.total : 0,
      attempts: g.total,
    });
  }
  return cells.sort((a, b) => {
    const dm = a.mastery - b.mastery;
    if (dm !== 0) return dm;
    const da = a.recentAccuracy - b.recentAccuracy;
    return da !== 0 ? da : a.skillId < b.skillId ? -1 : 1;
  });
}

/**
 * Dạng lỗi hay mắc theo kỹ năng: loại câu SAI nhiều nhất → nhãn. Bỏ qua kỹ năng không có câu sai.
 */
export function commonErrorType(
  attempts: { skillId: string; questionType: string; isCorrect: boolean }[],
): Map<string, string> {
  const wrongBySkill = new Map<string, Map<string, number>>();
  for (const a of attempts) {
    if (a.isCorrect) continue;
    const byType = wrongBySkill.get(a.skillId) ?? new Map<string, number>();
    byType.set(a.questionType, (byType.get(a.questionType) ?? 0) + 1);
    wrongBySkill.set(a.skillId, byType);
  }
  const out = new Map<string, string>();
  for (const [skillId, byType] of wrongBySkill) {
    let top = "";
    let topN = -1;
    for (const [type, n] of [...byType].sort((x, y) => (x[0] < y[0] ? -1 : 1))) {
      if (n > topN) {
        top = type;
        topN = n;
      }
    }
    out.set(skillId, ERROR_LABEL[top] ?? "cần luyện thêm");
  }
  return out;
}
