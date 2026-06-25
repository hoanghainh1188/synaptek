/**
 * Unit test time.ts — mốc ngày Việt Nam (Asia/Ho_Chi_Minh = UTC+7, không DST).
 *   node --experimental-strip-types --no-warnings tests/time.test.ts
 */
import assert from "node:assert";
import { dayKeyVN } from "../src/time.ts";

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

console.log("learning-path · time Tests\n");

test("dayKeyVN trả 'YYYY-MM-DD'", () => {
  assert.match(dayKeyVN(Date.parse("2026-06-24T03:00:00Z")), /^\d{4}-\d{2}-\d{2}$/);
});

test("Giữa trưa UTC → đúng ngày VN", () => {
  // 2026-06-24T03:00Z = 10:00 VN cùng ngày
  assert.equal(dayKeyVN(Date.parse("2026-06-24T03:00:00Z")), "2026-06-24");
});

test("Ổn định quanh nửa đêm VN (17:00Z = 00:00 VN ngày kế)", () => {
  // 16:59Z = 23:59 VN ngày 24; 17:01Z = 00:01 VN ngày 25
  assert.equal(dayKeyVN(Date.parse("2026-06-24T16:59:00Z")), "2026-06-24");
  assert.equal(dayKeyVN(Date.parse("2026-06-24T17:01:00Z")), "2026-06-25");
});

test("Tất định: cùng input → cùng output", () => {
  const ms = Date.parse("2026-01-01T12:34:56Z");
  assert.equal(dayKeyVN(ms), dayKeyVN(ms));
});

console.log(`\n${passed} test(s) passed.`);
