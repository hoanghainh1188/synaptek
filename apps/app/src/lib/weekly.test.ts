import assert from "node:assert/strict";
import { test } from "node:test";
import { weeklyStats } from "./weekly.ts";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * 24 * 3600 * 1000).toISOString();

test("đếm câu/đúng/độ chính xác trong 7 ngày", () => {
  const r = weeklyStats(
    [
      { createdAt: ago(1), isCorrect: true },
      { createdAt: ago(2), isCorrect: false },
      { createdAt: ago(3), isCorrect: true },
    ],
    [],
    NOW,
  );
  assert.equal(r.practiced, 3);
  assert.equal(r.correct, 2);
  assert.ok(Math.abs((r.accuracy ?? 0) - 2 / 3) < 1e-9);
});

test("bỏ qua câu ngoài 7 ngày", () => {
  const r = weeklyStats(
    [
      { createdAt: ago(1), isCorrect: true },
      { createdAt: ago(10), isCorrect: true }, // quá cũ
    ],
    [],
    NOW,
  );
  assert.equal(r.practiced, 1);
});

test("đếm bài đã nộp trong tuần; bỏ submittedAt null", () => {
  const r = weeklyStats(
    [],
    [{ submittedAt: ago(2) }, { submittedAt: null }, { submittedAt: ago(9) }],
    NOW,
  );
  assert.equal(r.submitted, 1);
});

test("chưa luyện → accuracy null", () => {
  const r = weeklyStats([], [], NOW);
  assert.equal(r.practiced, 0);
  assert.equal(r.accuracy, null);
});
