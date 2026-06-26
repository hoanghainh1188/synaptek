// Đồng bộ logic TS thuần (nguồn-sự-thật ở packages/) vào supabase/functions/_shared.
// Vì edge-runtime chỉ mount supabase/functions, không thấy packages/ (D13). Bản _shared là
// artifact TỰ SINH — sửa nguồn rồi chạy `npm run sync:edge`. CI kiểm `git diff` chống lệch.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

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
