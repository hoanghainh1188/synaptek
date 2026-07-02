// Test chấm chính thức (M3 US2).  deno test grade-assignment/index.test.ts
// Kiểm logic thuần gradeSubmission: ẩn đáp án (D4), bỏ câu thiếu (FR-017), chấm tương đương (engine).
import { assertEquals, assert } from "jsr:@std/assert@1";
import { gradeSubmission } from "./index.ts";
import type { AnswerKey } from "../_shared/answer-keys.ts";

const KEYS: Record<string, AnswerKey> = {
  q1: { type: "fraction", correct: "1/2" },
  q2: { type: "numeric", correct: "0.5" },
  q3: { type: "mcq", correct: "A" },
};

Deno.test("chấm tương đương + gộp điểm trung bình", () => {
  const r = gradeSubmission(["q1", "q2", "q3"], { q1: "2/4", q2: "0,5", q3: "A" }, KEYS);
  assertEquals(r.perQuestion.q1.isCorrect, true, "2/4 ≡ 1/2");
  assertEquals(r.perQuestion.q2.isCorrect, true, "0,5 ≡ 0.5 (số VN)");
  assertEquals(r.perQuestion.q3.isCorrect, true);
  assertEquals(r.autoScore, 1);
});

Deno.test("một câu sai → điểm giảm", () => {
  const r = gradeSubmission(["q1", "q3"], { q1: "1/3", q3: "A" }, KEYS);
  assertEquals(r.perQuestion.q1.isCorrect, false);
  assertEquals(r.autoScore, 0.5);
});

Deno.test("ẩn đáp án (D4): mỗi câu chỉ có {isCorrect, feedbackCode}, không lộ đáp án", () => {
  const r = gradeSubmission(["q1"], { q1: "1/2" }, KEYS);
  // Cấu trúc per-question KHÔNG có trường `correct`/đáp án — chỉ kết quả chấm.
  assertEquals(Object.keys(r.perQuestion.q1).sort(), ["feedbackCode", "isCorrect"]);
  assert(!Object.keys(r).includes("correct"), "gốc không có khóa correct");
});

Deno.test("bỏ qua questionId thiếu trong answer-keys (FR-017), không vỡ", () => {
  const r = gradeSubmission(["q1", "khong-co"], { q1: "1/2" }, KEYS);
  assertEquals(Object.keys(r.perQuestion), ["q1"]);
  assertEquals(r.autoScore, 1); // chỉ tính câu có key
});

Deno.test("không câu nào có key → autoScore 0, không lỗi", () => {
  const r = gradeSubmission(["x", "y"], {}, KEYS);
  assertEquals(r.autoScore, 0);
  assertEquals(Object.keys(r.perQuestion).length, 0);
});

// Trình bày từng bước (derivation): chấm lời giải nhiều dòng qua step-grading.
const DERIV_KEYS: Record<string, AnswerKey> = {
  d1: {
    type: "derivation",
    correct: JSON.stringify({ mode: "equation", variable: "x", start: "2x + 3 = 7" }),
  },
  d2: {
    type: "derivation",
    correct: JSON.stringify({ mode: "expression", target: "24", start: "12 + 3*4" }),
  },
};

Deno.test("derivation: lời giải đúng → isCorrect (đạt đích), điểm đầy đủ", () => {
  const r = gradeSubmission(["d1"], { d1: ["2x = 4", "x = 2"] }, DERIV_KEYS);
  assertEquals(r.perQuestion.d1.isCorrect, true);
  assertEquals(r.autoScore, 1);
});

Deno.test("derivation: bước sai → không đạt, feedbackCode incorrect", () => {
  const r = gradeSubmission(["d2"], { d2: ["15 * 4"] }, DERIV_KEYS); // 12+3 trước → 60 ≠ 24
  assertEquals(r.perQuestion.d2.isCorrect, false);
  assertEquals(r.perQuestion.d2.feedbackCode, "incorrect");
});

Deno.test("derivation: ẩn đáp án — chỉ trả {isCorrect, feedbackCode}", () => {
  const r = gradeSubmission(["d1"], { d1: ["2x = 4", "x = 2"] }, DERIV_KEYS);
  assertEquals(Object.keys(r.perQuestion.d1).sort(), ["feedbackCode", "isCorrect"]);
});

// Câu nhiều phần (compound, a/b/c, D43): mỗi phần chấm độc lập qua gradeCompound, điểm = trung bình.
const COMPOUND_KEYS: Record<string, AnswerKey> = {
  c1: {
    type: "compound",
    correct: JSON.stringify([
      { type: "numeric", correct: "8" },
      { type: "mcq", correct: "B" },
    ]),
  },
};

Deno.test("compound: mọi phần đúng → isCorrect true, điểm đầy đủ", () => {
  const r = gradeSubmission(
    ["c1"],
    { c1: [JSON.stringify("8"), JSON.stringify("B")] },
    COMPOUND_KEYS,
  );
  assertEquals(r.perQuestion.c1.isCorrect, true);
  assertEquals(r.autoScore, 1);
});

Deno.test("compound: 1/2 phần sai → isCorrect false, điểm = trung bình (partial)", () => {
  const r = gradeSubmission(
    ["c1"],
    { c1: [JSON.stringify("8"), JSON.stringify("A")] },
    COMPOUND_KEYS,
  );
  assertEquals(r.perQuestion.c1.isCorrect, false);
  assertEquals(r.perQuestion.c1.feedbackCode, "partial");
  assertEquals(r.autoScore, 0.5);
});

Deno.test("compound: ẩn đáp án — chỉ trả {isCorrect, feedbackCode}", () => {
  const r = gradeSubmission(
    ["c1"],
    { c1: [JSON.stringify("8"), JSON.stringify("B")] },
    COMPOUND_KEYS,
  );
  assertEquals(Object.keys(r.perQuestion.c1).sort(), ["feedbackCode", "isCorrect"]);
});

// Compound LỒNG derivation (D44): 1 phần thường + 1 phần "trình bày từng bước".
const COMPOUND_DERIV_KEYS: Record<string, AnswerKey> = {
  c2: {
    type: "compound",
    correct: JSON.stringify([
      { type: "numeric", correct: "8" },
      {
        type: "derivation",
        correct: JSON.stringify({ mode: "equation", variable: "x", start: "2x + 3 = 7" }),
      },
    ]),
  },
};

Deno.test("compound lồng derivation: mọi phần đúng → isCorrect true, điểm đầy đủ", () => {
  const r = gradeSubmission(
    ["c2"],
    { c2: [JSON.stringify("8"), JSON.stringify(["2x = 4", "x = 2"])] },
    COMPOUND_DERIV_KEYS,
  );
  assertEquals(r.perQuestion.c2.isCorrect, true);
  assertEquals(r.autoScore, 1);
});

Deno.test("compound lồng derivation: bước derivation sai → isCorrect false, điểm giảm", () => {
  const r = gradeSubmission(
    ["c2"],
    { c2: [JSON.stringify("8"), JSON.stringify(["x = 3"])] }, // sai tập nghiệm
    COMPOUND_DERIV_KEYS,
  );
  assertEquals(r.perQuestion.c2.isCorrect, false);
  assertEquals(r.perQuestion.c2.feedbackCode, "partial");
  assert(r.autoScore > 0 && r.autoScore < 1);
});

// Bảo đảm kiểu AnswerKey dùng được (khớp answer-keys tự sinh).
const _typecheck: AnswerKey = { type: "mcq", correct: "A" };
void _typecheck;
