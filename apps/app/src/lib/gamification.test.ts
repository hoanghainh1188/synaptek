/**
 * Unit test gamification view-model (app, US2).
 *   node --experimental-strip-types --no-warnings src/lib/gamification.test.ts
 */
import assert from "node:assert";
import { MASTERED, type Badge } from "@synaptek/learning-path";
import {
  INITIAL_GAMIFICATION,
  xpForSession,
  summarizeSession,
  masteredTopicsOf,
} from "./gamification.ts";

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

console.log("app · gamification Tests\n");

test("xpForSession: cộng XP các câu đúng theo độ khó (bỏ câu sai)", () => {
  const xp = xpForSession([
    { isCorrect: true, difficulty: 1 }, // 10
    { isCorrect: true, difficulty: 3 }, // 20
    { isCorrect: false, difficulty: 2 }, // 0
  ]);
  assert.equal(xp, 30);
});

const catalog: Badge[] = [
  { id: "xp-100", name: "", desc: "", icon: "", criteria: { type: "xp", gte: 100 } },
  { id: "streak-1", name: "", desc: "", icon: "", criteria: { type: "streak", gte: 1 } },
];

test("summarizeSession: ΔXP + tổng XP + streak mới + huy hiệu mới", () => {
  const out = summarizeSession({
    prior: { ...INITIAL_GAMIFICATION, totalXp: 90 },
    events: [{ isCorrect: true, difficulty: 1 }], // +10 → 100
    dayKeyVN: "2026-06-26",
    badgeCtx: { mastery: new Map(), correctCount: 1, masteredTopics: new Set() },
    catalog,
    earned: new Set(),
  });
  assert.equal(out.xpGained, 10);
  assert.equal(out.state.totalXp, 100);
  assert.equal(out.state.currentStreak, 1);
  assert.deepEqual(new Set(out.newBadges), new Set(["xp-100", "streak-1"]));
});

test("summarizeSession: huy hiệu đã đạt không mở lại", () => {
  const out = summarizeSession({
    prior: {
      ...INITIAL_GAMIFICATION,
      totalXp: 100,
      currentStreak: 1,
      lastPracticedOn: "2026-06-26",
    },
    events: [{ isCorrect: true, difficulty: 1 }],
    dayKeyVN: "2026-06-26", // cùng ngày → streak giữ 1
    badgeCtx: { mastery: new Map(), correctCount: 2, masteredTopics: new Set() },
    catalog,
    earned: new Set(["xp-100", "streak-1"]),
  });
  assert.deepEqual(out.newBadges, []);
  assert.equal(out.state.currentStreak, 1);
});

test("summarizeSession: không đột biến prior", () => {
  const prior = { ...INITIAL_GAMIFICATION, totalXp: 50 };
  const snap = JSON.stringify(prior);
  summarizeSession({
    prior,
    events: [{ isCorrect: true, difficulty: 2 }],
    dayKeyVN: "2026-06-26",
    badgeCtx: { mastery: new Map(), correctCount: 0, masteredTopics: new Set() },
    catalog,
    earned: new Set(),
  });
  assert.equal(JSON.stringify(prior), snap);
});

test("masteredTopicsOf: chủ đề đạt khi MỌI kỹ năng ≥ MASTERED", () => {
  const topicSkills = new Map([
    ["t.frac", ["s1", "s2"]],
    ["t.geo", ["s3"]],
  ]);
  const mastery = new Map([
    ["s1", MASTERED],
    ["s2", MASTERED],
    ["s3", 0.5],
  ]);
  const got = masteredTopicsOf(mastery, topicSkills);
  assert.deepEqual([...got], ["t.frac"]);
});

test("masteredTopicsOf: chủ đề rỗng kỹ năng → không tính là đạt", () => {
  const got = masteredTopicsOf(new Map(), new Map([["t.empty", []]]));
  assert.equal(got.size, 0);
});

console.log(`\n${passed} test(s) passed.`);
