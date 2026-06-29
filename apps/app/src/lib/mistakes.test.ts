// Test thuần cho wrongQuestionIds (node --experimental-strip-types).
import assert from "node:assert/strict";
import { test } from "node:test";
import { wrongQuestionIds } from "./mistakes.ts";

test("câu chỉ sai → vào danh sách ôn", () => {
  assert.deepEqual(wrongQuestionIds([{ questionId: "q1", isCorrect: false }]), ["q1"]);
});

test("sai rồi sau đó làm đúng → tự loại (latest đúng)", () => {
  const a = [
    { questionId: "q1", isCorrect: false },
    { questionId: "q1", isCorrect: true },
  ];
  assert.deepEqual(wrongQuestionIds(a), []);
});

test("đúng rồi sau đó sai → vẫn cần ôn (latest sai)", () => {
  const a = [
    { questionId: "q1", isCorrect: true },
    { questionId: "q1", isCorrect: false },
  ];
  assert.deepEqual(wrongQuestionIds(a), ["q1"]);
});

test("nhiều câu: chỉ lấy câu latest sai, giữ thứ tự xuất hiện", () => {
  const a = [
    { questionId: "q1", isCorrect: false },
    { questionId: "q2", isCorrect: true },
    { questionId: "q3", isCorrect: false },
    { questionId: "q1", isCorrect: false },
  ];
  assert.deepEqual(wrongQuestionIds(a), ["q1", "q3"]);
});

test("câu luôn đúng → không vào danh sách", () => {
  assert.deepEqual(wrongQuestionIds([{ questionId: "q1", isCorrect: true }]), []);
});

test("rỗng → rỗng", () => {
  assert.deepEqual(wrongQuestionIds([]), []);
});
