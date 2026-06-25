/**
 * Unit test BKT.  node --experimental-strip-types --no-warnings tests/bkt.test.ts
 */
import assert from "node:assert";
import { updateMastery, initFromDiagnostic, DEFAULT_BKT, MASTERED } from "../src/bkt.ts";

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

console.log("learning-path · bkt Tests\n");

test("Đúng → mastery tăng (đơn điệu) với mọi prior trong (0,1)", () => {
  for (const x of [0.05, 0.2, 0.5, 0.8, 0.94]) {
    assert.ok(updateMastery(x, true) > x, `prior=${x}`);
  }
});

test("Chuỗi toàn đúng → hội tụ về phía 1, vượt MASTERED", () => {
  let m = DEFAULT_BKT.pInit;
  for (let i = 0; i < 12; i++) m = updateMastery(m, true);
  assert.ok(m >= MASTERED, `m=${m}`);
});

test("Sai cho kết quả thấp hơn đúng tại cùng prior", () => {
  for (const x of [0.2, 0.5, 0.8]) {
    assert.ok(updateMastery(x, false) < updateMastery(x, true), `prior=${x}`);
  }
});

test("Sai ở mastery cao → giảm", () => {
  assert.ok(updateMastery(0.9, false) < 0.9);
});

test("Luôn trong [0,1], kể cả biên", () => {
  for (const x of [0, 1, -0.5, 1.5]) {
    for (const c of [true, false]) {
      const m = updateMastery(x, c);
      assert.ok(m >= 0 && m <= 1, `x=${x} correct=${c} → ${m}`);
    }
  }
});

test("Tất định: cùng input → cùng output", () => {
  assert.equal(updateMastery(0.42, true), updateMastery(0.42, true));
});

test("Đổi tham số vẫn cho kết quả hữu hạn trong [0,1] (không nhảy bậc — FR-020)", () => {
  for (const pLearn of [0, 0.1, 0.3, 0.5]) {
    const m = updateMastery(0.5, true, { ...DEFAULT_BKT, pLearn });
    assert.ok(Number.isFinite(m) && m >= 0 && m <= 1, `pLearn=${pLearn}`);
  }
});

test("initFromDiagnostic: gập nhiều câu/kỹ năng, đúng nhiều → cao hơn sai nhiều", () => {
  const m = initFromDiagnostic([
    { skillId: "a", isCorrect: true },
    { skillId: "a", isCorrect: true },
    { skillId: "b", isCorrect: false },
    { skillId: "b", isCorrect: false },
  ]);
  assert.ok(m.get("a")! > m.get("b")!);
  assert.ok(!m.has("c")); // kỹ năng không chạm → không có
});

console.log(`\n${passed} test(s) passed.`);
