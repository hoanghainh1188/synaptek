/**
 * Unit test mã mời.  node --experimental-strip-types --no-warnings tests/invite.test.ts
 */
import assert from "node:assert";
import { makeInviteCode, normalizeInviteCode, isInviteValid } from "../src/invite.ts";

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

console.log("classroom · invite Tests\n");

const SAFE = /^[0-9A-HJKMNP-TV-Z]+$/; // Crockford base32: không I, L, O, U

test("makeInviteCode: tất định theo seed, đúng độ dài mặc định 6", () => {
  const a = makeInviteCode([0, 1, 2, 3, 4, 5]);
  const b = makeInviteCode([0, 1, 2, 3, 4, 5]);
  assert.equal(a, b);
  assert.equal(a.length, 6);
});

test("makeInviteCode: chỉ ký tự an toàn (Crockford base32)", () => {
  const code = makeInviteCode([10, 31, 20, 5, 18, 200, 999, 1]);
  assert.ok(SAFE.test(code), `code=${code}`);
});

test("makeInviteCode: độ dài tùy chỉnh; bao nhiêu randomInts dùng bấy nhiêu (lặp nếu thiếu)", () => {
  assert.equal(makeInviteCode([1, 2, 3, 4], 4).length, 4);
  assert.equal(makeInviteCode([1], 8).length, 8); // thiếu seed → lặp, vẫn đủ độ dài
});

test("normalizeInviteCode: upper + bỏ khoảng trắng/gạch + map nhầm (I/L→1, O→0, U→V)", () => {
  assert.equal(normalizeInviteCode("ab cd-12"), "ABCD12");
  assert.equal(normalizeInviteCode("oil"), "011"); // O→0, I→1, L→1
  assert.equal(normalizeInviteCode("u"), "V");
});

test("normalizeInviteCode(make(x)) === make(x) (mã sinh ra đã chuẩn)", () => {
  const c = makeInviteCode([3, 14, 15, 9, 26, 5]);
  assert.equal(normalizeInviteCode(c), c);
});

test("isInviteValid: null = không hạn → luôn hợp lệ", () => {
  assert.equal(isInviteValid(null, 1000), true);
});

test("isInviteValid: expiresAt > now → hợp lệ; ≤ now → hết hạn (biên = hết hạn)", () => {
  assert.equal(isInviteValid(1001, 1000), true);
  assert.equal(isInviteValid(1000, 1000), false); // biên: bằng = hết hạn (khớp RPC `> now`)
  assert.equal(isInviteValid(999, 1000), false);
});

console.log(`\n${passed} test(s) passed.`);
