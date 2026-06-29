import assert from "node:assert/strict";
import { test } from "node:test";
import { pickForStudent } from "../src/pool.ts";

const POOL = ["q1", "q2", "q3", "q4", "q5", "q6"];

test("tất định: cùng seed → cùng kết quả", () => {
  const a = pickForStudent(POOL, 3, "asg|hsA");
  const b = pickForStudent(POOL, 3, "asg|hsA");
  assert.deepEqual(a, b);
  assert.equal(a.length, 3);
});

test("chọn đúng số lượng + là tập con hợp lệ (không trùng)", () => {
  const r = pickForStudent(POOL, 4, "asg|hsB");
  assert.equal(r.length, 4);
  assert.equal(new Set(r).size, 4); // không trùng
  for (const id of r) assert.ok(POOL.includes(id));
});

test("seed khác → thường khác bộ (chống chép)", () => {
  const a = pickForStudent(POOL, 3, "asg|hsA");
  const b = pickForStudent(POOL, 3, "asg|hsZZZ");
  assert.notDeepEqual(a, b); // rất khó trùng với pool 6 chọn 3
});

test("pick >= pool hoặc <= 0 → trả nguyên pool (không random)", () => {
  assert.deepEqual(pickForStudent(POOL, 6, "s"), POOL);
  assert.deepEqual(pickForStudent(POOL, 10, "s"), POOL);
  assert.deepEqual(pickForStudent(POOL, 0, "s"), POOL);
});
