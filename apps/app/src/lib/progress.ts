// Gộp attempts → tiến độ theo chủ đề (THUẦN, test được). M1 derive từ attempts (D-data-model B).
// "Đã làm/đúng" tính theo SỐ CÂU PHÂN BIỆT (không đếm trùng lần làm lại).

export interface AttemptLike {
  questionId: string;
  isCorrect: boolean;
}

export interface TopicProgress {
  topicId: string;
  attempted: number; // số câu phân biệt đã làm
  correct: number; // số câu phân biệt từng trả lời đúng
}

/**
 * @param topicOf ánh xạ questionId → topicId (do app cấp, từ content). Trả undefined → bỏ qua.
 */
export function aggregateProgress(
  attempts: AttemptLike[],
  topicOf: (questionId: string) => string | undefined,
): Record<string, TopicProgress> {
  const acc: Record<string, { attempted: Set<string>; correct: Set<string> }> = {};
  for (const a of attempts) {
    const topic = topicOf(a.questionId);
    if (!topic) continue;
    const e = (acc[topic] ??= { attempted: new Set(), correct: new Set() });
    e.attempted.add(a.questionId);
    if (a.isCorrect) e.correct.add(a.questionId);
  }
  const out: Record<string, TopicProgress> = {};
  for (const [topicId, e] of Object.entries(acc)) {
    out[topicId] = { topicId, attempted: e.attempted.size, correct: e.correct.size };
  }
  return out;
}
