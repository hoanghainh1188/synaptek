// ⚠️ AUTO-GENERATED từ packages/grading-engine/src/grading-engine.ts — KHÔNG sửa tay.
// Cập nhật: chỉnh nguồn rồi chạy `npm run sync:edge`. Lý do bản sao: D13.

/**
 * @synaptek/grading-engine — bộ chấm bài TS thuần, zero-dep, độc lập nền tảng.
 *
 * Chạy được trên cả Node (client/test) lẫn Deno (Supabase Edge Function). Không import
 * DOM/React/Node-only API. Đây là "moat" của Synaptek: chuẩn hóa & chấm **tương đương** đáp án
 * (số, phân số, biểu thức) chứ không so khớp chuỗi thô — để học sinh nhập "0,5" hay "2/4"
 * vẫn được chấm đúng.
 *
 * Quy ước số kiểu VN: dấu phẩy là dấu thập phân, dấu chấm là phân tách phần nghìn.
 *   "0,5" → 0.5 · "1.000,5" → 1000.5 · "0.5" (kiểu Anh, không có phẩy) → 0.5
 */

export type QuestionType =
  | "mcq"
  | "true-false"
  | "numeric"
  | "fraction"
  | "expression"
  | "fill-blank";

export type FeedbackCode = "correct" | "incorrect" | "empty" | "partial" | "format-error";

/**
 * Chẩn đoán lỗi sai PHỔ BIẾN (chỉ khi sai; phụ trợ — KHÔNG đổi isCorrect/score). Giúp HS hiểu *vì sao* sai.
 * `sign` = sai dấu (âm/dương) · `magnitude10` = lệch ×10/÷10 (sai vị trí dấu phẩy) ·
 * `reciprocal` = đảo tử/mẫu (phân số) · `rounding` = gần đúng (chú ý làm tròn).
 */
export type Diagnosis = "sign" | "magnitude10" | "reciprocal" | "rounding" | "offByOne";

export interface GradeOptions {
  /** Dung sai tuyệt đối khi so sánh số/phân số/biểu thức. Mặc định EPS. */
  tolerance?: number;
  /** fill-blank: chấm như TẬP không quan tâm thứ tự (khớp đa tập). Mặc định false (theo vị trí). */
  unordered?: boolean;
}

export interface GradeInput {
  type: QuestionType;
  /** Đáp án đúng. Với fill-blank là mảng (một phần tử mỗi chỗ trống). */
  correct: string | string[];
  /** Bài làm của học sinh. */
  answer: string | string[];
  options?: GradeOptions;
}

export interface GradeResult {
  isCorrect: boolean;
  /** Điểm 0..1 (fill-blank chấm theo tỉ lệ chỗ trống đúng). */
  score: number;
  feedbackCode: FeedbackCode;
  /** Dạng đã chuẩn hóa, hữu ích cho debug/hiển thị. */
  normalized: { correct: string | string[]; answer: string | string[] };
  /** Chẩn đoán lỗi (tùy chọn) — chỉ có khi sai & phát hiện được dạng lỗi phổ biến. */
  diagnosis?: Diagnosis;
}

const EPS = 1e-9;

// ── Helpers chuỗi ─────────────────────────────────────────────────────────────

function asString(v: string | string[]): string {
  return Array.isArray(v) ? v.join(",") : v;
}

function isBlank(v: string | string[]): boolean {
  if (Array.isArray(v)) return v.length === 0 || v.every((s) => s.trim() === "");
  return v.trim() === "";
}

function result(
  isCorrect: boolean,
  score: number,
  feedbackCode: FeedbackCode,
  correct: string | string[],
  answer: string | string[],
  diagnosis?: Diagnosis,
): GradeResult {
  const r: GradeResult = { isCorrect, score, feedbackCode, normalized: { correct, answer } };
  if (diagnosis) r.diagnosis = diagnosis; // chỉ gắn khi có (không thêm key undefined)
  return r;
}

/** Chẩn đoán lỗi số (correct ≠ answer, đều là số). Ưu tiên dạng cụ thể trước "gần đúng". */
function numericDiagnosis(cn: number, an: number): Diagnosis | undefined {
  if (Math.abs(cn) > EPS && Math.abs(an + cn) < EPS) return "sign"; // an = -cn
  for (const f of [10, 100, 0.1, 0.01]) {
    if (Math.abs(an - cn * f) < EPS * Math.max(1, Math.abs(cn * f))) return "magnitude10";
  }
  if (Math.abs(Math.abs(an - cn) - 1) < EPS) return "offByOne"; // lệch đúng 1 đơn vị
  // gần đúng: lệch ≤ 10% giá trị đúng (nhưng khác hẳn) → nhắc làm tròn
  const denom = Math.max(Math.abs(cn), 1);
  if (Math.abs(an - cn) / denom <= 0.1) return "rounding";
  return undefined;
}

/** Chẩn đoán lỗi phân số: đảo tử/mẫu, sai dấu. */
function fractionDiagnosis(cv: number, av: number): Diagnosis | undefined {
  if (Math.abs(cv) > EPS && Math.abs(av * cv - 1) < EPS) return "reciprocal"; // av = 1/cv
  if (Math.abs(cv) > EPS && Math.abs(av + cv) < EPS) return "sign";
  return undefined;
}

// ── Số: chuẩn hóa kiểu VN + parse ─────────────────────────────────────────────

/** Chuẩn hóa chuỗi số kiểu VN về dạng chuẩn JS ("1.000,5" → "1000.5"). */
export function normalizeNumberString(raw: string): string {
  let s = raw.trim().replace(/\s+/g, "");
  if (s === "") return "";
  if (s.includes(",")) {
    // Có dấu phẩy → phẩy là dấu thập phân, chấm là phân tách phần nghìn.
    s = s.replace(/\./g, "").replace(",", ".");
  }
  return s;
}

export function parseNumber(raw: string): number | null {
  let s = normalizeNumberString(raw);
  if (s === "") return null;
  let pct = false;
  if (s.endsWith("%")) {
    pct = true;
    s = s.slice(0, -1); // phần trăm: "50%" → 50/100
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return pct ? n / 100 : n;
}

/** Giá trị số của phân số "a/b", HỖN SỐ "a b/c", phần trăm, hoặc số thập phân. null nếu sai/chia 0. */
export function fractionValue(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, " ").trim();
  if (s === "") return null;
  // Hỗn số "a b/c" (vd "1 1/2" = 1 + 1/2; "-2 3/4" = -(2 + 3/4)).
  const mm = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mm) {
    const den = Number(mm[4]);
    if (den === 0) return null;
    const val = Number(mm[2]) + Number(mm[3]) / den;
    return mm[1] === "-" ? -val : val;
  }
  const noSpace = s.replace(/\s+/g, "");
  const m = noSpace.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    const d = Number(m[2]);
    if (d === 0) return null;
    return Number(m[1]) / d;
  }
  return parseNumber(noSpace);
}

// ── Biểu thức: tokenize → RPN (shunting-yard) → eval, so tương đương qua lấy mẫu ──

type Tok =
  | { t: "num"; v: number }
  | { t: "var" }
  | { t: "op"; v: string }
  | { t: "paren"; v: "(" | ")" };

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4, neg: 3 };
const RIGHT = new Set(["^", "neg"]);

function tokenize(raw: string): Tok[] | null {
  const s = raw.trim().replace(/\s+/g, "");
  if (s === "") return null;
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (!Number.isFinite(v)) return null;
      out.push({ t: "num", v });
      i = j;
    } else if (c === "x") {
      out.push({ t: "var" });
      i++;
    } else if ("+-*/^".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else if (c === "(" || c === ")") {
      out.push({ t: "paren", v: c });
      i++;
    } else {
      return null; // ký tự không hỗ trợ
    }
  }
  return insertImplicitMul(out);
}

/** Chèn "*" cho nhân ngầm: 2x → 2*x · 2(x+2) → 2*(x+2) · (x)(x) → (x)*(x). */
function insertImplicitMul(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  for (let k = 0; k < toks.length; k++) {
    const cur = toks[k];
    const prev = out[out.length - 1];
    const endsOperand =
      prev && (prev.t === "num" || prev.t === "var" || (prev.t === "paren" && prev.v === ")"));
    const startsOperand =
      cur.t === "num" || cur.t === "var" || (cur.t === "paren" && cur.v === "(");
    if (endsOperand && startsOperand) out.push({ t: "op", v: "*" });
    out.push(cur);
  }
  return out;
}

function toRpn(toks: Tok[]): Tok[] | null {
  const out: Tok[] = [];
  const ops: Tok[] = [];
  let prev: Tok | undefined;
  for (const tok of toks) {
    if (tok.t === "num" || tok.t === "var") {
      out.push(tok);
    } else if (tok.t === "op") {
      // Dấu trừ một ngôi (unary): ở đầu, sau "(", hoặc sau toán tử khác.
      let op = tok.v;
      if (op === "-" && (!prev || prev.t === "op" || (prev.t === "paren" && prev.v === "("))) {
        op = "neg";
      }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.t !== "op") break;
        const higher = PREC[top.v] > PREC[op] || (PREC[top.v] === PREC[op] && !RIGHT.has(op));
        if (higher) out.push(ops.pop() as Tok);
        else break;
      }
      ops.push({ t: "op", v: op });
    } else if (tok.t === "paren" && tok.v === "(") {
      ops.push(tok);
    } else if (tok.t === "paren" && tok.v === ")") {
      let found = false;
      while (ops.length) {
        const top = ops.pop() as Tok;
        if (top.t === "paren" && top.v === "(") {
          found = true;
          break;
        }
        out.push(top);
      }
      if (!found) return null; // ngoặc lệch
    }
    prev = tok;
  }
  while (ops.length) {
    const top = ops.pop() as Tok;
    if (top.t === "paren") return null; // ngoặc lệch
    out.push(top);
  }
  return out;
}

function evalRpn(rpn: Tok[], x: number): number | null {
  const st: number[] = [];
  for (const tok of rpn) {
    if (tok.t === "num") st.push(tok.v);
    else if (tok.t === "var") st.push(x);
    else if (tok.t === "op") {
      if (tok.v === "neg") {
        if (st.length < 1) return null;
        st.push(-(st.pop() as number));
        continue;
      }
      if (st.length < 2) return null;
      const b = st.pop() as number;
      const a = st.pop() as number;
      let r: number;
      switch (tok.v) {
        case "+":
          r = a + b;
          break;
        case "-":
          r = a - b;
          break;
        case "*":
          r = a * b;
          break;
        case "/":
          r = b === 0 ? NaN : a / b;
          break;
        case "^":
          r = Math.pow(a, b);
          break;
        default:
          return null;
      }
      st.push(r);
    }
  }
  return st.length === 1 ? st[0] : null;
}

function compileExpr(raw: string): Tok[] | null {
  const toks = tokenize(raw);
  if (!toks) return null;
  return toRpn(toks);
}

/** Hai biểu thức tương đương? Lấy mẫu x trên nhiều giá trị (số học: 1 mẫu là đủ). */
export function expressionsEquivalent(a: string, b: string, tol = EPS): boolean {
  const ra = compileExpr(a);
  const rb = compileExpr(b);
  if (!ra || !rb) return false;
  const samples = [0, 1, 2, 3, -1, -2, 0.5, 1.5, -1.5, 7];
  let valid = 0;
  for (const x of samples) {
    const va = evalRpn(ra, x);
    const vb = evalRpn(rb, x);
    if (va === null || vb === null || !Number.isFinite(va) || !Number.isFinite(vb)) continue;
    if (Math.abs(va - vb) > tol) return false;
    valid++;
  }
  return valid > 0;
}

// ── Bộ chấm theo từng loại ────────────────────────────────────────────────────

function gradeChoice(correct: string, answer: string): boolean {
  return correct.trim().toLowerCase() === answer.trim().toLowerCase();
}

const TRUE_WORDS = new Set(["true", "đúng", "dung", "d", "t", "1"]);
const FALSE_WORDS = new Set(["false", "sai", "s", "f", "0"]);

function toBool(raw: string): boolean | null {
  const s = raw.trim().toLowerCase();
  if (TRUE_WORDS.has(s)) return true;
  if (FALSE_WORDS.has(s)) return false;
  return null;
}

function numericEqual(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

/** Khớp một chỗ trống: tương đương số (kể cả phân số/hỗn số/%) trước, fallback so chuỗi hoa/thường. */
function blankMatch(correct: string, answer: string, tol: number): boolean {
  const cn = fractionValue(correct);
  const an = fractionValue(answer);
  if (cn !== null && an !== null) return numericEqual(cn, an, tol);
  return correct.trim().toLowerCase() === answer.trim().toLowerCase();
}

// ── API chính ─────────────────────────────────────────────────────────────────

export function grade(input: GradeInput): GradeResult {
  const { type, correct, answer } = input;
  const tol = input.options?.tolerance ?? EPS;

  if (isBlank(answer)) {
    return result(false, 0, "empty", correct, answer);
  }

  switch (type) {
    case "mcq": {
      const ok = gradeChoice(asString(correct), asString(answer));
      return result(ok, ok ? 1 : 0, ok ? "correct" : "incorrect", correct, answer);
    }

    case "true-false": {
      const cb = toBool(asString(correct));
      const ab = toBool(asString(answer));
      if (ab === null) return result(false, 0, "format-error", correct, answer);
      const ok = cb !== null && cb === ab;
      return result(ok, ok ? 1 : 0, ok ? "correct" : "incorrect", correct, answer);
    }

    case "numeric": {
      const cn = parseNumber(asString(correct));
      const an = parseNumber(asString(answer));
      if (an === null) return result(false, 0, "format-error", correct, answer);
      const ok = cn !== null && numericEqual(cn, an, tol);
      const dx = ok || cn === null ? undefined : numericDiagnosis(cn, an);
      return result(ok, ok ? 1 : 0, ok ? "correct" : "incorrect", correct, answer, dx);
    }

    case "fraction": {
      const cv = fractionValue(asString(correct));
      const av = fractionValue(asString(answer));
      if (av === null) return result(false, 0, "format-error", correct, answer);
      const ok = cv !== null && numericEqual(cv, av, tol);
      const dx = ok || cv === null ? undefined : fractionDiagnosis(cv, av);
      return result(ok, ok ? 1 : 0, ok ? "correct" : "incorrect", correct, answer, dx);
    }

    case "expression": {
      const cs = asString(correct);
      const as = asString(answer);
      if (compileExpr(as) === null) return result(false, 0, "format-error", correct, answer);
      const ok = expressionsEquivalent(cs, as, tol);
      return result(ok, ok ? 1 : 0, ok ? "correct" : "incorrect", correct, answer);
    }

    case "fill-blank": {
      const cArr = Array.isArray(correct) ? correct : [correct];
      const aArr = Array.isArray(answer) ? answer : [answer];
      const n = cArr.length;
      let right = 0;
      if (input.options?.unordered) {
        // Tập không thứ tự: mỗi đáp án HS khớp 1 đáp án đúng CHƯA dùng (khớp đa tập).
        const used = new Array(n).fill(false);
        for (const aRaw of aArr) {
          const a = (aRaw ?? "").trim();
          if (a === "") continue;
          for (let i = 0; i < n; i++) {
            if (!used[i] && blankMatch(cArr[i], a, tol)) {
              used[i] = true;
              right++;
              break;
            }
          }
        }
      } else {
        for (let i = 0; i < n; i++) {
          const a = (aArr[i] ?? "").trim();
          if (a !== "" && blankMatch(cArr[i], a, tol)) right++;
        }
      }
      const score = n === 0 ? 0 : right / n;
      const isCorrect = right === n;
      const code: FeedbackCode = isCorrect ? "correct" : right > 0 ? "partial" : "incorrect";
      return result(isCorrect, score, code, correct, answer);
    }

    default:
      return result(false, 0, "format-error", correct, answer);
  }
}
