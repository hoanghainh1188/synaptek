// @synaptek/step-grading — chấm LỜI GIẢI TỪNG BƯỚC bằng lấy mẫu (D9, KHÔNG CAS). TS thuần, zero-dep
// ngoài @synaptek/grading-engine (sampler). Chạy client (phản hồi tức thì) + Edge (chấm chính thức, D4).
//
// Mỗi bước phải bảo toàn một BẤT BIẾN, kiểm bằng thay biến nhiều giá trị:
//  - "expression": dòng N ≡ dòng N−1 về GIÁ TRỊ (rút gọn biểu thức/phân số).
//  - "equation":   dòng N cùng TẬP NGHIỆM dòng N−1 (chân trị eq trùng tại mọi mẫu).
// Định vị DÒNG SAI ĐẦU TIÊN + điểm thành phần. Nhiều cách giải đều được chấp nhận (chỉ kiểm bất biến + đích).
import {
  evalExpr,
  expressionsEquivalent,
  grade,
  type QuestionType,
  type GradeOptions,
} from "@synaptek/grading-engine";

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

// ── Câu "nhiều phần" (compound) CÓ THỂ lồng derivation (D44) ────────────────────
// grading-engine.gradeCompound() chỉ orchestrate grade() (9 loại đơn giản) — không biết derivation
// (spec JSON khác hình dạng GradeInput). Sống ở ĐÂY (không phải grading-engine) vì cần gọi CẢ
// grade() lẫn gradeDerivation() mà không tạo phụ thuộc ngược grading-engine → step-grading.

/** Phần con thường (1 trong 9 loại đơn giản) — chấm qua grade(). */
export interface CompoundSimplePart {
  type: Exclude<QuestionType, "derivation" | "compound">;
  correct: string | string[];
  options?: GradeOptions;
}

/** Phần con "trình bày từng bước" — correct = JSON chuỗi spec {mode,variable,target,start} (ẩn). */
export interface CompoundDerivationPart {
  type: "derivation";
  correct: string;
}

export type CompoundPartSpec = CompoundSimplePart | CompoundDerivationPart;

export interface CompoundPartsResult {
  /** Đúng TOÀN BỘ khi mọi phần đều đúng. */
  isCorrect: boolean;
  /** Điểm trung bình các phần (0..1). */
  score: number;
  perPart: { isCorrect: boolean; score: number }[];
}

/** Chấm câu nhiều phần a/b/c: phần thường qua grade(), phần derivation qua gradeDerivation. */
export function gradeCompoundParts(
  parts: CompoundPartSpec[],
  answers: (string | string[])[],
): CompoundPartsResult {
  const perPart = parts.map((p, i) => {
    const ans = answers[i];
    if (p.type === "derivation") {
      let spec: { mode: StepMode; variable?: string; target?: string; start?: string };
      try {
        spec = JSON.parse(p.correct);
      } catch {
        return { isCorrect: false, score: 0 };
      }
      const lines = Array.isArray(ans) ? ans.map(String) : [];
      const full = [spec.start ?? "", ...lines].filter((l) => l.trim() !== "");
      const dr = gradeDerivation(full, {
        mode: spec.mode,
        variable: spec.variable,
        target: spec.target,
      });
      return { isCorrect: dr.reachedGoal, score: dr.score };
    }
    const r = grade({ type: p.type, correct: p.correct, answer: ans ?? "", options: p.options });
    return { isCorrect: r.isCorrect, score: r.score };
  });
  const score =
    perPart.length === 0 ? 0 : perPart.reduce((s, r) => s + r.score, 0) / perPart.length;
  const isCorrect = perPart.length > 0 && perPart.every((r) => r.isCorrect);
  return { isCorrect, score, perPart };
}
