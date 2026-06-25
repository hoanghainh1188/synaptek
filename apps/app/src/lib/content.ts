// Content loader (M1): nội dung BUNDLE vào app (D6/research R2). Nguồn = manifest tự sinh
// (auto-discovery, D14) — KHÔNG sửa tay registry; thêm file vào content/ rồi `npm run gen:content`.
import { allTopics, topicsByGrade, type QuestionImage, type Topic } from "@synaptek/curriculum";
import { CURRICULA, IMAGES, QUESTIONS } from "./content.generated";

/** Lớp hiển thị trên chip lọc (D15: lớp 4 + ôn 1–3). */
export const GRADE_FILTERS = [1, 2, 3, 4] as const;

export function listTopics(grade: number): Topic[] {
  return topicsByGrade(CURRICULA, grade);
}

export function getTopic(id: string): Topic | undefined {
  return allTopics(CURRICULA).find((t) => t.id === id);
}

export function getQuestions(topicId: string) {
  return QUESTIONS[topicId] ?? [];
}

/** Mã mạch kiến thức từ id chủ đề (vd "g4.num.fractions" → "num") — để tô màu ngữ nghĩa. */
export function strandOf(topicId: string): string {
  return topicId.split(".")[1] ?? "num";
}

/** Nguồn ảnh cho expo-image: URL/data → {uri}; key bundle → asset từ manifest. */
export function imageSource(image: QuestionImage): unknown {
  if (/^(https?:|data:)/.test(image.src)) return { uri: image.src };
  return IMAGES[image.src];
}

/** Ánh xạ ngược questionId → topicId (cho gộp tiến độ). */
export function topicOfQuestion(questionId: string): string | undefined {
  for (const [topicId, qs] of Object.entries(QUESTIONS)) {
    if (qs.some((q) => q.id === questionId)) return topicId;
  }
  return undefined;
}
