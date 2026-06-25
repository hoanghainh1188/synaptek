/**
 * Unit test mastery view-model.  node --experimental-strip-types --no-warnings src/lib/mastery.test.ts
 */
import assert from "node:assert";
import { toSkillAttempts, buildMasteryMap, applySession } from "./mastery.ts";

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

console.log("app · mastery Tests\n");

const skillOf = (qid: string): string | undefined =>
  ({ q1: "skillA", q2: "skillA", q3: "skillB" })[qid];

test("toSkillAttempts: ưu tiên field skillId, fallback skillOf", () => {
  const out = toSkillAttempts(
    [
      { questionId: "q1", isCorrect: true }, // fallback → skillA
      { questionId: "qX", skillId: "skillC", isCorrect: false }, // field
    ],
    skillOf,
  );
  assert.deepEqual(out, [
    { skillId: "skillA", isCorrect: true },
    { skillId: "skillC", isCorrect: false },
  ]);
});

test("toSkillAttempts: bỏ attempt không xác định kỹ năng", () => {
  const out = toSkillAttempts([{ questionId: "unknown", isCorrect: true }], skillOf);
  assert.equal(out.length, 0);
});

test("buildMasteryMap: đúng nhiều → mastery cao hơn sai nhiều", () => {
  const m = buildMasteryMap([
    { skillId: "skillA", isCorrect: true },
    { skillId: "skillA", isCorrect: true },
    { skillId: "skillB", isCorrect: false },
  ]);
  assert.ok(m.get("skillA")! > m.get("skillB")!);
});

test("applySession: gập phiên lên mastery trước; kỹ năng chưa có dùng pInit", () => {
  const prior = new Map([["skillA", 0.5]]);
  const next = applySession(prior, [
    { skillId: "skillA", isCorrect: true },
    { skillId: "skillB", isCorrect: true },
  ]);
  assert.ok(next.get("skillA")! > 0.5, "skillA tăng");
  assert.ok(next.has("skillB"), "skillB mới được thêm");
  assert.equal(prior.has("skillB"), false, "không đột biến prior");
});

console.log(`\n${passed} test(s) passed.`);
