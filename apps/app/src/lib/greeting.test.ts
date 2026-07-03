import assert from "node:assert";
import { greetingByHour, currentGreeting } from "./greeting.ts";

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

console.log("Greeting Tests\n");

test("sáng 5–10", () => {
  for (const h of [5, 7, 10]) assert.equal(greetingByHour(h), "Chào buổi sáng,", `giờ ${h}`);
});

test("trưa 11–12", () => {
  for (const h of [11, 12]) assert.equal(greetingByHour(h), "Chào buổi trưa,", `giờ ${h}`);
});

test("chiều 13–17", () => {
  for (const h of [13, 15, 17]) assert.equal(greetingByHour(h), "Chào buổi chiều,", `giờ ${h}`);
});

test("tối 18–4 (gồm nửa đêm)", () => {
  for (const h of [18, 21, 23, 0, 3, 4]) {
    assert.equal(greetingByHour(h), "Chào buổi tối,", `giờ ${h}`);
  }
});

test("phủ trọn 0–23, không giờ nào trống", () => {
  for (let h = 0; h < 24; h++) assert.ok(greetingByHour(h).length > 0, `giờ ${h}`);
});

test("currentGreeting đọc getHours của Date truyền vào", () => {
  const nine = new Date(2026, 0, 1, 9, 0, 0);
  assert.equal(currentGreeting(nine), "Chào buổi sáng,");
  const twenty = new Date(2026, 0, 1, 20, 0, 0);
  assert.equal(currentGreeting(twenty), "Chào buổi tối,");
});

console.log(`\n${passed} test(s) passed.`);
