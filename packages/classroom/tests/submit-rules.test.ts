/**
 * Unit test luật giới hạn nộp bài.  node --experimental-strip-types --no-warnings tests/submit-rules.test.ts
 */
import assert from "node:assert";
import { checkSubmitAllowed } from "../src/submit-rules.ts";

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

console.log("classroom · submit-rules Tests\n");

const NOW = Date.parse("2026-06-28T03:00:00Z");
const noLimits = { dueAt: null, allowLate: true, maxAttempts: null, timeLimitMinutes: null };
const fresh = { attemptCount: 0, startedAt: null };

test("không giới hạn → cho nộp", () => {
  assert.deepEqual(checkSubmitAllowed(noLimits, fresh, NOW), { allowed: true });
});

test("hạn nộp: allowLate=false + quá hạn → past_due", () => {
  const r = checkSubmitAllowed({ ...noLimits, allowLate: false, dueAt: NOW - 1 }, fresh, NOW);
  assert.equal(r.allowed, false);
  assert.equal(r.reason, "past_due");
});

test("hạn nộp: allowLate=true + quá hạn → vẫn cho (đánh dấu trễ ở nơi khác)", () => {
  assert.equal(
    checkSubmitAllowed({ ...noLimits, allowLate: true, dueAt: NOW - 1 }, fresh, NOW).allowed,
    true,
  );
});

test("hạn nộp: chưa tới hạn → cho nộp dù allowLate=false", () => {
  assert.equal(
    checkSubmitAllowed({ ...noLimits, allowLate: false, dueAt: NOW + 1000 }, fresh, NOW).allowed,
    true,
  );
});

test("số lần: đạt max → no_attempts_left", () => {
  const r = checkSubmitAllowed(
    { ...noLimits, maxAttempts: 2 },
    { attemptCount: 2, startedAt: null },
    NOW,
  );
  assert.equal(r.allowed, false);
  assert.equal(r.reason, "no_attempts_left");
});

test("số lần: còn lượt → cho nộp", () => {
  assert.equal(
    checkSubmitAllowed({ ...noLimits, maxAttempts: 2 }, { attemptCount: 1, startedAt: null }, NOW)
      .allowed,
    true,
  );
});

test("timer: quá thời gian (+ grace) → time_expired", () => {
  const started = NOW - 11 * 60_000; // bắt đầu 11 phút trước, limit 10 phút
  const r = checkSubmitAllowed(
    { ...noLimits, timeLimitMinutes: 10 },
    { attemptCount: 0, startedAt: started },
    NOW,
  );
  assert.equal(r.allowed, false);
  assert.equal(r.reason, "time_expired");
});

test("timer: trong thời gian (gồm grace) → cho nộp", () => {
  const started = NOW - 9 * 60_000; // 9 phút trước, limit 10
  assert.equal(
    checkSubmitAllowed(
      { ...noLimits, timeLimitMinutes: 10 },
      { attemptCount: 0, startedAt: started },
      NOW,
    ).allowed,
    true,
  );
});

test("timer: chưa bắt đầu (startedAt null) → không chặn vì timer", () => {
  assert.equal(checkSubmitAllowed({ ...noLimits, timeLimitMinutes: 10 }, fresh, NOW).allowed, true);
});

test("ưu tiên past_due trước số lần trước timer (thứ tự ổn định)", () => {
  const r = checkSubmitAllowed(
    { dueAt: NOW - 1, allowLate: false, maxAttempts: 1, timeLimitMinutes: 10 },
    { attemptCount: 5, startedAt: NOW - 999_000 },
    NOW,
  );
  assert.equal(r.reason, "past_due");
});

console.log(`\n${passed} test(s) passed.`);
