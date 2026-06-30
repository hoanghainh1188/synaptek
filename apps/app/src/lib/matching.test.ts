import assert from "node:assert/strict";
import { test } from "node:test";
import { packMatching, unpackMatching, MATCH_SEP } from "./matching.ts";

test("pack rồi unpack → tách đúng trái/phải", () => {
  const packed = packMatching(["2+2", "3+3"], ["6", "4"]);
  assert.ok(packed.includes(MATCH_SEP));
  const { lefts, pool } = unpackMatching(packed);
  assert.deepEqual(lefts, ["2+2", "3+3"]);
  assert.deepEqual(pool, ["6", "4"]);
});

test("không sentinel → toàn bộ là trái, pool rỗng", () => {
  const { lefts, pool } = unpackMatching(["a", "b"]);
  assert.deepEqual(lefts, ["a", "b"]);
  assert.deepEqual(pool, []);
});

test("undefined → rỗng", () => {
  assert.deepEqual(unpackMatching(undefined), { lefts: [], pool: [] });
});
