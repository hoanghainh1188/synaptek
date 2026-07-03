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
  subjectsOf,
  gradeSubject,
  levelOfGrade,
  gradesInLevel,
  levelsWithContent,
  LEVELS,
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

test("Question: ảnh hợp lệ (có src + alt) → không lỗi ảnh", () => {
  const errs = validateQuestion({
    id: "x",
    skillId: "s",
    grade: 4,
    type: "numeric",
    prompt: "p",
    image: { src: "rect-5x3", alt: "Hình chữ nhật" },
    correct: "15",
    explanation: "e",
  });
  assert.ok(!errs.some((e) => e.path.startsWith("/image")));
});

test("Question: ảnh thiếu alt → lỗi", () => {
  const errs = validateQuestion({
    id: "x",
    skillId: "s",
    grade: 4,
    type: "numeric",
    prompt: "p",
    image: { src: "rect-5x3" },
    correct: "15",
    explanation: "e",
  });
  assert.ok(errs.some((e) => e.path === "/image/alt"));
});

test("Question: difficulty vắng → không lỗi", () => {
  const errs = validateQuestion({
    id: "x",
    skillId: "s",
    grade: 4,
    type: "numeric",
    prompt: "p",
    correct: "1",
    explanation: "e",
  });
  assert.ok(!errs.some((e) => e.path === "/difficulty"));
});

test("Question: difficulty hợp lệ (1..3) → không lỗi", () => {
  for (const d of [1, 2, 3]) {
    const errs = validateQuestion({
      id: "x",
      skillId: "s",
      grade: 4,
      type: "numeric",
      prompt: "p",
      difficulty: d,
      correct: "1",
      explanation: "e",
    });
    assert.ok(!errs.some((e) => e.path === "/difficulty"), `difficulty=${d}`);
  }
});

test("Question: difficulty ngoài {1,2,3} → lỗi", () => {
  for (const d of [0, 4, 2.5, "a"]) {
    const errs = validateQuestion({
      id: "x",
      skillId: "s",
      grade: 4,
      type: "numeric",
      prompt: "p",
      difficulty: d,
      correct: "1",
      explanation: "e",
    } as never);
    assert.ok(
      errs.some((e) => e.path === "/difficulty"),
      `difficulty=${d} phải lỗi`,
    );
  }
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

// ── Đa môn (subject) ─────────────────────────────────────────────────────────
test("gradeSubject mặc định 'math' khi thiếu; subjectsOf gộp + math trước", () => {
  const math1: Grade = { grade: 1, strands: [], skills: [] };
  const vn1: Grade = { grade: 1, subject: "vietnamese", strands: [], skills: [] };
  assert.equal(gradeSubject(math1), "math");
  assert.equal(gradeSubject(vn1), "vietnamese");
  assert.deepEqual(subjectsOf([vn1, math1]), ["math", "vietnamese"]); // math luôn trước
});

test("topicsByGrade lọc theo môn", () => {
  const math1: Grade = {
    grade: 1,
    strands: [{ id: "m", name: "M", topics: [{ id: "m.t", name: "T", grade: 1, skillIds: [] }] }],
    skills: [],
  };
  const vn1: Grade = {
    grade: 1,
    subject: "vietnamese",
    strands: [{ id: "v", name: "V", topics: [{ id: "v.t", name: "T", grade: 1, skillIds: [] }] }],
    skills: [],
  };
  const all = [math1, vn1];
  assert.deepEqual(
    topicsByGrade(all, 1, "math").map((t) => t.id),
    ["m.t"],
  );
  assert.deepEqual(
    topicsByGrade(all, 1, "vietnamese").map((t) => t.id),
    ["v.t"],
  );
  assert.equal(topicsByGrade(all, 1).length, 2); // không lọc → cả hai
});

// ── Cấp học (level — suy ra từ số lớp, khung THCS/THPT) ───────────────────────
test("levelOfGrade: 1–5 Tiểu học · 6–9 THCS · 10–12 THPT · ngoài → null", () => {
  for (const g of [1, 2, 3, 4, 5]) assert.equal(levelOfGrade(g), "primary", `lớp ${g}`);
  for (const g of [6, 7, 8, 9]) assert.equal(levelOfGrade(g), "lower-secondary", `lớp ${g}`);
  for (const g of [10, 11, 12]) assert.equal(levelOfGrade(g), "upper-secondary", `lớp ${g}`);
  for (const g of [0, 13, -1, 5.5]) assert.equal(levelOfGrade(g), null, `lớp ${g}`);
});

test("gradesInLevel: Tiểu học 1–5 · THCS 6–9 · THPT 10–12 (đầy đủ, kể cả lớp chưa có nội dung)", () => {
  assert.deepEqual(gradesInLevel("primary"), [1, 2, 3, 4, 5]);
  assert.deepEqual(gradesInLevel("lower-secondary"), [6, 7, 8, 9]);
  assert.deepEqual(gradesInLevel("upper-secondary"), [10, 11, 12]);
});

test("levelsWithContent: chỉ lớp 1–5 → 1 cấp (Tiểu học); thêm lớp 6 → 2 cấp, giữ thứ tự", () => {
  const primaryOnly: Grade[] = [
    { grade: 1, strands: [], skills: [] },
    { grade: 4, strands: [], skills: [] },
  ];
  assert.deepEqual(
    levelsWithContent(primaryOnly).map((l) => l.key),
    ["primary"],
  );
  const withThcs: Grade[] = [...primaryOnly, { grade: 6, strands: [], skills: [] }];
  assert.deepEqual(
    levelsWithContent(withThcs).map((l) => l.key),
    ["primary", "lower-secondary"], // luôn Tiểu học trước THCS
  );
});

test("levelsWithContent: lọc theo môn (Toán có THCS, Tiếng Việt chỉ Tiểu học)", () => {
  const curricula: Grade[] = [
    { grade: 4, strands: [], skills: [] }, // math (mặc định)
    { grade: 8, strands: [], skills: [] }, // math THCS
    { grade: 1, subject: "vietnamese", strands: [], skills: [] },
  ];
  assert.deepEqual(
    levelsWithContent(curricula, "math").map((l) => l.key),
    ["primary", "lower-secondary"],
  );
  assert.deepEqual(
    levelsWithContent(curricula, "vietnamese").map((l) => l.key),
    ["primary"],
  );
});

test("LEVELS phủ trọn 1–12 không trùng lặp", () => {
  const all = LEVELS.flatMap((l) => l.grades);
  assert.deepEqual(
    [...all].sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.equal(new Set(all).size, all.length); // không lớp nào thuộc 2 cấp
});

// ── Validate nới lớp 1..12 (đón THCS/THPT) ────────────────────────────────────
test("Curriculum: grade 6..12 nay HỢP LỆ (trước chỉ 1..5)", () => {
  for (const grade of [6, 9, 12]) {
    const g: Grade = { grade, strands: [], skills: [] };
    assert.deepEqual(validateCurriculum(g), [], `lớp ${grade}`);
  }
});

test("Curriculum: grade 0/13/không-nguyên → vẫn lỗi", () => {
  for (const grade of [0, 13, 5.5]) {
    const g = { grade, strands: [], skills: [] };
    assert.ok(
      validateCurriculum(g).some((e) => e.path === "/grade"),
      `lớp ${grade} phải lỗi`,
    );
  }
});

test("Question: grade 6 (THCS) nay hợp lệ", () => {
  const errs = validateQuestion({
    id: "x",
    skillId: "s",
    grade: 6,
    type: "numeric",
    prompt: "p",
    correct: "1",
    explanation: "e",
  });
  assert.ok(!errs.some((e) => e.path === "/grade"));
});

console.log(`\n${passed} test(s) passed.`);
