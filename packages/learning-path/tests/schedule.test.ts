/**
 * Unit test lịch ôn (SM-2 rút gọn).  node --experimental-strip-types --no-warnings tests/schedule.test.ts
 */
import assert from "node:assert";
import { nextDueAt } from "../src/schedule.ts";
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

console.log("learning-path · schedule Tests\n");

const T0 = Date.parse("2026-06-26T03:00:00Z"); // 10:00 giờ VN
const DAY = 86_400_000;

test("nextDueAt: luôn ở tương lai so với lastReviewed", () => {
  for (const mastery of [0, 0.3, 0.95, 1]) {
    for (const repetition of [0, 1, 3]) {
      assert.ok(
        nextDueAt({ mastery, lastReviewed: T0, repetition }) > T0,
        `m=${mastery} r=${repetition}`,
      );
    }
  }
});

test("mastery thấp → khoảng cách NGẮN hơn mastery cao (cùng repetition)", () => {
  const low = nextDueAt({ mastery: 0.2, lastReviewed: T0, repetition: 1 });
  const high = nextDueAt({ mastery: 0.9, lastReviewed: T0, repetition: 1 });
  assert.ok(high - T0 > low - T0, `low=${low - T0} high=${high - T0}`);
});

test("khoảng cách TĂNG theo repetition (cùng mastery)", () => {
  const r0 = nextDueAt({ mastery: 0.6, lastReviewed: T0, repetition: 0 });
  const r1 = nextDueAt({ mastery: 0.6, lastReviewed: T0, repetition: 1 });
  const r2 = nextDueAt({ mastery: 0.6, lastReviewed: T0, repetition: 2 });
  assert.ok(r1 - T0 > r0 - T0, "r1 > r0");
  assert.ok(r2 - T0 > r1 - T0, "r2 > r1");
});

test("khoảng cách tối thiểu ≥ 1 ngày kể cả mastery=0", () => {
  const d = nextDueAt({ mastery: 0, lastReviewed: T0, repetition: 0 }) - T0;
  assert.ok(d >= DAY, `d=${d}`);
});

test("tất định: cùng input → cùng output", () => {
  const a = nextDueAt({ mastery: 0.5, lastReviewed: T0, repetition: 2 });
  const b = nextDueAt({ mastery: 0.5, lastReviewed: T0, repetition: 2 });
  assert.equal(a, b);
});

test("repetition vượt chuỗi SM-2 → giãn tiếp (nhân đôi), vẫn tăng đơn điệu", () => {
  const r4 = nextDueAt({ mastery: 0.6, lastReviewed: T0, repetition: 4 });
  const r6 = nextDueAt({ mastery: 0.6, lastReviewed: T0, repetition: 6 });
  assert.ok(r6 - T0 > r4 - T0, `r6=${r6 - T0} r4=${r4 - T0}`);
});

test("kết quả là mốc thời gian hợp lệ (dayKeyVN ổn định)", () => {
  const due = nextDueAt({ mastery: 0.8, lastReviewed: T0, repetition: 1 });
  assert.match(dayKeyVN(due), /^\d{4}-\d{2}-\d{2}$/);
});

console.log(`\n${passed} test(s) passed.`);
