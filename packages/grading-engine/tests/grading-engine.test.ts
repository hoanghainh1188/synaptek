/**
 * Unit test cho bộ chấm bài — chạy KHÔNG cần mạng/DB.
 *   node --experimental-strip-types --no-warnings tests/grading-engine.test.ts
 *
 * Đây là "moat" của Synaptek: chấm tương đương (phân số/biểu thức) phải chính xác và
 * đáng tin — engine chạy ở cả client (phản hồi tức thì) lẫn Edge Function (chấm chính thức).
 */
import assert from "node:assert";
import { grade, expressionsEquivalent } from "../src/grading-engine.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    throw e;
  }
}

console.log("Grading Engine Tests\n");

// ── MCQ ────────────────────────────────────────────────────────────────────
test("MCQ: chọn đúng → score 1, correct", () => {
  const r = grade({ type: "mcq", correct: "B", answer: "B" });
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
  assert.equal(r.feedbackCode, "correct");
});

test("MCQ: chọn sai → score 0, incorrect", () => {
  const r = grade({ type: "mcq", correct: "B", answer: "C" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.score, 0);
  assert.equal(r.feedbackCode, "incorrect");
});

test("MCQ: chuẩn hóa hoa/thường + khoảng trắng", () => {
  const r = grade({ type: "mcq", correct: "B", answer: "  b " });
  assert.equal(r.isCorrect, true);
});

// ── Đúng/Sai ───────────────────────────────────────────────────────────────
test("Đúng/Sai: 'Đúng' ≡ true", () => {
  assert.equal(grade({ type: "true-false", correct: "true", answer: "Đúng" }).isCorrect, true);
  assert.equal(grade({ type: "true-false", correct: "false", answer: "Sai" }).isCorrect, true);
  assert.equal(grade({ type: "true-false", correct: "true", answer: "Sai" }).isCorrect, false);
});

// ── Numeric (đáp số) ─────────────────────────────────────────────────────────
test("Numeric: '0,5' (dấu phẩy VN) ≡ '0.5'", () => {
  assert.equal(grade({ type: "numeric", correct: "0.5", answer: "0,5" }).isCorrect, true);
});

test("Numeric: dấu chấm phần nghìn '1.000,5' ≡ 1000.5", () => {
  assert.equal(grade({ type: "numeric", correct: "1000.5", answer: "1.000,5" }).isCorrect, true);
});

test("Numeric: dung sai (tolerance)", () => {
  assert.equal(
    grade({ type: "numeric", correct: "3.14159", answer: "3.14", options: { tolerance: 0.01 } })
      .isCorrect,
    true,
  );
  assert.equal(
    grade({ type: "numeric", correct: "3.14159", answer: "3.0", options: { tolerance: 0.01 } })
      .isCorrect,
    false,
  );
});

test("Numeric: sai rõ ràng → incorrect", () => {
  assert.equal(grade({ type: "numeric", correct: "12", answer: "21" }).isCorrect, false);
});

// ── Phân số ──────────────────────────────────────────────────────────────────
test("Phân số: 1/2 ≡ 2/4", () => {
  assert.equal(grade({ type: "fraction", correct: "1/2", answer: "2/4" }).isCorrect, true);
});

test("Phân số: 1/2 ≡ 0.5", () => {
  assert.equal(grade({ type: "fraction", correct: "1/2", answer: "0,5" }).isCorrect, true);
});

test("Phân số: 1/2 ≠ 1/3", () => {
  assert.equal(grade({ type: "fraction", correct: "1/2", answer: "1/3" }).isCorrect, false);
});

test("Phân số: mẫu số 0 → format-error", () => {
  const r = grade({ type: "fraction", correct: "1/2", answer: "1/0" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.feedbackCode, "format-error");
});

// ── Biểu thức (tương đương đại số qua lấy mẫu) ────────────────────────────────
test("Biểu thức: số học 2+3*4 ≡ 14", () => {
  assert.equal(grade({ type: "expression", correct: "14", answer: "2+3*4" }).isCorrect, true);
});

test("Biểu thức: 2x+4 ≡ 2(x+2) (nhân ngầm)", () => {
  assert.equal(grade({ type: "expression", correct: "2x+4", answer: "2(x+2)" }).isCorrect, true);
});

test("Biểu thức: x^2 ≡ x*x", () => {
  assert.equal(grade({ type: "expression", correct: "x^2", answer: "x*x" }).isCorrect, true);
});

test("Biểu thức: 2x ≠ 2x+1", () => {
  assert.equal(grade({ type: "expression", correct: "2x", answer: "2x+1" }).isCorrect, false);
});

// ── Điền nhiều chỗ trống ─────────────────────────────────────────────────────
test("Fill-blank: tất cả đúng → score 1", () => {
  const r = grade({ type: "fill-blank", correct: ["1", "2"], answer: ["1", "2"] });
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
});

test("Fill-blank: đúng một nửa → partial, score 0.5, isCorrect false", () => {
  const r = grade({ type: "fill-blank", correct: ["1", "2"], answer: ["1", "3"] });
  assert.equal(r.isCorrect, false);
  assert.equal(r.score, 0.5);
  assert.equal(r.feedbackCode, "partial");
});

// ── Bỏ trống ─────────────────────────────────────────────────────────────────
test("Bỏ trống → empty", () => {
  const r = grade({ type: "numeric", correct: "5", answer: "   " });
  assert.equal(r.isCorrect, false);
  assert.equal(r.feedbackCode, "empty");
});

// ── Chẩn đoán lỗi (diagnosis) — phụ trợ, KHÔNG đổi isCorrect/score ──────────────
test("numeric đúng → không có diagnosis", () => {
  const r = grade({ type: "numeric", correct: "5", answer: "5" });
  assert.equal(r.isCorrect, true);
  assert.equal(r.diagnosis, undefined);
});

test("numeric sai dấu → diagnosis 'sign'", () => {
  const r = grade({ type: "numeric", correct: "5", answer: "-5" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, "sign");
});

test("numeric lệch ×10 → diagnosis 'magnitude10'", () => {
  const r = grade({ type: "numeric", correct: "2,5", answer: "25" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, "magnitude10");
});

test("numeric gần đúng (làm tròn) → diagnosis 'rounding'", () => {
  const r = grade({ type: "numeric", correct: "10", answer: "10,5" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, "rounding");
});

test("numeric sai hẳn → không có diagnosis", () => {
  const r = grade({ type: "numeric", correct: "5", answer: "100" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, undefined);
});

test("fraction đảo tử/mẫu → diagnosis 'reciprocal'", () => {
  const r = grade({ type: "fraction", correct: "2/3", answer: "3/2" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, "reciprocal");
});

test("fraction tương đương vẫn đúng → không có diagnosis", () => {
  const r = grade({ type: "fraction", correct: "1/2", answer: "2/4" });
  assert.equal(r.isCorrect, true);
  assert.equal(r.diagnosis, undefined);
});

// ── Hỗn số (mixed numbers) ───────────────────────────────────────────────────
test("Hỗn số: '1 1/2' = 3/2", () => {
  const r = grade({ type: "fraction", correct: "3/2", answer: "1 1/2" });
  assert.equal(r.isCorrect, true);
});

test("Hỗn số: '2 3/4' = 11/4 (và = 2,75)", () => {
  assert.equal(grade({ type: "fraction", correct: "11/4", answer: "2 3/4" }).isCorrect, true);
  assert.equal(grade({ type: "fraction", correct: "2,75", answer: "2 3/4" }).isCorrect, true);
});

test("Hỗn số âm: '-1 1/2' = -3/2", () => {
  assert.equal(grade({ type: "fraction", correct: "-3/2", answer: "-1 1/2" }).isCorrect, true);
});

// ── Phần trăm ────────────────────────────────────────────────────────────────
test("Phần trăm: numeric '50%' = 0,5", () => {
  assert.equal(grade({ type: "numeric", correct: "0,5", answer: "50%" }).isCorrect, true);
});

test("Phần trăm: fraction '25%' = 1/4", () => {
  assert.equal(grade({ type: "fraction", correct: "1/4", answer: "25%" }).isCorrect, true);
});

// ── Chẩn đoán lỗi: lệch 1 đơn vị ─────────────────────────────────────────────
test("offByOne: đúng 10, làm 11 → diagnosis offByOne", () => {
  const r = grade({ type: "numeric", correct: "10", answer: "11" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, "offByOne");
});

// ── Tập đáp án không thứ tự (fill-blank unordered) ───────────────────────────
test("Unordered: ['2','4','6'] khớp ['6','2','4'] khi unordered", () => {
  const r = grade({
    type: "fill-blank",
    correct: ["2", "4", "6"],
    answer: ["6", "2", "4"],
    options: { unordered: true },
  });
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
});

test("Unordered tắt (mặc định): sai vị trí → KHÔNG trọn", () => {
  const r = grade({ type: "fill-blank", correct: ["2", "4", "6"], answer: ["6", "2", "4"] });
  assert.equal(r.isCorrect, false); // chấm theo vị trí
});

test("Unordered: thiếu 1 phần tử → điểm theo tỉ lệ", () => {
  const r = grade({
    type: "fill-blank",
    correct: ["2", "4", "6"],
    answer: ["6", "2", "9"],
    options: { unordered: true },
  });
  assert.equal(r.isCorrect, false);
  assert.ok(Math.abs(r.score - 2 / 3) < 1e-9); // khớp 2/3
});

// ── Đơn vị đo lường ──────────────────────────────────────────────────────────
test("Đơn vị: '5 cm' = '5cm' (khoảng trắng)", () => {
  assert.equal(grade({ type: "numeric", correct: "5cm", answer: "5 cm" }).isCorrect, true);
});

test("Đơn vị: quy đổi '1 m' = '100 cm'", () => {
  assert.equal(grade({ type: "numeric", correct: "100 cm", answer: "1 m" }).isCorrect, true);
});

test("Đơn vị: quy đổi '1 kg' = '1000 g'", () => {
  assert.equal(grade({ type: "numeric", correct: "1000 g", answer: "1 kg" }).isCorrect, true);
});

test("Đơn vị: khác đại lượng KHÔNG khớp ('1 m' ≠ '1 kg')", () => {
  assert.equal(grade({ type: "numeric", correct: "1 m", answer: "1 kg" }).isCorrect, false);
});

// ── Số La Mã ─────────────────────────────────────────────────────────────────
test("La Mã: 'IV' = 4; 'XII' = 12", () => {
  assert.equal(grade({ type: "numeric", correct: "4", answer: "IV" }).isCorrect, true);
  assert.equal(grade({ type: "numeric", correct: "12", answer: "xii" }).isCorrect, true);
});

test("La Mã sai → không đúng", () => {
  assert.equal(grade({ type: "numeric", correct: "4", answer: "VI" }).isCorrect, false);
});

// ── Chẩn đoán: đảo chữ số ─────────────────────────────────────────────────────
test("transposed: đúng 12, làm 21 → diagnosis transposed", () => {
  const r = grade({ type: "numeric", correct: "12", answer: "21" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.diagnosis, "transposed");
});

// ── Làm tròn có kiểm soát ─────────────────────────────────────────────────────
test("roundTo: 3,14159 ≈ 3,14 khi roundTo=2", () => {
  const r = grade({
    type: "numeric",
    correct: "3,14159",
    answer: "3,14",
    options: { roundTo: 2 },
  });
  assert.equal(r.isCorrect, true);
});

test("roundTo: không bật → 3,14 ≠ 3,14159", () => {
  assert.equal(grade({ type: "numeric", correct: "3,14159", answer: "3,14" }).isCorrect, false);
});

// ── Multi-select (chọn nhiều đáp án) ─────────────────────────────────────────
test("multi: chọn đúng TẬP → đúng (không phân biệt thứ tự/hoa-thường)", () => {
  const r = grade({ type: "multi", correct: ["A", "C"], answer: ["c", "a"] });
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
});

test("multi: thiếu 1 đáp án → sai", () => {
  assert.equal(grade({ type: "multi", correct: ["A", "C"], answer: ["A"] }).isCorrect, false);
});

test("multi: chọn dư đáp án sai → sai", () => {
  assert.equal(
    grade({ type: "multi", correct: ["A", "C"], answer: ["A", "C", "B"] }).isCorrect,
    false,
  );
});

test("multi: bỏ trống → empty", () => {
  assert.equal(grade({ type: "multi", correct: ["A"], answer: [] }).feedbackCode, "empty");
});

// ── Ordering (sắp thứ tự) ────────────────────────────────────────────────────
test("ordering: đúng thứ tự → đúng (chuẩn hóa hoa/thường)", () => {
  const r = grade({ type: "ordering", correct: ["1", "2", "3"], answer: ["1", "2", "3"] });
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
});

test("ordering: sai thứ tự → sai", () => {
  assert.equal(
    grade({ type: "ordering", correct: ["1", "2", "3"], answer: ["1", "3", "2"] }).isCorrect,
    false,
  );
});

test("ordering: thiếu phần tử → sai", () => {
  assert.equal(
    grade({ type: "ordering", correct: ["a", "b", "c"], answer: ["a", "b"] }).isCorrect,
    false,
  );
});

// ── Matching (nối cặp) — chấm theo vị trí: phải[i] khớp vế trái[i] ───────────
test("matching: ghép đúng → đúng", () => {
  const r = grade({ type: "matching", correct: ["4", "6"], answer: ["4", "6"] });
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
});

test("matching: ghép sai cặp → sai", () => {
  assert.equal(
    grade({ type: "matching", correct: ["4", "6"], answer: ["6", "4"] }).isCorrect,
    false,
  );
});

test("matching: thiếu một cặp → sai", () => {
  assert.equal(grade({ type: "matching", correct: ["4", "6"], answer: ["4"] }).isCorrect, false);
});

// ── Compound (câu nhiều phần a/b/c) ──────────────────────────────────────────
import { gradeCompound } from "../src/grading-engine.ts";

test("compound: mọi phần đúng → isCorrect true, score 1", () => {
  const r = gradeCompound(
    [
      { type: "numeric", correct: "8" },
      { type: "mcq", correct: "B" },
    ],
    ["8", "B"],
  );
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
  assert.equal(r.perPart.length, 2);
});

test("compound: 1/2 phần sai → isCorrect false, score = trung bình", () => {
  const r = gradeCompound(
    [
      { type: "numeric", correct: "8" },
      { type: "mcq", correct: "B" },
    ],
    ["8", "A"],
  );
  assert.equal(r.isCorrect, false);
  assert.equal(r.score, 0.5);
});

test("compound: mảng rỗng → score 0, isCorrect false", () => {
  const r = gradeCompound([], []);
  assert.equal(r.isCorrect, false);
  assert.equal(r.score, 0);
});

test("compound: options riêng từng phần (numeric roundTo)", () => {
  const r = gradeCompound([{ type: "numeric", correct: "1.5", options: { roundTo: 1 } }], ["1.49"]);
  assert.equal(r.isCorrect, true);
});

// ── evalExpr (cho step-grading) ──────────────────────────────────────────────
import { evalExpr } from "../src/grading-engine.ts";
test("evalExpr: tính giá trị tại x; sai định dạng → null", () => {
  assert.equal(evalExpr("2*x+3", 2), 7);
  assert.equal(evalExpr("x^2", 3), 9);
  assert.equal(evalExpr("2(x+1)", 4), 10); // nhân ngầm
  assert.equal(evalExpr(")(", 1), null);
});

// ── Căn bậc hai (√ · sqrt(), D45) ─────────────────────────────────────────────
test("evalExpr: √ và sqrt() cho cùng giá trị", () => {
  assert.equal(evalExpr("√16", 0), 4);
  assert.equal(evalExpr("sqrt(16)", 0), 4);
  assert.equal(evalExpr("√(16)", 0), 4);
});

test("evalExpr: 2√4 = 2*√4 (nhân ngầm trước căn)", () => {
  assert.equal(evalExpr("2√4", 0), 4);
});

test("evalExpr: √4 + 2 = 4 (√ ưu tiên trước +, sau *)", () => {
  assert.equal(evalExpr("√4+2", 0), 4);
  assert.equal(evalExpr("√4*2", 0), 4);
});

test("evalExpr: √(x+1) tính theo biến x", () => {
  assert.equal(evalExpr("√(x+1)", 3), 2);
  assert.equal(evalExpr("√(x+1)", 8), 3);
});

test("evalExpr: căn số âm → null (miền không xác định, không ném lỗi)", () => {
  assert.equal(evalExpr("√(-4)", 0), null);
});

test("expression: √16 ≡ 4 (numeric literal)", () => {
  assert.equal(expressionsEquivalent("√16", "4"), true);
});

test("expression: √4 + x ≡ 2 + x (căn hằng số kết hợp biến)", () => {
  assert.equal(expressionsEquivalent("√4+x", "2+x"), true);
});

test("expression: √(x^2) ≢ x nói chung (mẫu âm cho |x|≠x → không trùng)", () => {
  // √(x^2) = |x|, chỉ bằng x khi x≥0 — mẫu âm (-1,-2,-1.5) làm giá trị lệch → không tương đương.
  assert.equal(expressionsEquivalent("√(x^2)", "x"), false);
});

test("numeric: '√16' ≡ '4' (đáp số HS nhập dạng căn)", () => {
  const r = grade({ type: "numeric", correct: "4", answer: "√16" });
  assert.equal(r.isCorrect, true);
});

test("numeric: 'sqrt(16)+3' ≡ '7'", () => {
  const r = grade({ type: "numeric", correct: "7", answer: "sqrt(16)+3" });
  assert.equal(r.isCorrect, true);
});

test("numeric: '√16' ≠ '5' (sai)", () => {
  const r = grade({ type: "numeric", correct: "5", answer: "√16" });
  assert.equal(r.isCorrect, false);
});

test("numeric bình thường không chứa căn: không bị ảnh hưởng", () => {
  assert.equal(grade({ type: "numeric", correct: "12", answer: "12" }).isCorrect, true);
});

test("expression: √(-4) so bất kỳ → sai (miền không xác định, không throw)", () => {
  const r = grade({ type: "expression", correct: "2", answer: "√(-4)" });
  assert.equal(r.isCorrect, false);
  assert.equal(r.feedbackCode, "incorrect");
});

console.log(`\n${passed} test(s) passed.`);
