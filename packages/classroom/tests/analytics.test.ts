/**
 * Unit test phân tích lớp.  node --experimental-strip-types --no-warnings tests/analytics.test.ts
 */
import assert from "node:assert";
import { assignmentProgress, classWeakSkills } from "../src/analytics.ts";

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

console.log("classroom · analytics Tests\n");

test("assignmentProgress: đếm đúng nộp + trung bình điểm hiển thị (final ?? auto)", () => {
  const p = assignmentProgress(
    ["s1", "s2", "s3"],
    [
      { studentId: "s1", autoScore: 0.5, finalScore: 1 }, // final thắng → 1
      { studentId: "s2", autoScore: 0.5, finalScore: null }, // → 0.5
    ],
  );
  assert.equal(p.totalStudents, 3);
  assert.equal(p.submittedCount, 2);
  assert.equal(p.averageScore, 0.75); // (1 + 0.5)/2
});

test("assignmentProgress: chưa ai nộp → averageScore null, submittedCount 0", () => {
  const p = assignmentProgress(["s1", "s2"], []);
  assert.equal(p.submittedCount, 0);
  assert.equal(p.averageScore, null);
});

test("assignmentProgress: BỎ bài nộp của người KHÔNG thuộc lớp (chỉ memberIds — SC-005)", () => {
  const p = assignmentProgress(
    ["s1"],
    [
      { studentId: "s1", autoScore: 1, finalScore: null },
      { studentId: "ngoai", autoScore: 0, finalScore: null }, // không trong memberIds → bỏ
    ],
  );
  assert.equal(p.submittedCount, 1);
  assert.equal(p.averageScore, 1);
});

test("classWeakSkills: trung bình mastery mỗi kỹ năng theo HS trong lớp, yếu nhất trước", () => {
  const weak = classWeakSkills([
    {
      studentId: "s1",
      mastery: new Map([
        ["a", 0.2],
        ["b", 0.9],
      ]),
    },
    {
      studentId: "s2",
      mastery: new Map([
        ["a", 0.4],
        ["b", 0.7],
      ]),
    },
  ]);
  assert.deepEqual(
    weak.map((w) => w.skillId),
    ["a", "b"],
  ); // a (0.3) yếu hơn b (0.8)
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  assert.equal(r3(weak[0].avgMastery), 0.3);
  assert.equal(r3(weak[1].avgMastery), 0.8);
});

test("classWeakSkills: limit cắt số kỹ năng trả về", () => {
  const weak = classWeakSkills(
    [
      {
        studentId: "s1",
        mastery: new Map([
          ["a", 0.1],
          ["b", 0.2],
          ["c", 0.3],
        ]),
      },
    ],
    2,
  );
  assert.equal(weak.length, 2);
  assert.deepEqual(
    weak.map((w) => w.skillId),
    ["a", "b"],
  );
});

test("classWeakSkills: rỗng → []", () => {
  assert.deepEqual(classWeakSkills([]), []);
});

console.log(`\n${passed} test(s) passed.`);
