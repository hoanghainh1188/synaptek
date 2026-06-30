// ⚠️ AUTO-GENERATED từ packages/step-grading/src/step-grading.ts — KHÔNG sửa tay.
// Cập nhật: chỉnh nguồn rồi chạy `npm run sync:edge`. Lý do bản sao: D13.

// @synaptek/step-grading — chấm LỜI GIẢI TỪNG BƯỚC bằng lấy mẫu (D9, KHÔNG CAS). TS thuần, zero-dep
// ngoài @synaptek/grading-engine (sampler). Chạy client (phản hồi tức thì) + Edge (chấm chính thức, D4).
//
// Mỗi bước phải bảo toàn một BẤT BIẾN, kiểm bằng thay biến nhiều giá trị:
//  - "expression": dòng N ≡ dòng N−1 về GIÁ TRỊ (rút gọn biểu thức/phân số).
//  - "equation":   dòng N cùng TẬP NGHIỆM dòng N−1 (chân trị eq trùng tại mọi mẫu).
// Định vị DÒNG SAI ĐẦU TIÊN + điểm thành phần. Nhiều cách giải đều được chấp nhận (chỉ kiểm bất biến + đích).
import { evalExpr, expressionsEquivalent } from "@synaptek/grading-engine";

export type StepMode = "expression" | "equation";

export interface DerivationSpec {
  mode: StepMode;
  /** Biến (mặc định "x"). */
  variable?: string;
  /** Đích cho mode "expression": biểu thức rút gọn mong muốn (để xét reachedGoal). */
  target?: string;
}

export interface DerivationResult {
  /** Dòng ĐẦU TIÊN phá bất biến (so với dòng trước); -1 nếu mọi bước hợp lệ. */
  firstErrorIndex: number;
  /** Số bước hợp lệ liên tiếp từ đầu. */
  validSteps: number;
  /** Tổng số bước (số dòng − 1). */
  totalSteps: number;
  /** Dòng cuối đã đạt "đích" chưa (equation: biến = số; expression: ≡ target nếu có). */
  reachedGoal: boolean;
  /** 0..1 = validSteps/totalSteps. */
  score: number;
}

const SAMPLES = [0, 1, 2, 3, -1, -2, 0.5, 1.5, -1.5, 7];
const TOL = 1e-6;

function splitEquation(line: string): [string, string] | null {
  const parts = line.split("=");
  if (parts.length !== 2) return null;
  const [l, r] = parts;
  if (l.trim() === "" || r.trim() === "") return null;
  return [l, r];
}

/** Bước hợp lệ (expression): hai dòng tương đương về giá trị. */
function stepValidExpression(prev: string, cur: string): boolean {
  return expressionsEquivalent(prev, cur);
}

/** Bước hợp lệ (equation): hai phương trình "L=R" cùng chân trị tại mọi mẫu (⇒ cùng tập nghiệm). */
function stepValidEquation(prev: string, cur: string): boolean {
  const p = splitEquation(prev);
  const c = splitEquation(cur);
  if (!p || !c) return false;
  let compared = 0;
  for (const x of SAMPLES) {
    const pl = evalExpr(p[0], x);
    const pr = evalExpr(p[1], x);
    const cl = evalExpr(c[0], x);
    const cr = evalExpr(c[1], x);
    if (pl === null || pr === null || cl === null || cr === null) continue;
    const pTrue = Math.abs(pl - pr) <= TOL;
    const cTrue = Math.abs(cl - cr) <= TOL;
    if (pTrue !== cTrue) return false; // khác chân trị tại x → khác tập nghiệm
    compared++;
  }
  return compared >= 3; // đủ mẫu hợp lệ mới kết luận
}

/** Đích equation: dòng dạng `<biến> = <số>` (đã cô lập biến). */
function isIsolated(line: string, variable: string): boolean {
  const v = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${v}\\s*=\\s*-?\\d+([.,]\\d+)?\\s*$`).test(line);
}

/**
 * Chấm một lời giải nhiều dòng. `lines[0]` = đề cho; `lines[1..]` = HS biến đổi.
 * Dừng đánh giá ở dòng sai đầu tiên (firstErrorIndex). Bỏ trống → 0.
 */
export function gradeDerivation(lines: string[], spec: DerivationSpec): DerivationResult {
  const cleaned = lines.map((l) => l.trim()).filter((l) => l !== "");
  const totalSteps = Math.max(0, cleaned.length - 1);
  let firstErrorIndex = -1;
  let validSteps = 0;
  for (let n = 1; n < cleaned.length; n++) {
    const ok =
      spec.mode === "equation"
        ? stepValidEquation(cleaned[n - 1], cleaned[n])
        : stepValidExpression(cleaned[n - 1], cleaned[n]);
    if (!ok) {
      firstErrorIndex = n;
      break;
    }
    validSteps++;
  }
  const allValid = firstErrorIndex < 0;
  const last = cleaned[cleaned.length - 1] ?? "";
  const variable = spec.variable ?? "x";
  const reachedGoal =
    allValid &&
    cleaned.length >= 2 &&
    (spec.mode === "equation"
      ? isIsolated(last, variable)
      : spec.target
        ? expressionsEquivalent(last, spec.target)
        : false);
  const score = totalSteps === 0 ? 0 : validSteps / totalSteps;
  return { firstErrorIndex, validSteps, totalSteps, reachedGoal, score };
}
