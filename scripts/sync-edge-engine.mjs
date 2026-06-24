// Đồng bộ grading-engine (nguồn-sự-thật ở packages/) vào supabase/functions/_shared.
// Vì edge-runtime chỉ mount supabase/functions, không thấy packages/ (D13). Bản _shared là
// artifact TỰ SINH — sửa nguồn rồi chạy `npm run sync:edge`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SRC = "packages/grading-engine/src/grading-engine.ts";
const DEST = "supabase/functions/_shared/grading-engine.ts";

const banner =
  `// ⚠️ AUTO-GENERATED từ ${SRC} — KHÔNG sửa tay.\n` +
  `// Cập nhật: chỉnh nguồn rồi chạy \`npm run sync:edge\`. Lý do bản sao: D13.\n\n`;

mkdirSync(dirname(DEST), { recursive: true });
writeFileSync(DEST, banner + readFileSync(SRC, "utf8"));
console.log(`synced ${SRC} -> ${DEST}`);
