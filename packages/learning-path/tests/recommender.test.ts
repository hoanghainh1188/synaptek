/**
 * Unit test recommender.  node --experimental-strip-types --no-warnings tests/recommender.test.ts
 */
import assert from "node:assert";
import { recommendNext, type SkillNode } from "../src/recommender.ts";

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

console.log("learning-path · recommender Tests\n");

// DAG: A (gốc) → B → C ; D phụ thuộc A
const skills: SkillNode[] = [
  { id: "A", prerequisites: [], hasQuestions: true },
  { id: "B", prerequisites: ["A"], hasQuestions: true },
  { id: "C", prerequisites: ["B"], hasQuestions: true },
  { id: "D", prerequisites: ["A"], hasQuestions: true },
];
const NOW = Date.parse("2026-06-25T00:00:00Z");

test("Không đề xuất kỹ năng có tiên quyết chưa đạt (C khi B chưa đạt)", () => {
  const m = new Map([
    ["A", 0.96],
    ["B", 0.3],
    ["C", 0.2],
  ]);
  const recs = recommendNext(skills, m, { now: NOW, dueAt: new Map() });
  const ids = recs.map((r) => r.skillId);
  assert.ok(ids.includes("B"));
  assert.ok(!ids.includes("C"), "C không được đề xuất");
  assert.ok(!ids.includes("A"), "A đã đạt → loại");
});

test("0 vi phạm tiên quyết trên mọi kết quả (SC-002)", () => {
  const masteries = [
    new Map([["A", 0.96]]),
    new Map([
      ["A", 0.96],
      ["B", 0.96],
    ]),
    new Map<string, number>(),
  ];
  for (const m of masteries) {
    const recs = recommendNext(skills, m, { now: NOW, dueAt: new Map() });
    for (const r of recs) {
      const node = skills.find((s) => s.id === r.skillId)!;
      for (const p of node.prerequisites) {
        assert.ok((m.get(p) ?? 0) >= 0.95, `${r.skillId} có tiên quyết ${p} chưa đạt`);
      }
    }
  }
});

test("Kỹ năng đến hạn ôn xếp trước kỹ năng mới", () => {
  const m = new Map([
    ["A", 0.96],
    ["B", 0.5],
    ["D", 0.5],
  ]);
  const dueAt = new Map([["D", NOW - 86400000]]); // D quá hạn 1 ngày
  const recs = recommendNext(skills, m, { now: NOW, dueAt });
  assert.equal(recs[0].skillId, "D");
  assert.equal(recs[0].reason, "due");
});

test("hasQuestions=false → loại khỏi lộ trình", () => {
  const noQ: SkillNode[] = [{ id: "A", prerequisites: [], hasQuestions: false }];
  const recs = recommendNext(noQ, new Map(), { now: NOW, dueAt: new Map() });
  assert.equal(recs.length, 0);
});

test("limit cắt số lượng; priority tăng dần từ 0", () => {
  const m = new Map([["A", 0.96]]);
  const recs = recommendNext(skills, m, { now: NOW, dueAt: new Map(), limit: 2 });
  assert.equal(recs.length, 2);
  assert.deepEqual(
    recs.map((r) => r.priority),
    [0, 1],
  );
});

console.log(`\n${passed} test(s) passed.`);
