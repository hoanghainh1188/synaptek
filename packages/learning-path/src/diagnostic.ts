// Chọn câu cho bài chẩn đoán đầu vào — ~5–8 câu trải kỹ năng NỀN (ưu tiên kỹ năng gốc trong DAG).
// Tất định theo seed. TS thuần.
import type { SkillNode } from "./recommender.ts";

export interface DiagnosticOpts {
  /** Số câu tối đa (mặc định 8). */
  max?: number;
  /** Seed chọn câu (tất định). */
  seed?: number;
}

/**
 * Trả danh sách questionId (≤ max), mỗi kỹ năng nền ≤ 1 câu, ưu tiên kỹ năng gốc (ít tiên quyết nhất).
 * Chỉ chọn kỹ năng có câu hỏi. Tất định: cùng (skills, questionsBySkill, seed) → cùng kết quả.
 */
export function buildDiagnostic(
  skills: SkillNode[],
  questionsBySkill: Map<string, string[]>,
  opts: DiagnosticOpts = {},
): string[] {
  const { max = 8, seed = 1 } = opts;

  // Kỹ năng nền trước: ít tiên quyết nhất, rồi theo id (tất định). Chỉ giữ kỹ năng có câu hỏi.
  const ranked = skills
    .filter((s) => (questionsBySkill.get(s.id)?.length ?? 0) > 0)
    .slice()
    .sort((a, b) => {
      const dp = a.prerequisites.length - b.prerequisites.length;
      return dp !== 0 ? dp : a.id < b.id ? -1 : 1;
    });

  const out: string[] = [];
  for (const s of ranked) {
    if (out.length >= max) break;
    const qs = questionsBySkill.get(s.id)!;
    out.push(pick(qs, seed + out.length));
  }
  return out;
}

/** Chọn tất định một phần tử theo seed. */
function pick<T>(arr: T[], seed: number): T {
  let s = seed >>> 0 || 1;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return arr[Math.floor(r * arr.length)];
}
