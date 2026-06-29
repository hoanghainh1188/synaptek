import assert from "node:assert/strict";
import { test } from "node:test";
import { atRiskStudents, classTrend } from "./report-insights.ts";

const report = {
  assignments: [
    { id: "a1", title: "Bài 1" },
    { id: "a2", title: "Bài 2" },
  ],
  rows: [
    { studentId: "s1", name: "An", scores: { a1: 1, a2: 0.9 }, average: 0.95 }, // ổn
    { studentId: "s2", name: "Bình", scores: { a1: 0.3, a2: 0.4 }, average: 0.35 }, // điểm thấp
    { studentId: "s3", name: "Cường", scores: { a1: null, a2: null }, average: null }, // bỏ hết
    { studentId: "s4", name: "Dũng", scores: { a1: 0.9, a2: null }, average: 0.9 }, // nộp 1/2 (bỏ nhiều? 50% không <50%)
  ],
};

test("atRisk: HS điểm thấp / bỏ nhiều bài; bỏ qua HS ổn", () => {
  const r = atRiskStudents(report);
  const names = r.map((x) => x.name);
  assert.ok(names.includes("Bình")); // điểm thấp
  assert.ok(names.includes("Cường")); // bỏ hết
  assert.ok(!names.includes("An")); // ổn → không cảnh báo
  // Cường (TB null→0) rủi ro cao nhất → đứng đầu
  assert.equal(r[0].name, "Cường");
});

test("atRisk: lý do phân loại đúng", () => {
  const r = atRiskStudents(report);
  assert.equal(r.find((x) => x.name === "Bình")?.reason, "low-score");
  assert.equal(r.find((x) => x.name === "Cường")?.reason, "missing"); // chưa nộp gì → chỉ "missing"
});

test("atRisk: lớp chưa có bài → []", () => {
  assert.deepEqual(atRiskStudents({ assignments: [], rows: report.rows }), []);
});

test("classTrend: điểm TB lớp theo bài + đếm nộp", () => {
  const t = classTrend(report);
  assert.equal(t.length, 2);
  // Bài 1: (1+0.3+0.9)/3 = 0.7333 (3 HS nộp; Cường null bỏ)
  assert.equal(t[0].n, 3);
  assert.ok(Math.abs((t[0].avg ?? 0) - (1 + 0.3 + 0.9) / 3) < 1e-9);
});
