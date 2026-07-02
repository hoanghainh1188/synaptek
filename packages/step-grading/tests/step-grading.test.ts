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

// ── gradeCompoundParts (câu nhiều phần LỒNG derivation, D44) ────────────────────
import { gradeCompoundParts, type CompoundPartSpec } from "../src/step-grading.ts";

test("compound lồng derivation: mọi phần đúng → isCorrect true, score 1", () => {
  const parts: CompoundPartSpec[] = [
    { type: "numeric", correct: "8" },
    {
      type: "derivation",
      correct: JSON.stringify({ mode: "equation", variable: "x", start: "2x + 3 = 7" }),
    },
  ];
  const r = gradeCompoundParts(parts, ["8", ["2x = 4", "x = 2"]]);
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
  assert.equal(r.perPart.length, 2);
});

test("compound lồng derivation: phần derivation sai bước → isCorrect false, score giảm", () => {
  const parts: CompoundPartSpec[] = [
    { type: "numeric", correct: "8" },
    {
      type: "derivation",
      correct: JSON.stringify({ mode: "equation", variable: "x", start: "2x + 3 = 7" }),
    },
  ];
  const r = gradeCompoundParts(parts, ["8", ["x = 3"]]); // sai tập nghiệm
  assert.equal(r.isCorrect, false);
  assert.equal(r.perPart[1].isCorrect, false);
  assert.ok(r.score < 1 && r.score > 0);
});

test("compound lồng derivation: spec hỏng → phần đó tính sai, không vỡ", () => {
  const parts: CompoundPartSpec[] = [{ type: "derivation", correct: "not-json" }];
  const r = gradeCompoundParts(parts, [["x = 2"]]);
  assert.equal(r.isCorrect, false);
  assert.equal(r.score, 0);
});

test("compound toàn phần thường (không derivation) vẫn hoạt động", () => {
  const parts: CompoundPartSpec[] = [
    { type: "numeric", correct: "8" },
    { type: "mcq", correct: "B" },
  ];
  const r = gradeCompoundParts(parts, ["8", "B"]);
  assert.equal(r.isCorrect, true);
  assert.equal(r.score, 1);
});
