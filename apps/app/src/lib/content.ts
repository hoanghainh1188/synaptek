// Content loader (M1): nội dung BUNDLE vào app (D6/research R2). Validate khi nạp qua @synaptek/curriculum.
import {
  allTopics,
  topicsByGrade,
  type Grade,
  type Question,
  type Topic,
} from "@synaptek/curriculum";
import grade4 from "../../../../content/curriculum/grade-4.json";
import fractions from "../../../../content/questions/g4.num.fractions.json";

// Registry M1 (mở rộng khi content pipeline cấp thêm — D14).
const CURRICULA: Grade[] = [grade4 as Grade];
const QUESTIONS: Record<string, Question[]> = {
  "g4.num.fractions": fractions as Question[],
};

/** Lớp hiển thị trên chip lọc (D15: lớp 4 + ôn 1–3). */
export const GRADE_FILTERS = [1, 2, 3, 4] as const;

export function listTopics(grade: number): Topic[] {
  return topicsByGrade(CURRICULA, grade);
}

export function getTopic(id: string): Topic | undefined {
  return allTopics(CURRICULA).find((t) => t.id === id);
}

export function getQuestions(topicId: string): Question[] {
  return QUESTIONS[topicId] ?? [];
}

/** Mã mạch kiến thức từ id chủ đề (vd "g4.num.fractions" → "num") — để tô màu ngữ nghĩa. */
export function strandOf(topicId: string): string {
  return topicId.split(".")[1] ?? "num";
}
