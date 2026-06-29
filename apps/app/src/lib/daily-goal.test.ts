import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyProgress } from "./daily-goal.ts";

// 12:00 UTC = 19:00 VN cùng ngày → mốc "hôm nay" theo VN.
const NOW = Date.parse("2026-06-29T12:00:00Z");
const at = (iso: string) => ({ createdAt: iso });

test("đếm câu hôm nay (giờ VN), bỏ ngày khác", () => {
  const r = dailyProgress(
    [
      at("2026-06-29T01:00:00Z"), // 08:00 VN 29 → hôm nay
      at("2026-06-29T10:00:00Z"), // 17:00 VN 29 → hôm nay
      at("2026-06-28T10:00:00Z"), // hôm qua
    ],
    NOW,
    10,
  );
  assert.equal(r.done, 2);
  assert.equal(r.met, false);
  assert.ok(Math.abs(r.ratio - 0.2) < 1e-9);
});

test("đạt mục tiêu → met=true, ratio chặn ở 1", () => {
  const today = Array.from({ length: 12 }, () => at("2026-06-29T03:00:00Z"));
  const r = dailyProgress(today, NOW, 10);
  assert.equal(r.done, 12);
  assert.equal(r.met, true);
  assert.equal(r.ratio, 1);
});

test("ranh giới nửa đêm VN: 17:30Z = 00:30 VN hôm sau → KHÔNG tính cho 'hôm nay'", () => {
  // now = 29 (VN); attempt 2026-06-29T17:30:00Z = 00:30 VN ngày 30 → ngày khác
  const r = dailyProgress([at("2026-06-29T17:30:00Z")], NOW, 10);
  assert.equal(r.done, 0);
});

test("không createdAt → bỏ qua", () => {
  const r = dailyProgress([{}, {}], NOW, 10);
  assert.equal(r.done, 0);
});
