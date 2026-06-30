// Traversal + dựng phiên luyện tập. TS thuần.
import type { Grade, Question, Topic } from "./types.ts";

/** Môn của một Grade (mặc định "math" nếu thiếu). */
export function gradeSubject(g: Grade): string {
  return g.subject ?? "math";
}

/** Danh sách môn có trong curricula (giữ thứ tự xuất hiện; "math" luôn trước nếu có). */
export function subjectsOf(curricula: Grade[]): string[] {
  const seen: string[] = [];
  for (const g of curricula) {
    const s = gradeSubject(g);
    if (!seen.includes(s)) seen.push(s);
  }
  return seen.sort((a, b) => (a === "math" ? -1 : b === "math" ? 1 : 0));
}

/** Tất cả chủ đề của một lớp (gộp mọi mạch); lọc theo môn nếu truyền `subject`. */
export function topicsByGrade(curricula: Grade[], grade: number, subject?: string): Topic[] {
  return curricula
    .filter((g) => g.grade === grade && (subject === undefined || gradeSubject(g) === subject))
    .flatMap((g) => g.strands.flatMap((s) => s.topics));
}

/** Tất cả chủ đề mọi lớp (để liệt kê/ lọc). */
export function allTopics(curricula: Grade[]): Topic[] {
  return curricula.flatMap((g) => g.strands.flatMap((s) => s.topics));
}

/** Câu hỏi thuộc một chủ đề: skillId nằm trong topic.skillIds. */
export function questionsForTopic(questions: Question[], topic: Topic): Question[] {
  const set = new Set(topic.skillIds);
  return questions.filter((q) => set.has(q.skillId));
}

/** Dựng phiên: (tùy chọn) xáo trộn tất định theo seed, lấy `count` câu (mặc định 10). */
export function buildSession(
  questions: Question[],
  opts: { count?: number; shuffleSeed?: number } = {},
): Question[] {
  const { count = 10, shuffleSeed } = opts;
  let pool = questions;
  if (shuffleSeed !== undefined) {
    pool = shuffle(questions, shuffleSeed);
  }
  return pool.slice(0, count);
}

/** Fisher–Yates tất định với PRNG (mulberry32) — để test lặp lại được. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed >>> 0;
  const rnd = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
