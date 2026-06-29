/**
 * Unit test cho bộ chấm bài — chạy KHÔNG cần mạng/DB.
 *   node --experimental-strip-types --no-warnings tests/grading-engine.test.ts
 *
 * Đây là "moat" của Synaptek: chấm tương đương (phân số/biểu thức) phải chính xác và
 * đáng tin — engine chạy ở cả client (phản hồi tức thì) lẫn Edge Function (chấm chính thức).
 */
import assert from "node:assert";
import { grade } from "../src/grading-engine.ts";

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

console.log(`\n${passed} test(s) passed.`);
