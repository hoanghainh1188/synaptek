// GATE nội dung — validate toàn bộ content/ bằng @synaptek/curriculum. Báo lỗi rõ, exit≠0 nếu sai.
// Chạy: npm run validate:content   (node --experimental-strip-types để nạp curriculum .ts)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateCurriculum, validateQuestion } from "@synaptek/curriculum";
import { validateBadges } from "@synaptek/learning-path";
import { grade } from "@synaptek/grading-engine";

// Tự-chấm (self-grade): chạy ENGINE THẬT với answer = chính đáp án 'correct' → phải ra isCorrect.
// Bắt tự động cả một lớp lỗi soạn (đáp án gõ nhầm định dạng, tự mâu thuẫn, sai kiểu) TRƯỚC khi người
// duyệt đọc — engine không kiểm được đúng chương trình/sư phạm, nhưng kiểm được "đáp án có tự đúng không".
// derivation/compound có orchestrator riêng (step-grading/gradeCompound) → bỏ qua ở gate này.
const SELF_GRADE_TYPES = new Set([
  "mcq",
  "true-false",
  "numeric",
  "fraction",
  "expression",
  "fill-blank",
  "multi",
  "ordering",
  "matching",
]);

const ROOT = process.cwd();
const C = join(ROOT, "content");
let errors = 0;
const err = (msg) => {
  console.error(`  ✗ ${msg}`);
  errors++;
};

const ls = (sub, re) => {
  try {
    return readdirSync(join(C, sub)).filter((f) => re.test(f));
  } catch {
    return [];
  }
};
const readJson = (p) => JSON.parse(readFileSync(join(C, p), "utf8"));

console.log("Validate content\n");

// 1) Curriculum
const curricula = [];
for (const f of ls("curriculum", /\.json$/)) {
  const data = readJson(`curriculum/${f}`);
  curricula.push(data);
  for (const e of validateCurriculum(data)) err(`curriculum/${f} ${e.path}: ${e.message}`);
}
const skillIds = new Set(curricula.flatMap((c) => (c.skills ?? []).map((s) => s.id)));
const imageKeys = new Set(
  ls("images", /\.(png|jpe?g|webp|gif)$/i).map((f) => f.replace(/\.[^.]+$/, "")),
);

// 2) Câu hỏi
const seenIds = new Set();
for (const f of ls("questions", /\.json$/)) {
  const arr = readJson(`questions/${f}`);
  if (!Array.isArray(arr)) {
    err(`questions/${f}: phải là mảng`);
    continue;
  }
  arr.forEach((q, i) => {
    const where = `questions/${f}[${i}] (${q?.id ?? "?"})`;
    const schemaErrs = validateQuestion(q, skillIds);
    for (const e of schemaErrs) err(`${where} ${e.path}: ${e.message}`);
    if (q?.id) {
      if (seenIds.has(q.id)) err(`${where}: id trùng toàn cục: ${q.id}`);
      seenIds.add(q.id);
    }
    // Ảnh bundle phải tồn tại trong content/images
    const src = q?.image?.src;
    if (src && !/^(https?:|data:)/.test(src) && !imageKeys.has(src)) {
      err(`${where}: ảnh bundle '${src}' không có trong content/images/`);
    }
    // Tự-chấm: đáp án 'correct' phải TỰ chấm đúng (chỉ khi schema đã hợp lệ — tránh nhiễu lỗi kép).
    if (schemaErrs.length === 0 && SELF_GRADE_TYPES.has(q.type)) {
      try {
        const r = grade({
          type: q.type,
          correct: q.correct,
          answer: q.correct,
          options: q.options,
        });
        if (!r.isCorrect) {
          err(
            `${where}: đáp án 'correct' KHÔNG tự chấm đúng (feedbackCode=${r.feedbackCode}) — soạn sai?`,
          );
        }
      } catch (e) {
        err(`${where}: engine ném lỗi khi tự chấm: ${e.message}`);
      }
    }
  });
}

// 3) Huy hiệu gamification (D6/D20) — gate như nội dung khác
let badgeCount = 0;
for (const f of ls("gamification", /^badges\.json$/)) {
  const data = readJson(`gamification/${f}`);
  badgeCount = Array.isArray(data) ? data.length : 0;
  for (const e of validateBadges(data)) err(`gamification/${f} ${e.path}: ${e.message}`);
}

if (errors) {
  console.error(`\n${errors} lỗi nội dung.`);
  process.exit(1);
}
console.log(
  `✓ Nội dung hợp lệ (${seenIds.size} câu hỏi, ${skillIds.size} kỹ năng, ${badgeCount} huy hiệu).`,
);
