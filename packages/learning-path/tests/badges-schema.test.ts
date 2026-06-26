/**
 * Validate catalog huy hiệu (US2, gate nội dung như D6).
 *   node --experimental-strip-types --no-warnings tests/badges-schema.test.ts
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateBadge, validateBadges, type Badge } from "../src/gamification.ts";

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

console.log("learning-path · badges-schema Tests\n");

const here = dirname(fileURLToPath(import.meta.url));
const badgesPath = join(here, "../../../content/gamification/badges.json");

test("content/gamification/badges.json hợp schema (0 lỗi)", () => {
  const raw: unknown = JSON.parse(readFileSync(badgesPath, "utf8"));
  const errs = validateBadges(raw);
  assert.deepEqual(errs, [], `lỗi: ${JSON.stringify(errs)}`);
});

test("badges.json: id duy nhất toàn cục", () => {
  const arr = JSON.parse(readFileSync(badgesPath, "utf8")) as Badge[];
  assert.equal(new Set(arr.map((b) => b.id)).size, arr.length);
});

test("validateBadge: thiếu trường bắt buộc → có lỗi", () => {
  assert.ok(validateBadge({ id: "x" }).length > 0);
  assert.ok(validateBadge({}).length > 0);
});

test("validateBadge: criteria sai type → có lỗi", () => {
  const errs = validateBadge({
    id: "x",
    name: "n",
    desc: "d",
    icon: "🔥",
    criteria: { type: "bogus" },
  });
  assert.ok(errs.some((e) => e.path.includes("criteria")));
});

test("validateBadge: streak/xp/correct_count cần gte là số", () => {
  assert.ok(
    validateBadge({
      id: "x",
      name: "n",
      desc: "d",
      icon: "🔥",
      criteria: { type: "streak" },
    }).length > 0,
  );
});

test("validateBadge: skill_mastered cần skillId; topic_mastered cần topicId", () => {
  assert.ok(
    validateBadge({
      id: "x",
      name: "n",
      desc: "d",
      icon: "🏅",
      criteria: { type: "skill_mastered" },
    }).length > 0,
  );
  assert.ok(
    validateBadge({
      id: "y",
      name: "n",
      desc: "d",
      icon: "🏅",
      criteria: { type: "topic_mastered" },
    }).length > 0,
  );
});

test("validateBadge: hợp lệ → 0 lỗi", () => {
  assert.deepEqual(
    validateBadge({
      id: "ok",
      name: "OK",
      desc: "mô tả",
      icon: "⭐",
      criteria: { type: "xp", gte: 100 },
    }),
    [],
  );
});

test("validateBadges: phát hiện id trùng", () => {
  const dup = [
    { id: "a", name: "n", desc: "d", icon: "⭐", criteria: { type: "xp", gte: 1 } },
    { id: "a", name: "n", desc: "d", icon: "⭐", criteria: { type: "xp", gte: 2 } },
  ];
  assert.ok(validateBadges(dup).some((e) => /trùng/.test(e.message)));
});

console.log(`\n${passed} test(s) passed.`);
