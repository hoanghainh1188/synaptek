/**
 * Unit test diagnostic.  node --experimental-strip-types --no-warnings tests/diagnostic.test.ts
 */
import assert from "node:assert";
import { buildDiagnostic } from "../src/diagnostic.ts";
import type { SkillNode } from "../src/recommender.ts";

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

console.log("learning-path · diagnostic Tests\n");

const skills: SkillNode[] = [
  { id: "root1", prerequisites: [], hasQuestions: true },
  { id: "root2", prerequisites: [], hasQuestions: true },
  { id: "mid", prerequisites: ["root1"], hasQuestions: true },
  { id: "leaf", prerequisites: ["mid"], hasQuestions: true },
  { id: "noq", prerequisites: [], hasQuestions: true }, // không có câu hỏi trong map
];
const qbs = new Map<string, string[]>([
  ["root1", ["q-r1-a", "q-r1-b"]],
  ["root2", ["q-r2-a"]],
  ["mid", ["q-mid-a"]],
  ["leaf", ["q-leaf-a"]],
]);

test("≤ max câu", () => {
  assert.ok(buildDiagnostic(skills, qbs, { max: 3 }).length <= 3);
});

test("Chỉ chọn kỹ năng có câu hỏi (bỏ 'noq')", () => {
  const ids = buildDiagnostic(skills, qbs, { max: 8 });
  assert.ok(!ids.some((q) => q.startsWith("q-noq")));
  assert.ok(ids.length <= 4); // chỉ 4 kỹ năng có câu hỏi
});

test("Ưu tiên kỹ năng gốc (root) khi max nhỏ", () => {
  const ids = buildDiagnostic(skills, qbs, { max: 2 });
  // 2 kỹ năng ít tiên quyết nhất = root1, root2 → câu thuộc chúng
  assert.ok(ids.every((q) => q.startsWith("q-r1") || q.startsWith("q-r2")));
});

test("Tất định theo seed", () => {
  const a = buildDiagnostic(skills, qbs, { max: 4, seed: 7 });
  const b = buildDiagnostic(skills, qbs, { max: 4, seed: 7 });
  assert.deepEqual(a, b);
});

test("Mỗi kỹ năng tối đa 1 câu (không trùng kỹ năng)", () => {
  const ids = buildDiagnostic(skills, qbs, { max: 8 });
  assert.equal(new Set(ids).size, ids.length);
});

console.log(`\n${passed} test(s) passed.`);
