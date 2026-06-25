/**
 * Unit test heatmap.  node --experimental-strip-types --no-warnings tests/heatmap.test.ts
 */
import assert from "node:assert";
import { skillWeakness, commonErrorType } from "../src/heatmap.ts";

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

console.log("learning-path · heatmap Tests\n");

test("skillWeakness: xếp kỹ năng yếu nhất (mastery thấp) trước", () => {
  const attempts = [
    { skillId: "strong", isCorrect: true },
    { skillId: "weak", isCorrect: false },
  ];
  const m = new Map([
    ["strong", 0.9],
    ["weak", 0.2],
  ]);
  const cells = skillWeakness(attempts, m);
  assert.equal(cells[0].skillId, "weak");
  assert.equal(cells[0].attempts, 1);
});

test("skillWeakness: recentAccuracy đúng", () => {
  const attempts = [
    { skillId: "s", isCorrect: true },
    { skillId: "s", isCorrect: false },
    { skillId: "s", isCorrect: true },
  ];
  const cells = skillWeakness(attempts, new Map([["s", 0.5]]));
  assert.ok(Math.abs(cells[0].recentAccuracy - 2 / 3) < 1e-9);
});

test("commonErrorType: loại câu sai nhiều nhất → nhãn; bỏ kỹ năng không có câu sai", () => {
  const attempts = [
    { skillId: "frac", questionType: "fraction", isCorrect: false },
    { skillId: "frac", questionType: "fraction", isCorrect: false },
    { skillId: "frac", questionType: "mcq", isCorrect: false },
    { skillId: "ok", questionType: "numeric", isCorrect: true },
  ];
  const labels = commonErrorType(attempts);
  assert.equal(labels.get("frac"), "sai phân số");
  assert.ok(!labels.has("ok"), "kỹ năng không sai → không có nhãn");
});

console.log(`\n${passed} test(s) passed.`);
