// Bài luyện "trình bày từng bước" (low-stakes, client chấm qua @synaptek/step-grading). THUẦN.
// Tiểu học: số học nhiều bước (thứ tự thực hiện phép tính). Có vài bài phương trình cho lớp trên.
import type { StepMode } from "@synaptek/step-grading";

export interface StepProblem {
  id: string;
  mode: StepMode;
  /** Đề bài hiển thị. */
  prompt: string;
  /** Dòng đầu (biểu thức/đề) HS bắt đầu biến đổi từ đây. */
  start: string;
  variable?: string;
  /** expression: kết quả rút gọn mong muốn (xét reachedGoal). */
  target?: string;
}

export const STEP_PROBLEMS: StepProblem[] = [
  {
    id: "arith-1",
    mode: "expression",
    prompt: "Tính giá trị, trình bày từng bước: 12 + 3 × 4",
    start: "12 + 3*4",
    target: "24",
  },
  {
    id: "arith-2",
    mode: "expression",
    prompt: "Tính từng bước: (10 − 4) × 5",
    start: "(10 - 4)*5",
    target: "30",
  },
  {
    id: "arith-3",
    mode: "expression",
    prompt: "Tính từng bước: 100 − 25 × 2",
    start: "100 - 25*2",
    target: "50",
  },
  {
    id: "eq-1",
    mode: "equation",
    prompt: "Giải phương trình, mỗi dòng một bước: 2x + 3 = 7",
    start: "2x + 3 = 7",
    variable: "x",
  },
  {
    id: "eq-2",
    mode: "equation",
    prompt: "Giải phương trình: 3x − 1 = 8",
    start: "3x - 1 = 8",
    variable: "x",
  },
];

/** Chuẩn hóa ký hiệu HS hay gõ về dạng engine hiểu: × → *, ÷ → /, − (dấu trừ dài) → -. */
export function normalizeMathInput(s: string): string {
  return s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
}
