// Bayesian Knowledge Tracing (BKT) — mastery mỗi kỹ năng. TS thuần, tất định. (D19)
// P(L) = xác suất đã thạo. Cập nhật sau mỗi câu: posterior theo quan sát (slip/guess) rồi cộng learn.

export interface BktParams {
  /** P(L0) — xác suất thạo ban đầu. */
  pInit: number;
  /** P(T) — xác suất "học được" sau một lần luyện. */
  pLearn: number;
  /** P(S) — xác suất trả lời sai dù đã thạo (sơ suất). */
  pSlip: number;
  /** P(G) — xác suất trả lời đúng dù chưa thạo (đoán trúng). */
  pGuess: number;
}

/** Tham số mặc định "an toàn" khi chưa có dữ liệu thật (tinh chỉnh sau — FR-020). */
export const DEFAULT_BKT: BktParams = { pInit: 0.3, pLearn: 0.15, pSlip: 0.1, pGuess: 0.2 };

/** Ngưỡng coi là "đã đạt" (cấu hình). */
export const MASTERED = 0.95;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Cập nhật P(L) sau một câu. Đúng → tăng; sai → giảm/chậm lại. */
export function updateMastery(
  prior: number,
  isCorrect: boolean,
  p: BktParams = DEFAULT_BKT,
): number {
  const L = clamp01(prior);
  const { pSlip, pGuess, pLearn } = p;
  const posterior = isCorrect
    ? (L * (1 - pSlip)) / (L * (1 - pSlip) + (1 - L) * pGuess)
    : (L * pSlip) / (L * pSlip + (1 - L) * (1 - pGuess));
  return clamp01(posterior + (1 - posterior) * pLearn);
}

/**
 * Khởi tạo mastery từ bài chẩn đoán: với mỗi kỹ năng, gập (fold) lần lượt các câu từ pInit.
 * Trả Map skillId → mastery. Kỹ năng không có trong responses → không xuất hiện (dùng pInit lazy ở nơi đọc).
 */
export function initFromDiagnostic(
  responses: { skillId: string; isCorrect: boolean }[],
  p: BktParams = DEFAULT_BKT,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of responses) {
    const prior = out.get(r.skillId) ?? p.pInit;
    out.set(r.skillId, updateMastery(prior, r.isCorrect, p));
  }
  return out;
}
