// Đồng bộ logic TS thuần (nguồn-sự-thật ở packages/) vào supabase/functions/_shared.
// Vì edge-runtime chỉ mount supabase/functions, không thấy packages/ (D13). Bản _shared là
// artifact TỰ SINH — sửa nguồn rồi chạy `npm run sync:edge`. CI kiểm `git diff` chống lệch.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

const bannerFor = (src) =>
  `// ⚠️ AUTO-GENERATED từ ${src} — KHÔNG sửa tay.\n` +
  `// Cập nhật: chỉnh nguồn rồi chạy \`npm run sync:edge\`. Lý do bản sao: D13.\n\n`;

/** Sao một file nguồn → đích kèm banner. */
function syncFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, bannerFor(src) + readFileSync(src, "utf8"));
  console.log(`synced ${src} -> ${dest}`);
}

// 1) grading-engine (consumer #2: Edge Function `grade`).
syncFile(
  "packages/grading-engine/src/grading-engine.ts",
  "supabase/functions/_shared/grading-engine.ts",
);

// 2) learning-path — chỉ phần job nền cần (schedule + time, đều TS thuần zero-dep).
//    Edge Function `review-scheduler` import `nextDueAt` + `dayKeyVN` qua index re-export.
const LP_DEST = "supabase/functions/_shared/learning-path";
syncFile("packages/learning-path/src/schedule.ts", `${LP_DEST}/schedule.ts`);
syncFile("packages/learning-path/src/time.ts", `${LP_DEST}/time.ts`);

writeFileSync(
  `${LP_DEST}/index.ts`,
  `// ⚠️ AUTO-GENERATED (npm run sync:edge) — re-export tối thiểu cho Edge Function. Lý do: D13.\n` +
    `export { nextDueAt } from "./schedule.ts";\n` +
    `export { dayKeyVN } from "./time.ts";\n`,
);
console.log(`generated ${LP_DEST}/index.ts`);

// 3) answer-keys — đáp án cho CHẤM CHÍNH THỨC server-side (D4). Sinh từ content/questions (D6);
//    edge chỉ mount supabase/functions (D13) nên đáp án phải là artifact tự sinh ở _shared (KHÔNG vào client/DB).
const QDIR = "content/questions";
const keys = {};
for (const f of readdirSync(QDIR)
  .filter((x) => x.endsWith(".json"))
  .sort()) {
  const arr = JSON.parse(readFileSync(join(QDIR, f), "utf8"));
  for (const q of arr) {
    if (!q?.id) continue;
    const k = { type: q.type, correct: q.correct };
    if (q.options?.tolerance !== undefined) k.tolerance = q.options.tolerance;
    keys[q.id] = k;
  }
}
const AK_DEST = "supabase/functions/_shared/answer-keys.ts";
writeFileSync(
  AK_DEST,
  `// ⚠️ AUTO-GENERATED từ ${QDIR}/*.json — KHÔNG sửa tay (npm run sync:edge). Đáp án chấm server (D4/D6/D13).\n` +
    `import type { QuestionType } from "./grading-engine.ts";\n` +
    `export interface AnswerKey { type: QuestionType; correct: string | string[]; tolerance?: number }\n` +
    `export const ANSWER_KEYS: Record<string, AnswerKey> = ${JSON.stringify(keys, null, 2)};\n`,
);
console.log(`generated ${AK_DEST}: ${Object.keys(keys).length} đáp án`);
