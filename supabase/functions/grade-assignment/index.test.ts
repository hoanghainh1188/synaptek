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

// Bảo đảm kiểu AnswerKey dùng được (khớp answer-keys tự sinh).
const _typecheck: AnswerKey = { type: "mcq", correct: "A" };
void _typecheck;
