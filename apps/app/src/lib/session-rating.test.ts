import assert from "node:assert";
import { ratingMessage } from "./session-rating.ts";

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

console.log("Session Rating Tests\n");

test("100% → Xuất sắc", () => {
  assert.match(ratingMessage(10, 10), /Xuất sắc/);
  assert.match(ratingMessage(1, 1), /Xuất sắc/);
});

test("80–99% → Giỏi", () => {
  assert.match(ratingMessage(8, 10), /Giỏi/);
  assert.match(ratingMessage(9, 10), /Giỏi/);
});

test("50–79% → Khá", () => {
  assert.match(ratingMessage(5, 10), /Khá/);
  assert.match(ratingMessage(7, 10), /Khá/);
});

test("1–49% → ôn lại", () => {
  assert.match(ratingMessage(4, 10), /ôn lại/);
  assert.match(ratingMessage(1, 10), /ôn lại/);
});

test("0% → động viên nhẹ (không phán xét)", () => {
  assert.match(ratingMessage(0, 10), /luyện thêm/);
});

test("total 0 → lời trung tính", () => {
  assert.match(ratingMessage(0, 0), /bắt đầu/);
});

test("mỗi mức cho lời KHÁC nhau (không còn cố định)", () => {
  const msgs = new Set([
    ratingMessage(10, 10),
    ratingMessage(8, 10),
    ratingMessage(6, 10),
    ratingMessage(3, 10),
    ratingMessage(0, 10),
  ]);
  assert.equal(msgs.size, 5); // 5 mức → 5 lời riêng biệt
});

console.log(`\n${passed} test(s) passed.`);
