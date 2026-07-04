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

test("100% (ratio 1) → Xuất sắc", () => {
  assert.match(ratingMessage(1), /Xuất sắc/);
});

test("80–99% → Giỏi", () => {
  assert.match(ratingMessage(0.8), /Giỏi/);
  assert.match(ratingMessage(0.9), /Giỏi/);
});

test("50–79% → Khá", () => {
  assert.match(ratingMessage(0.5), /Khá/);
  assert.match(ratingMessage(0.7), /Khá/);
});

test("1–49% → ôn lại", () => {
  assert.match(ratingMessage(0.4), /ôn lại/);
  assert.match(ratingMessage(0.1), /ôn lại/);
});

test("0% → động viên nhẹ (không phán xét)", () => {
  assert.match(ratingMessage(0), /luyện thêm/);
});

test("điểm thành phần đẩy qua mốc: 0.85 (vd nhờ partial) → Giỏi", () => {
  assert.match(ratingMessage(0.85), /Giỏi/);
});

test("mỗi mức cho lời KHÁC nhau (không còn cố định)", () => {
  const msgs = new Set([
    ratingMessage(1),
    ratingMessage(0.8),
    ratingMessage(0.6),
    ratingMessage(0.3),
    ratingMessage(0),
  ]);
  assert.equal(msgs.size, 5); // 5 mức → 5 lời riêng biệt
});

console.log(`\n${passed} test(s) passed.`);
