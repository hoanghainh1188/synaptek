// Validate nội dung theo contracts/content-schema.md. Lỗi = mảng ValidationError (rỗng = hợp lệ).
import {
  QUESTION_TYPES,
  type Grade,
  type Question,
  type Skill,
  type ValidationError,
} from "./types.ts";

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
// Lớp 1–12 (cả 3 cấp GDPT) — nới từ 1–5 để đón THCS/THPT; "cấp" suy ra từ số này (level.ts). DB
// profiles.grade_level đã cho phép 1–12 sẵn từ 0001.
const isGrade = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 12;

/** Phát hiện chu trình trong DAG prerequisites (DFS). */
function findCycle(skills: Skill[]): string | null {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const state = new Map<string, 0 | 1 | 2>(); // 0=trắng,1=xám,2=đen
  const dfs = (id: string): string | null => {
    if (state.get(id) === 1) return id;
    if (state.get(id) === 2) return null;
    state.set(id, 1);
    for (const p of byId.get(id)?.prerequisites ?? []) {
      if (byId.has(p)) {
        const c = dfs(p);
        if (c) return c;
      }
    }
    state.set(id, 2);
    return null;
  };
  for (const s of skills) {
    const c = dfs(s.id);
    if (c) return c;
  }
  return null;
}

/** Validate một file curriculum (một Grade). */
export function validateCurriculum(g: unknown): ValidationError[] {
  const errs: ValidationError[] = [];
  const e = (path: string, message: string) => errs.push({ path, message });
  if (typeof g !== "object" || g === null) return [{ path: "/", message: "phải là object" }];
  const grade = g as Partial<Grade>;

  if (!isGrade(grade.grade)) e("/grade", "phải là số nguyên 1..12");
  if (!Array.isArray(grade.skills)) e("/skills", "phải là mảng");
  if (!Array.isArray(grade.strands)) e("/strands", "phải là mảng");
  if (errs.length) return errs;

  const skills = grade.skills as Skill[];
  const skillIds = new Set<string>();
  skills.forEach((s, i) => {
    if (!isStr(s.id)) return e(`/skills/${i}/id`, "thiếu id");
    if (skillIds.has(s.id)) e(`/skills/${i}/id`, `id trùng: ${s.id}`);
    skillIds.add(s.id);
    if (!isStr(s.name)) e(`/skills/${i}/name`, "thiếu name");
    if (!Array.isArray(s.prerequisites)) e(`/skills/${i}/prerequisites`, "phải là mảng");
  });
  for (const s of skills) {
    for (const p of s.prerequisites ?? []) {
      if (!skillIds.has(p)) e(`/skills/${s.id}/prerequisites`, `trỏ skill không tồn tại: ${p}`);
    }
  }
  const cycle = findCycle(skills);
  if (cycle) e("/skills", `chu trình prerequisites tại: ${cycle}`);

  const topicIds = new Set<string>();
  (grade.strands as Strand[] | undefined)?.forEach((st, si) => {
    if (!isStr(st.id)) e(`/strands/${si}/id`, "thiếu id");
    if (!Array.isArray(st.topics)) return e(`/strands/${si}/topics`, "phải là mảng");
    st.topics.forEach((t, ti) => {
      const tp = `/strands/${si}/topics/${ti}`;
      if (!isStr(t.id)) return e(`${tp}/id`, "thiếu id");
      if (topicIds.has(t.id)) e(`${tp}/id`, `id trùng: ${t.id}`);
      topicIds.add(t.id);
      if (!isStr(t.name)) e(`${tp}/name`, "thiếu name");
      if (!isGrade(t.grade)) e(`${tp}/grade`, "grade 1..12");
      if (!Array.isArray(t.skillIds)) return e(`${tp}/skillIds`, "phải là mảng");
      for (const sid of t.skillIds) {
        if (!skillIds.has(sid)) e(`${tp}/skillIds`, `trỏ skill không tồn tại: ${sid}`);
      }
    });
  });
  return errs;
}

type Strand = NonNullable<Grade["strands"]>[number];

/** Validate một câu hỏi. knownSkillIds (tùy chọn) để kiểm skillId tồn tại. */
export function validateQuestion(q: unknown, knownSkillIds?: Set<string>): ValidationError[] {
  const errs: ValidationError[] = [];
  const e = (p: string, m: string) => errs.push({ path: p, message: m });
  if (typeof q !== "object" || q === null) return [{ path: "/", message: "phải là object" }];
  const x = q as Partial<Question>;

  if (!isStr(x.id)) e("/id", "thiếu id");
  if (!isStr(x.skillId)) e("/skillId", "thiếu skillId");
  else if (knownSkillIds && !knownSkillIds.has(x.skillId))
    e("/skillId", `skill không tồn tại: ${x.skillId}`);
  if (!isGrade(x.grade)) e("/grade", "grade 1..12");
  if (!x.type || !QUESTION_TYPES.includes(x.type)) e("/type", `type không hợp lệ: ${x.type}`);
  if (!isStr(x.prompt)) e("/prompt", "thiếu prompt");
  if (!isStr(x.explanation)) e("/explanation", "thiếu explanation");

  const correctEmpty =
    x.correct == null || (Array.isArray(x.correct) ? x.correct.length === 0 : !isStr(x.correct));
  if (correctEmpty) e("/correct", "correct rỗng");

  if (x.type === "mcq") {
    if (!Array.isArray(x.choices) || x.choices.length < 2) e("/choices", "mcq cần ≥2 choices");
    else if (
      isStr(x.correct) &&
      !x.choices.some((c) => c.trim().toLowerCase() === (x.correct as string).trim().toLowerCase())
    )
      e("/correct", "correct phải nằm trong choices");
  }
  if (x.type === "fill-blank" && !Array.isArray(x.correct))
    e("/correct", "fill-blank cần correct là mảng");

  if (x.difficulty !== undefined && ![1, 2, 3].includes(x.difficulty as number))
    e("/difficulty", "difficulty phải là 1, 2 hoặc 3");

  if (x.image !== undefined) {
    if (typeof x.image !== "object" || x.image === null) e("/image", "image phải là object");
    else {
      if (!isStr(x.image.src)) e("/image/src", "thiếu src (URL hoặc key ảnh bundle)");
      if (!isStr(x.image.alt)) e("/image/alt", "thiếu alt (mô tả ảnh — bắt buộc)");
    }
  }

  return errs;
}
