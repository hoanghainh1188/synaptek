import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQuickSet } from "./quick-set.ts";

test("round-robin trộn đều các kỹ năng", () => {
  const r = buildQuickSet([["a1", "a2", "a3"], ["b1", "b2"], ["c1"]], 4);
  assert.deepEqual(r, ["a1", "b1", "c1", "a2"]); // lấy lần lượt theo tầng
});

test("đủ cap thì dừng; không trùng", () => {
  const r = buildQuickSet(
    [
      ["a1", "a2"],
      ["a1", "b1"],
    ],
    3,
  ); // a1 trùng → bỏ
  assert.equal(r.length, 3);
  assert.equal(new Set(r).size, 3);
});

test("ít câu hơn cap → trả hết, không lặp vô hạn", () => {
  const r = buildQuickSet([["a1"], ["b1"]], 10);
  assert.deepEqual(r.sort(), ["a1", "b1"]);
});

test("rỗng → []", () => {
  assert.deepEqual(buildQuickSet([], 5), []);
  assert.deepEqual(buildQuickSet([[], []], 5), []);
});
