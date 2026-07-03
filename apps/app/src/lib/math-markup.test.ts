import assert from "node:assert";
import { parseMathMarkup, segmentToLatex } from "./math-markup.ts";

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

console.log("Math Markup Tests\n");

test("text thường → 1 segment text", () => {
  assert.deepEqual(parseMathMarkup("Chào em"), [{ kind: "text", value: "Chào em" }]);
});

test("phân số trần a/b", () => {
  assert.deepEqual(parseMathMarkup("Rút gọn 2/4"), [
    { kind: "text", value: "Rút gọn " },
    { kind: "frac", num: "2", den: "4" },
  ]);
});

test("[[frac:1/2]] tường minh", () => {
  assert.deepEqual(parseMathMarkup("[[frac:1/2]]"), [{ kind: "frac", num: "1", den: "2" }]);
});

test("lũy thừa x^2", () => {
  assert.deepEqual(parseMathMarkup("x^2"), [{ kind: "sup", base: "x", exp: "2" }]);
});

test("hỗn hợp text + frac + text", () => {
  const segs = parseMathMarkup("So sánh 1/3 và 1/2 nhé");
  assert.equal(segs.length, 5);
  assert.deepEqual(segs[1], { kind: "frac", num: "1", den: "3" });
  assert.deepEqual(segs[3], { kind: "frac", num: "1", den: "2" });
});

test("segmentToLatex: frac → \\frac{a}{b}", () => {
  assert.equal(segmentToLatex({ kind: "frac", num: "1", den: "2" }), "\\frac{1}{2}");
});

test("segmentToLatex: sup → base^{exp}", () => {
  assert.equal(segmentToLatex({ kind: "sup", base: "x", exp: "2" }), "x^{2}");
});

test("segmentToLatex: text → null (không render qua KaTeX)", () => {
  assert.equal(segmentToLatex({ kind: "text", value: "Chào em" }), null);
});

console.log(`\n${passed} test(s) passed.`);
