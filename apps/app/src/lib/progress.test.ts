import assert from "node:assert";
import { aggregateProgress } from "./progress.ts";

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

console.log("Progress Tests\n");

// topicOf: q bắt đầu "f" → chủ đề fractions, "g" → geo
const topicOf = (qid: string) =>
  qid.startsWith("f") ? "fractions" : qid.startsWith("g") ? "geo" : undefined;

test("gộp theo chủ đề: đếm câu phân biệt + đúng phân biệt", () => {
  const p = aggregateProgress(
    [
      { questionId: "f1", isCorrect: true },
      { questionId: "f2", isCorrect: false },
      { questionId: "g1", isCorrect: true },
    ],
    topicOf,
  );
  assert.deepEqual(p.fractions, { topicId: "fractions", attempted: 2, correct: 1 });
  assert.deepEqual(p.geo, { topicId: "geo", attempted: 1, correct: 1 });
});

test("làm lại cùng câu KHÔNG đếm trùng (phân biệt)", () => {
  const p = aggregateProgress(
    [
      { questionId: "f1", isCorrect: false },
      { questionId: "f1", isCorrect: true }, // làm lại, đúng
    ],
    topicOf,
  );
  assert.deepEqual(p.fractions, { topicId: "fractions", attempted: 1, correct: 1 });
});

test("question không map được chủ đề → bỏ qua", () => {
  const p = aggregateProgress([{ questionId: "x9", isCorrect: true }], topicOf);
  assert.deepEqual(p, {});
});

test("rỗng → {}", () => {
  assert.deepEqual(aggregateProgress([], topicOf), {});
});

console.log(`\n${passed} test(s) passed.`);
