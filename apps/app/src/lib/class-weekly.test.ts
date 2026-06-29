import assert from "node:assert/strict";
import { test } from "node:test";
import { classWeekly } from "./class-weekly.ts";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const ago = (d: number) => new Date(NOW - d * 86400000).toISOString();

test("đếm lượt nộp + độ chính xác + HS hoạt động trong tuần", () => {
  const r = classWeekly(
    [
      { studentId: "a", submittedAt: ago(1), displayScore: 1 },
      { studentId: "a", submittedAt: ago(2), displayScore: 0.5 }, // a nộp 2 lượt
      { studentId: "b", submittedAt: ago(3), displayScore: 0 },
      { studentId: "c", submittedAt: ago(10), displayScore: 1 }, // quá cũ → bỏ
    ],
    NOW,
  );
  assert.equal(r.submitted, 3);
  assert.equal(r.activeStudents, 2); // a, b
  assert.ok(Math.abs((r.accuracy ?? 0) - (1 + 0.5 + 0) / 3) < 1e-9);
});

test("chưa nộp gì → 0 / null", () => {
  const r = classWeekly([{ studentId: "a", submittedAt: null, displayScore: null }], NOW);
  assert.equal(r.submitted, 0);
  assert.equal(r.accuracy, null);
  assert.equal(r.activeStudents, 0);
});
