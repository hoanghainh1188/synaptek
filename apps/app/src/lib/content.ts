// Content loader (M1): nội dung BUNDLE vào app (D6/research R2). Nguồn = manifest tự sinh
// (auto-discovery, D14) — KHÔNG sửa tay registry; thêm file vào content/ rồi `npm run gen:content`.
import {
  allTopics,
  subjectsOf,
  topicsByGrade,
  levelsWithContent,
  type LevelInfo,
  type QuestionImage,
  type Topic,
} from "@synaptek/curriculum";
import type { Badge } from "@synaptek/learning-path";
import { BADGES, CURRICULA, IMAGES, QUESTIONS } from "./content.generated";

/** Lớp Tiểu học (D15: lớp 4 + ôn 1–3). Bộ chọn theo cấp dùng `listGradesInLevel`; hằng này giữ lại
 *  cho các nơi còn chỉ phục vụ Tiểu học (vd composer GV). */
export const GRADE_FILTERS = [1, 2, 3, 4, 5] as const;

/** Các môn có nội dung (mặc định chỉ ["math"]). */
export function listSubjects(): string[] {
  return subjectsOf(CURRICULA);
}

/** Các cấp học CÓ nội dung cho một môn (Tiểu học/THCS/THPT) — chỉ hiện hàng "Cấp" khi >1. */
export function listLevels(subject: string = "math"): LevelInfo[] {
  return levelsWithContent(CURRICULA, subject);
}

/** Lớp đầu tiên (quét mọi cấp 1–12) có nội dung cho một môn; undefined nếu môn chưa có gì. */
export function firstGradeWithContent(subject: string): number | undefined {
  for (let g = 1; g <= 12; g++) if (topicsByGrade(CURRICULA, g, subject).length > 0) return g;
  return undefined;
}

/** Chủ đề của một lớp; lọc theo môn (mặc định "math"). */
export function listTopics(grade: number, subject: string = "math"): Topic[] {
  return topicsByGrade(CURRICULA, grade, subject);
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

/** Ánh xạ ngược questionId → skillId (cho mastery BKT — M2). */
export function skillOfQuestion(questionId: string): string | undefined {
  for (const qs of Object.values(QUESTIONS)) {
    const q = qs.find((x) => x.id === questionId);
    if (q) return q.skillId;
  }
  return undefined;
}

/** Các câu hỏi thuộc một kỹ năng (cho "Luyện nhanh" trộn theo điểm yếu/đến hạn). */
export function questionsForSkill(skillId: string) {
  const out = [];
  for (const qs of Object.values(QUESTIONS)) {
    for (const q of qs) if (q.skillId === skillId) out.push(q);
  }
  return out;
}

/** Tập kỹ năng có ≥1 câu hỏi (gate lộ trình — M2). */
export function skillsWithQuestions(): Set<string> {
  const set = new Set<string>();
  for (const qs of Object.values(QUESTIONS)) {
    for (const q of qs) set.add(q.skillId);
  }
  return set;
}

/** Loại câu hỏi theo id (cho heatmap dạng lỗi — M2). */
export function questionTypeOf(questionId: string): string | undefined {
  for (const qs of Object.values(QUESTIONS)) {
    const q = qs.find((x) => x.id === questionId);
    if (q) return q.type;
  }
  return undefined;
}

/** Tất cả lớp (curriculum) — cho dựng SkillNode lộ trình. */
export function allGrades() {
  return CURRICULA;
}

/** Map skillId → danh sách questionId (cho bài chẩn đoán). */
export function questionsBySkill(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const qs of Object.values(QUESTIONS)) {
    for (const q of qs) {
      const arr = map.get(q.skillId) ?? [];
      arr.push(q.id);
      map.set(q.skillId, arr);
    }
  }
  return map;
}

/** Tra Question theo id (cho dựng phiên chẩn đoán). */
export function getQuestionById(questionId: string) {
  for (const qs of Object.values(QUESTIONS)) {
    const q = qs.find((x) => x.id === questionId);
    if (q) return q;
  }
  return undefined;
}

/** Chủ đề chứa một kỹ năng (để điều hướng từ lộ trình → luyện tập). */
export function topicOfSkill(skillId: string): string | undefined {
  return allTopics(CURRICULA).find((t) => t.skillIds.includes(skillId))?.id;
}

/** Tên kỹ năng (hiển thị lộ trình/heatmap). */
export function skillName(skillId: string): string {
  for (const g of CURRICULA) {
    const s = g.skills.find((x) => x.id === skillId);
    if (s) return s.name;
  }
  return skillId;
}

/** Catalog huy hiệu (gamification — D6/D20). */
export function getBadges(): Badge[] {
  return BADGES;
}

/** Map topicId → danh sách skillId (suy huy hiệu topic_mastered — M2). */
export function topicSkillsMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const t of allTopics(CURRICULA)) map.set(t.id, t.skillIds);
  return map;
}
