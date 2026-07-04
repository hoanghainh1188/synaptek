/**
 * Test session reducer — node --experimental-strip-types. Không cần render/DB.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Question } from "@synaptek/curriculum";
import {
  startSession,
  sessionReducer,
  sessionResult,
  currentQuestion,
  currentRecord,
  progress,
} from "./session.ts";

const root = join(import.meta.dirname, "../../../..");
const fractions: Question[] = JSON.parse(
  readFileSync(join(root, "content/questions/g4.num.fractions.json"), "utf8"),
);

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

console.log("Session Reducer Tests\n");

test("startSession: bắt đầu ở answering, câu đầu", () => {
  const s = startSession("g4.num.fractions", fractions);
  assert.equal(s.status, "answering");
  assert.equal(currentQuestion(s)?.id, fractions[0].id);
  assert.deepEqual(progress(s), { position: 1, total: fractions.length });
});

test("startSession: chủ đề rỗng → finished", () => {
  assert.equal(startSession("x", []).status, "finished");
});

test("answer đúng (tương đương): ghi nhận + sang feedback", () => {
  // q004: fraction "Rút gọn 2/4" correct 1/2 → nhập "0,5" vẫn đúng
  const base = startSession("g4.num.fractions", fractions);
  const q4 = { ...base, index: fractions.findIndex((q) => q.id === "g4.num.fractions.q004") };
  const s = sessionReducer(q4, { type: "answer", answer: "0,5" });
  assert.equal(s.status, "feedback");
  assert.equal(currentRecord(s)?.isCorrect, true);
});

test("answer sai: ghi nhận isCorrect=false", () => {
  const s = sessionReducer(startSession("t", fractions), { type: "answer", answer: "9/9" });
  assert.equal(s.status, "feedback");
  assert.equal(currentRecord(s)?.isCorrect, false);
});

test("answer bỏ trống: hint=empty, KHÔNG ghi nhận, ở lại answering", () => {
  const s = sessionReducer(startSession("t", fractions), { type: "answer", answer: "" });
  assert.equal(s.status, "answering");
  assert.equal(s.hint, "empty");
  assert.equal(s.records.length, 0);
});

test("next: tiến sang câu kế; cuối phiên → finished", () => {
  let s = startSession("t", fractions.slice(0, 2));
  s = sessionReducer(s, { type: "answer", answer: "1/2" }); // câu 1 → feedback
  s = sessionReducer(s, { type: "next" }); // → câu 2
  assert.equal(s.status, "answering");
  assert.equal(s.index, 1);
  s = sessionReducer(s, { type: "answer", answer: "true" }); // câu 2 → feedback
  s = sessionReducer(s, { type: "next" }); // hết → finished
  assert.equal(s.status, "finished");
});

test("sessionResult: tổng/đúng/điểm + danh sách sai", () => {
  let s = startSession("t", fractions.slice(0, 2));
  s = sessionReducer(s, { type: "answer", answer: "1/2" }); // q001 mcq, đúng "1/2"
  s = sessionReducer(s, { type: "next" });
  s = sessionReducer(s, { type: "answer", answer: "Sai" }); // q002 true-false (correct=true) → sai
  s = sessionReducer(s, { type: "next" });
  const r = sessionResult(s);
  assert.equal(r.total, 2);
  assert.equal(r.correct, 1);
  assert.equal(r.partial, 0); // không có câu đúng-một-phần trong ca này
  assert.equal(r.wrong.length, 1);
  assert.equal(r.wrong[0].id, "g4.num.fractions.q002");
});

test("sessionResult: đúng MỘT PHẦN (fill-blank) → không tính correct, partial=1, điểm thành phần", () => {
  const fb: Question = {
    id: "fb1",
    skillId: "s",
    grade: 4,
    type: "fill-blank",
    prompt: "__ và __",
    correct: ["1", "2"],
    explanation: "e",
  };
  let s = startSession("t", [fb]);
  s = sessionReducer(s, { type: "answer", answer: ["1", "3"] }); // đúng 1/2 chỗ
  s = sessionReducer(s, { type: "next" });
  const r = sessionResult(s);
  assert.equal(r.correct, 0); // chưa đúng trọn vẹn
  assert.equal(r.partial, 1); // đúng một phần
  assert.equal(r.wrong.length, 1); // vẫn vào "cần ôn lại"
  assert.ok(r.score > 0 && r.score < 1, `score=${r.score} phải trong (0,1)`);
});

test("guard: answer khi đang feedback bị bỏ qua", () => {
  let s = startSession("t", fractions);
  s = sessionReducer(s, { type: "answer", answer: "1/2" });
  const again = sessionReducer(s, { type: "answer", answer: "khác" });
  assert.equal(again, s); // không đổi
});

console.log(`\n${passed} test(s) passed.`);
