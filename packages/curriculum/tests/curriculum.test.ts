/**
 * Unit test @synaptek/curriculum — chạy KHÔNG cần mạng/DB.
 *   node --experimental-strip-types --no-warnings tests/curriculum.test.ts
 * Vừa kiểm logic validate/traversal, vừa xác nhận CONTENT SEED hợp schema (gate D14).
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateCurriculum,
  validateQuestion,
  topicsByGrade,
  questionsForTopic,
  buildSession,
  type Grade,
  type Question,
} from "../src/index.ts";

const root = join(import.meta.dirname, "../../..");
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

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

console.log("Curriculum Tests\n");

// ── Seed hợp schema (gate) ────────────────────────────────────────────────────
const grade4: Grade = readJson("content/curriculum/grade-4.json");
const fractions: Question[] = readJson("content/questions/g4.num.fractions.json");
const skillIds = new Set(grade4.skills.map((s) => s.id));

test("Seed grade-4.json hợp schema (0 lỗi)", () => {
  assert.deepEqual(validateCurriculum(grade4), []);
});

test("Seed câu hỏi phân số hợp schema (0 lỗi, skillId tồn tại)", () => {
  for (const q of fractions) {
    assert.deepEqual(validateQuestion(q, skillIds), [], `câu ${q.id}`);
  }
});

// ── validateCurriculum bắt lỗi ────────────────────────────────────────────────
test("Curriculum: skillId chủ đề không tồn tại → lỗi", () => {
  const bad = structuredClone(grade4);
  bad.strands[0].topics[0].skillIds.push("g4.khong.ton.tai");
  assert.ok(validateCurriculum(bad).some((e) => /không tồn tại/.test(e.message)));
});

test("Curriculum: id skill trùng → lỗi", () => {
  const bad = structuredClone(grade4);
  bad.skills.push({ ...bad.skills[0] });
  assert.ok(validateCurriculum(bad).some((e) => /trùng/.test(e.message)));
});

test("Curriculum: chu trình prerequisites → lỗi", () => {
  const bad = structuredClone(grade4);
  bad.skills[0].prerequisites.push(bad.skills[1].id);
  bad.skills[1].prerequisites.push(bad.skills[0].id);
  assert.ok(validateCurriculum(bad).some((e) => /chu trình/.test(e.message)));
});

// ── validateQuestion bắt lỗi ──────────────────────────────────────────────────
test("Question: mcq thiếu choices → lỗi", () => {
  const errs = validateQuestion(
    { id: "x", skillId: "s", grade: 4, type: "mcq", prompt: "p", correct: "A", explanation: "e" },
    undefined,
  );
  assert.ok(errs.some((e) => e.path === "/choices"));
});

test("Question: fill-blank correct không phải mảng → lỗi", () => {
  const errs = validateQuestion({
    id: "x",
    skillId: "s",
    grade: 4,
    type: "fill-blank",
    prompt: "p",
    correct: "1",
    explanation: "e",
  });
  assert.ok(errs.some((e) => e.path === "/correct"));
});

test("Question: correct rỗng → lỗi", () => {
  const errs = validateQuestion({
    id: "x",
    skillId: "s",
    grade: 4,
    type: "numeric",
    prompt: "p",
    correct: "",
    explanation: "e",
  });
  assert.ok(errs.some((e) => e.path === "/correct"));
});

test("Question: skillId không tồn tại (có knownSkillIds) → lỗi", () => {
  const errs = validateQuestion(
    {
      id: "x",
      skillId: "khong",
      grade: 4,
      type: "numeric",
      prompt: "p",
      correct: "1",
      explanation: "e",
    },
    new Set(["co"]),
  );
  assert.ok(errs.some((e) => e.path === "/skillId"));
});

// ── traversal + buildSession ──────────────────────────────────────────────────
test("topicsByGrade(4) trả đúng 3 chủ đề", () => {
  assert.equal(topicsByGrade([grade4], 4).length, 3);
});

test("questionsForTopic lọc theo skillIds của chủ đề", () => {
  const topic = topicsByGrade([grade4], 4).find((t) => t.id === "g4.num.fractions")!;
  const qs = questionsForTopic(fractions, topic);
  assert.equal(qs.length, fractions.length); // tất cả câu seed thuộc chủ đề phân số
});

test("buildSession lấy đúng count, shuffle tất định theo seed", () => {
  assert.equal(buildSession(fractions, { count: 3 }).length, 3);
  const a = buildSession(fractions, { count: 5, shuffleSeed: 42 }).map((q) => q.id);
  const b = buildSession(fractions, { count: 5, shuffleSeed: 42 }).map((q) => q.id);
  assert.deepEqual(a, b); // lặp lại được
});

console.log(`\n${passed} test(s) passed.`);
