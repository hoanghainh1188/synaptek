// Types nội dung Synaptek — nguồn-sự-thật schema (D6/D14). TS thuần.
// QuestionType & định dạng `correct` TRÙNG API grade() của @synaptek/grading-engine (contracts).
import type { QuestionType } from "@synaptek/grading-engine";
export type { QuestionType };

/** Danh sách loại câu hỏi (runtime) — giữ đồng bộ với QuestionType của grading-engine. */
export const QUESTION_TYPES = [
  "mcq",
  "true-false",
  "numeric",
  "fraction",
  "expression",
  "fill-blank",
  "multi",
  "ordering",
  "matching",
] as const;

/** Kỹ năng / "yêu cầu cần đạt" — đơn vị mastery nguyên tử (M2 dùng). */
export interface Skill {
  id: string;
  name: string;
  description?: string;
  /** Trỏ tới Skill.id (cho phép lớp dưới — ôn tập, D15). DAG, không chu trình. */
  prerequisites: string[];
}

/** Chủ đề — đơn vị học sinh chọn để luyện. */
export interface Topic {
  id: string;
  name: string;
  grade: number;
  /** Trỏ tới Skill.id. */
  skillIds: string[];
}

/** Mạch kiến thức. */
export interface Strand {
  id: string;
  name: string;
  topics: Topic[];
}

/** Một lớp của một MÔN (file content/curriculum/*.json). */
export interface Grade {
  grade: number;
  /** Môn học: "math" (mặc định nếu thiếu) · "vietnamese" · "english" · "science"… */
  subject?: string;
  strands: Strand[];
  skills: Skill[];
}

/** Câu hỏi — map THẲNG sang GradeInput của grading-engine (type/correct/options). */
export interface Question {
  id: string;
  skillId: string;
  grade: number;
  type: QuestionType;
  prompt: string;
  /** Độ khó (tùy chọn): 1=dễ, 2=vừa, 3=khó. Dùng cho XP theo độ khó (M2/D20); vắng → suy theo loại câu. */
  difficulty?: 1 | 2 | 3;
  /** Ảnh minh họa (tùy chọn) — hữu ích cho Hình học/biểu đồ. */
  image?: QuestionImage;
  choices?: string[];
  correct: string | string[];
  options?: { tolerance?: number; unordered?: boolean; roundTo?: number };
  /** Gợi ý/hướng dẫn (tùy chọn) — CỐ Ý hiện khi HS làm bài (khác explanation hiện sau). */
  hint?: string;
  explanation: string;
}

/** Ảnh trong câu hỏi. */
export interface QuestionImage {
  /** URL (http…/data:) HOẶC key ảnh bundle trong content/images (không đuôi file). */
  src: string;
  /** Mô tả ảnh — BẮT BUỘC (accessibility + fallback khi ảnh lỗi). */
  alt: string;
  /** Tỉ lệ rộng/cao để giữ khung (vd 1.5). Mặc định 1. */
  aspectRatio?: number;
}

/** Lỗi validation — đường dẫn + thông điệp. */
export interface ValidationError {
  path: string;
  message: string;
}
