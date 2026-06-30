import assert from "node:assert/strict";
import { test } from "node:test";
import { gradeDerivation } from "@synaptek/step-grading";
import { STEP_PROBLEMS, normalizeMathInput } from "./step-problems.ts";

test("normalizeMathInput: × ÷ − → * / -", () => {
  assert.equal(normalizeMathInput("12 × 3 ÷ 2 − 1"), "12 * 3 / 2 - 1");
});

test("mọi seed problem có lời giải đúng chấm full (qua engine)", () => {
  // Lời giải mẫu cho từng bài → đảm bảo dữ liệu seed hợp lệ với engine.
  const solutions: Record<string, string[]> = {
    "arith-1": ["12 + 3*4", "12 + 12", "24"],
    "arith-2": ["(10 - 4)*5", "6*5", "30"],
    "arith-3": ["100 - 25*2", "100 - 50", "50"],
    "eq-1": ["2x + 3 = 7", "2x = 4", "x = 2"],
    "eq-2": ["3x - 1 = 8", "3x = 9", "x = 3"],
  };
  for (const p of STEP_PROBLEMS) {
    const r = gradeDerivation(solutions[p.id], {
      mode: p.mode,
      variable: p.variable,
      target: p.target,
    });
    assert.equal(r.firstErrorIndex, -1, `${p.id}: lời giải mẫu phải hợp lệ`);
    assert.equal(r.reachedGoal, true, `${p.id}: phải đạt đích`);
    assert.equal(r.score, 1, `${p.id}: full điểm`);
  }
});
