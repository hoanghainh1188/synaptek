// Đồng bộ CSS + font KaTeX (node_modules/katex/dist) vào apps/app/public/katex (D53).
// Static asset tĩnh (KHÔNG qua Metro module graph — từng gây OOM dev server, xem D53) nên
// KHÔNG tự động theo node_modules lúc build; phải đồng bộ tay bằng script này rồi commit.
// Sửa nguồn: nâng cấp `katex` trong package.json rồi chạy `npm run sync:katex`. CI kiểm `git diff`
// chống lệch (giống pattern `sync:edge`, D13).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = "node_modules/katex/dist";
const DEST_DIR = "apps/app/public/katex";

if (!existsSync(SRC_DIR)) {
  console.error(`Không tìm thấy ${SRC_DIR} — chạy npm install trước.`);
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });
writeFileSync(join(DEST_DIR, "katex.min.css"), readFileSync(join(SRC_DIR, "katex.min.css")));
console.log(`synced ${SRC_DIR}/katex.min.css -> ${DEST_DIR}/katex.min.css`);

// Xoá sạch rồi copy lại toàn bộ — tránh sót file font cũ nếu katex đổi/xoá font ở bản nâng cấp sau.
const fontsDest = join(DEST_DIR, "fonts");
rmSync(fontsDest, { recursive: true, force: true });
mkdirSync(fontsDest, { recursive: true });
const fontFiles = readdirSync(join(SRC_DIR, "fonts"));
for (const f of fontFiles) {
  writeFileSync(join(fontsDest, f), readFileSync(join(SRC_DIR, "fonts", f)));
}
console.log(`synced ${fontFiles.length} font file(s) -> ${fontsDest}`);
