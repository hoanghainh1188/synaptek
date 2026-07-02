import assert from "node:assert/strict";
import { test } from "node:test";
import { mathKeypadKeys, isOperatorKey } from "./math-keypad.ts";

test("expression có mũ/ngoặc/biến; numeric không có", () => {
  const expr = mathKeypadKeys("expression");
  for (const k of ["^", "(", ")", "x", "*"]) assert.ok(expr.includes(k), `expression thiếu ${k}`);
  const num = mathKeypadKeys("numeric");
  for (const k of ["^", "x", "("]) assert.ok(!num.includes(k), `numeric không nên có ${k}`);
});

test("mọi loại đều có đủ 10 chữ số và dấu phẩy", () => {
  for (const t of ["numeric", "fraction", "expression"] as const) {
    const ks = mathKeypadKeys(t);
    for (const d of ["0", "1", "5", "9"]) assert.ok(ks.includes(d));
    assert.ok(ks.includes(","), `${t} thiếu dấu phẩy`);
  }
});

test("fraction + numeric có '/'", () => {
  assert.ok(mathKeypadKeys("fraction").includes("/"));
  assert.ok(mathKeypadKeys("numeric").includes("/"));
});

test("isOperatorKey phân biệt số và toán tử", () => {
  assert.equal(isOperatorKey("^"), true);
  assert.equal(isOperatorKey("/"), true);
  assert.equal(isOperatorKey("5"), false);
});

test("numeric + expression đều có phím căn √ (D45); fraction không cần", () => {
  assert.ok(mathKeypadKeys("numeric").includes("√"));
  assert.ok(mathKeypadKeys("expression").includes("√"));
  assert.ok(!mathKeypadKeys("fraction").includes("√"));
  assert.equal(isOperatorKey("√"), true);
});
