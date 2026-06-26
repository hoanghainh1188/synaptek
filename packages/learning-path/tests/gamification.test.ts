/**
 * Unit test gamification (US2).  node --experimental-strip-types --no-warnings tests/gamification.test.ts
 */
import assert from "node:assert";
import {
  difficultyOf,
  xpForAttempt,
  updateStreak,
  evaluateBadges,
  type Badge,
  type GamificationState,
} from "../src/gamification.ts";
import { MASTERED } from "../src/bkt.ts";

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

console.log("learning-path · gamification Tests\n");

// ── difficultyOf ─────────────────────────────────────────────────────────────
test("difficultyOf: field difficulty được ưu tiên", () => {
  assert.equal(difficultyOf({ type: "mcq", difficulty: 3 }), 3);
  assert.equal(difficultyOf({ type: "expression", difficulty: 1 }), 1);
});

test("difficultyOf: vắng field → suy theo loại câu", () => {
  assert.equal(difficultyOf({ type: "mcq" }), 1);
  assert.equal(difficultyOf({ type: "true-false" }), 1);
  assert.equal(difficultyOf({ type: "numeric" }), 2);
  assert.equal(difficultyOf({ type: "fraction" }), 2);
  assert.equal(difficultyOf({ type: "expression" }), 3);
  assert.equal(difficultyOf({ type: "fill-blank" }), 3);
});

test("difficultyOf: loại lạ → mặc định vừa (2)", () => {
  assert.equal(difficultyOf({ type: "unknown-type" }), 2);
});

// ── xpForAttempt ─────────────────────────────────────────────────────────────
test("xpForAttempt: sai → 0 bất kể độ khó", () => {
  for (const d of [1, 2, 3] as const) assert.equal(xpForAttempt(false, d), 0);
});

test("xpForAttempt: đúng × trọng số {1:1, 2:1.5, 3:2} trên base 10", () => {
  assert.equal(xpForAttempt(true, 1), 10);
  assert.equal(xpForAttempt(true, 2), 15);
  assert.equal(xpForAttempt(true, 3), 20);
});

// ── updateStreak ─────────────────────────────────────────────────────────────
const base: GamificationState = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticedOn: null,
};

test("updateStreak: lần đầu (null) → streak = 1", () => {
  const s = updateStreak(base, "2026-06-26");
  assert.equal(s.currentStreak, 1);
  assert.equal(s.longestStreak, 1);
  assert.equal(s.lastPracticedOn, "2026-06-26");
});

test("updateStreak: cùng ngày → không +2 (giữ nguyên)", () => {
  const s1 = updateStreak(base, "2026-06-26");
  const s2 = updateStreak(s1, "2026-06-26");
  assert.equal(s2.currentStreak, 1);
  assert.equal(s2.lastPracticedOn, "2026-06-26");
});

test("updateStreak: ngày kế tiếp → +1", () => {
  const s1 = updateStreak(base, "2026-06-26");
  const s2 = updateStreak(s1, "2026-06-27");
  assert.equal(s2.currentStreak, 2);
  assert.equal(s2.longestStreak, 2);
});

test("updateStreak: cách ≥ 2 ngày → reset về 1", () => {
  const s1 = { ...base, currentStreak: 5, longestStreak: 5, lastPracticedOn: "2026-06-26" };
  const s2 = updateStreak(s1, "2026-06-29");
  assert.equal(s2.currentStreak, 1);
  assert.equal(s2.longestStreak, 5, "longest giữ kỷ lục cũ");
});

test("updateStreak: cập nhật longest khi current vượt", () => {
  let s = { ...base, currentStreak: 3, longestStreak: 3, lastPracticedOn: "2026-06-26" };
  s = updateStreak(s, "2026-06-27"); // 4
  assert.equal(s.currentStreak, 4);
  assert.equal(s.longestStreak, 4);
});

test("updateStreak: chuyển tháng (ngày liền kề qua mốc tháng) vẫn +1", () => {
  const s1 = { ...base, currentStreak: 2, longestStreak: 2, lastPracticedOn: "2026-06-30" };
  const s2 = updateStreak(s1, "2026-07-01");
  assert.equal(s2.currentStreak, 3);
});

test("updateStreak: không đột biến state đầu vào (bất biến)", () => {
  const input = { ...base, lastPracticedOn: "2026-06-26", currentStreak: 1, longestStreak: 1 };
  const snapshot = JSON.stringify(input);
  updateStreak(input, "2026-06-27");
  assert.equal(JSON.stringify(input), snapshot);
});

// ── evaluateBadges ───────────────────────────────────────────────────────────
const catalog: Badge[] = [
  { id: "streak-3", name: "", desc: "", icon: "", criteria: { type: "streak", gte: 3 } },
  { id: "xp-100", name: "", desc: "", icon: "", criteria: { type: "xp", gte: 100 } },
  {
    id: "correct-100",
    name: "",
    desc: "",
    icon: "",
    criteria: { type: "correct_count", gte: 100 },
  },
  {
    id: "skill-x",
    name: "",
    desc: "",
    icon: "",
    criteria: { type: "skill_mastered", skillId: "s1" },
  },
  {
    id: "topic-frac",
    name: "",
    desc: "",
    icon: "",
    criteria: { type: "topic_mastered", topicId: "t.frac" },
  },
];

function ctx(over: Partial<Parameters<typeof evaluateBadges>[0]> = {}) {
  return {
    state: { ...base, totalXp: 0, currentStreak: 0 },
    mastery: new Map<string, number>(),
    correctCount: 0,
    masteredTopics: new Set<string>(),
    ...over,
  };
}

test("evaluateBadges: mở huy hiệu khi đạt ngưỡng (streak/xp/correct)", () => {
  const got = evaluateBadges(
    ctx({ state: { ...base, totalXp: 120, currentStreak: 3 }, correctCount: 100 }),
    catalog,
    new Set(),
  );
  assert.deepEqual(new Set(got), new Set(["streak-3", "xp-100", "correct-100"]));
});

test("evaluateBadges: mastery kỹ năng/chủ đề", () => {
  const got = evaluateBadges(
    ctx({
      mastery: new Map([["s1", MASTERED]]),
      masteredTopics: new Set(["t.frac"]),
    }),
    catalog,
    new Set(),
  );
  assert.deepEqual(new Set(got), new Set(["skill-x", "topic-frac"]));
});

test("evaluateBadges: skill chưa đạt ngưỡng → không mở", () => {
  const got = evaluateBadges(ctx({ mastery: new Map([["s1", 0.9]]) }), catalog, new Set());
  assert.deepEqual(got, []);
});

test("evaluateBadges: mở đúng MỘT lần — đã có trong earned → không trả lại (SC-005)", () => {
  const c = ctx({ state: { ...base, totalXp: 200, currentStreak: 7 }, correctCount: 100 });
  const earned = new Set(["streak-3", "xp-100", "correct-100"]);
  const got = evaluateBadges(c, catalog, earned);
  assert.deepEqual(got, []);
});

test("evaluateBadges: chỉ trả huy hiệu MỚI (một số đã earned)", () => {
  const c = ctx({ state: { ...base, totalXp: 120, currentStreak: 3 }, correctCount: 100 });
  const got = evaluateBadges(c, catalog, new Set(["xp-100"]));
  assert.deepEqual(new Set(got), new Set(["streak-3", "correct-100"]));
});

console.log(`\n${passed} test(s) passed.`);
