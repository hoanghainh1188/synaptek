/**
 * Unit test path view-model.  node --experimental-strip-types --no-warnings src/lib/path.test.ts
 */
import assert from "node:assert";
import { buildSkillNodes, buildPath } from "./path.ts";
import type { Grade } from "@synaptek/curriculum";

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

console.log("app · path Tests\n");

const grades = [
  {
    grade: 4,
    strands: [],
    skills: [
      { id: "A", name: "A", prerequisites: [] },
      { id: "B", name: "B", prerequisites: ["A"] },
      { id: "C", name: "C", prerequisites: ["B"] },
    ],
  },
] as unknown as Grade[];

test("buildSkillNodes: gắn hasQuestions theo tập kỹ năng có câu hỏi", () => {
  const nodes = buildSkillNodes(grades, new Set(["A", "B"]));
  assert.equal(nodes.find((n) => n.id === "A")!.hasQuestions, true);
  assert.equal(nodes.find((n) => n.id === "C")!.hasQuestions, false);
});

test("buildPath: gate tiên quyết + chia nhóm due/next", () => {
  const nodes = buildSkillNodes(grades, new Set(["A", "B", "C"]));
  const now = Date.parse("2026-06-25T00:00:00Z");
  const mastery = new Map([
    ["A", 0.96],
    ["B", 0.4],
  ]);
  const dueAt = new Map([["B", now - 86400000]]); // B quá hạn
  const path = buildPath(nodes, mastery, { now, dueAt });
  assert.deepEqual(
    path.due.map((r) => r.skillId),
    ["B"],
  );
  // C bị loại (tiên quyết B chưa đạt); A đã đạt → loại
  assert.ok(!path.due.concat(path.next).some((r) => r.skillId === "C"));
  assert.ok(!path.due.concat(path.next).some((r) => r.skillId === "A"));
});

test("SC-007: kỹ năng due_at quá khứ luôn vào mục 'đến hạn' (in-app, không phụ thuộc push)", () => {
  const nodes = buildSkillNodes(grades, new Set(["A", "B"]));
  const now = Date.parse("2026-06-26T00:00:00Z");
  const mastery = new Map([
    ["A", 0.97],
    ["B", 0.5],
  ]);
  // B đến hạn từ 3 ngày trước → phải hiện ở 'due' (đây là nguồn cho mục "đến hạn ôn" ở trang chủ).
  const dueAt = new Map([["B", now - 3 * 86_400_000]]);
  const path = buildPath(nodes, mastery, { now, dueAt });
  assert.ok(
    path.due.some((r) => r.skillId === "B"),
    "B quá hạn phải nằm trong path.due",
  );
});

console.log(`\n${passed} test(s) passed.`);
