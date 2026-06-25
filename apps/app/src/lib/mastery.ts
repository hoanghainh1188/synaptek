// View-model mastery (THUẦN, test bằng node strip-types). Gộp attempts → mastery map qua BKT.
// Tách khỏi I/O Supabase và content (inject skillOf) để test không cần render/mạng.
import {
  initFromDiagnostic,
  updateMastery,
  DEFAULT_BKT,
  type BktParams,
} from "@synaptek/learning-path";

export interface RawAttempt {
  questionId: string;
  skillId?: string | null;
  isCorrect: boolean;
}

export interface SkillAttempt {
  skillId: string;
  isCorrect: boolean;
}

/**
 * Gắn skillId cho từng attempt: ưu tiên field `skillId`, fallback tra từ content (skillOf).
 * Bỏ attempt không xác định được kỹ năng. Giữ nguyên thứ tự (cũ → mới) để BKT gập đúng.
 */
export function toSkillAttempts(
  attempts: RawAttempt[],
  skillOf: (questionId: string) => string | undefined,
): SkillAttempt[] {
  const out: SkillAttempt[] = [];
  for (const a of attempts) {
    const skillId = a.skillId ?? skillOf(a.questionId);
    if (skillId) out.push({ skillId, isCorrect: a.isCorrect });
  }
  return out;
}

/** Mastery map từ attempts đã có skillId (gập BKT từ pInit theo thứ tự). */
export function buildMasteryMap(attempts: SkillAttempt[], p?: BktParams): Map<string, number> {
  return initFromDiagnostic(attempts, p);
}

/**
 * Áp một phiên (các attempt có skillId, theo thứ tự) lên mastery trước đó → map mới.
 * Dùng để cập nhật `skill_mastery` sau mỗi phiên (T026) mà không cần đọc lại toàn bộ attempts.
 */
export function applySession(
  prior: Map<string, number>,
  sessionAttempts: SkillAttempt[],
  p: BktParams = DEFAULT_BKT,
): Map<string, number> {
  const out = new Map(prior);
  for (const a of sessionAttempts) {
    const cur = out.get(a.skillId) ?? p.pInit;
    out.set(a.skillId, updateMastery(cur, a.isCorrect, p));
  }
  return out;
}
