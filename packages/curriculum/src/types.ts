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

/** Một lớp (file content/curriculum/grade-<n>.json). */
export interface Grade {
  grade: number;
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
  choices?: string[];
  correct: string | string[];
  options?: { tolerance?: number };
  explanation: string;
}

/** Lỗi validation — đường dẫn + thông điệp. */
export interface ValidationError {
  path: string;
  message: string;
}
