/**
 * Unit test quy tắc chấm/nộp.  node --experimental-strip-types --no-warnings tests/grading-policy.test.ts
 */
import assert from "node:assert";
import { isLate, isValidScore, displayScore, aggregateScore } from "../src/grading-policy.ts";

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

console.log("classroom · grading-policy Tests\n");

test("isLate: dueAt null → không bao giờ trễ", () => {
  assert.equal(isLate(1000, null), false);
});

test("isLate: nộp sau hạn → trễ; trước/đúng hạn → không trễ", () => {
  assert.equal(isLate(1001, 1000), true);
  assert.equal(isLate(1000, 1000), false); // đúng hạn
  assert.equal(isLate(999, 1000), false);
});

test("isValidScore: trong [0,1]; loại ngoài khoảng / NaN / vô cực", () => {
  for (const s of [0, 0.5, 1]) assert.equal(isValidScore(s), true, `s=${s}`);
  for (const s of [-0.01, 1.01, NaN, Infinity, -Infinity])
    assert.equal(isValidScore(s), false, `s=${s}`);
});

test("displayScore: ưu tiên final, fallback auto, null cả hai → null", () => {
  assert.equal(displayScore(0.5, 0.9), 0.9);
  assert.equal(displayScore(0.5, null), 0.5);
  assert.equal(displayScore(null, 0.8), 0.8);
  assert.equal(displayScore(null, null), null);
});

test("displayScore: clamp về [0,1] phòng dữ liệu lỗi", () => {
  assert.equal(displayScore(null, 1.5), 1);
  assert.equal(displayScore(-1, null), 0);
});

test("aggregateScore: rỗng → 0; trung bình điểm từng câu", () => {
  assert.equal(aggregateScore([]), 0);
  assert.equal(aggregateScore([{ score: 1 }, { score: 0 }]), 0.5);
  assert.equal(aggregateScore([{ score: 1 }, { score: 1 }, { score: 1 }]), 1);
});

console.log(`\n${passed} test(s) passed.`);
