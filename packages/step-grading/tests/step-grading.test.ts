import assert from "node:assert/strict";
import { test } from "node:test";
import { gradeDerivation } from "../src/step-grading.ts";

// ── expression (rút gọn): mỗi dòng ≡ dòng trước về GIÁ TRỊ ──────────────────────
test("expression: mọi bước hợp lệ + đạt target → full", () => {
  const r = gradeDerivation(["2(x+2)", "2x+4", "2x+4"], { mode: "expression", target: "2x+4" });
  assert.equal(r.firstErrorIndex, -1);
  assert.equal(r.validSteps, 2);
  assert.equal(r.totalSteps, 2);
  assert.equal(r.reachedGoal, true);
  assert.equal(r.score, 1);
});

test("expression: sai ở bước 2 → định vị firstErrorIndex=2, score thành phần", () => {
  // 2(x+1)=2x+2 (đúng) → 2x+5 (SAI, không tương đương)
  const r = gradeDerivation(["2(x+1)", "2x+2", "2x+5"], { mode: "expression" });
  assert.equal(r.firstErrorIndex, 2);
  assert.equal(r.validSteps, 1);
  assert.equal(r.totalSteps, 2);
  assert.equal(r.score, 0.5);
  assert.equal(r.reachedGoal, false);
});

test("expression: nhiều cách viết tương đương đều nhận (x*x ≡ x^2)", () => {
  const r = gradeDerivation(["x^2", "x*x"], { mode: "expression" });
  assert.equal(r.firstErrorIndex, -1);
  assert.equal(r.validSteps, 1);
});

// ── equation (giải PT): mỗi dòng cùng TẬP NGHIỆM dòng trước ─────────────────────
test("equation: 2x+3=7 → 2x=4 → x=2 hợp lệ + đạt đích (x=số)", () => {
  const r = gradeDerivation(["2x+3=7", "2x=4", "x=2"], { mode: "equation" });
  assert.equal(r.firstErrorIndex, -1);
  assert.equal(r.validSteps, 2);
  assert.equal(r.reachedGoal, true);
  assert.equal(r.score, 1);
});

test("equation: bước sai (đổi tập nghiệm) → bắt được", () => {
  // 2x=4 (x=2) → x=3 (SAI: khác tập nghiệm)
  const r = gradeDerivation(["2x=4", "x=3"], { mode: "equation" });
  assert.equal(r.firstErrorIndex, 1);
  assert.equal(r.validSteps, 0);
  assert.equal(r.reachedGoal, false);
});

test("equation: chưa cô lập biến → reachedGoal=false dù bước đúng", () => {
  const r = gradeDerivation(["2x+3=7", "2x=4"], { mode: "equation" });
  assert.equal(r.firstErrorIndex, -1);
  assert.equal(r.validSteps, 1);
  assert.equal(r.reachedGoal, false);
});

// ── biên ───────────────────────────────────────────────────────────────────────
test("một dòng (chỉ đề) → totalSteps 0, score 0", () => {
  const r = gradeDerivation(["2x+3=7"], { mode: "equation" });
  assert.equal(r.totalSteps, 0);
  assert.equal(r.score, 0);
  assert.equal(r.reachedGoal, false);
});
