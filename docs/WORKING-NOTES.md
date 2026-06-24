# WORKING NOTES — điểm tiếp tục

> Đọc file này đầu mỗi phiên để biết đang ở đâu; cập nhật trước khi dừng.

## Đang ở đâu (cập nhật mới nhất)

**Mốc:** M0 — Scaffolding & Spike (đang làm).

**Đã xong:**

- Monorepo npm workspaces + tooling mirror twolody: `package.json` (workspaces `apps/*` + `packages/*`,
  prettier/lint-staged inline, husky), `.nvmrc` (22), `.gitignore`, `.prettierignore`. Commit đầu `df28f29`.
- `packages/grading-engine` — **TDD, 19/19 test xanh** (`npm test`). Chấm `mcq` · `true-false` ·
  `numeric` (chuẩn hóa số VN) · `fraction` (tương đương giá trị) · `expression` (tương đương đại số
  qua lấy mẫu x) · `fill-blank` (partial). Đây là moat của sản phẩm.
- **`apps/app` (Expo Router universal, SDK 56)** dựng xong: React 19.2 / RN 0.85 / react-native-web,
  Expo Router typed routes, web output `static`. `metro.config.js` cấu hình monorepo. **Build web OK**
  (`npx expo export -p web`). Route `src/app/grading-demo.tsx` import `@synaptek/grading-engine` đã
  bundle + pre-render → **khóa pattern 2-consumer phía client** (symlink workspace chuẩn).
- **Supabase config-as-code — ĐÃ VERIFY LOCAL** (supabase 2.107 / deno 2.8 / Docker): `config.toml`;
  migration `0001_init.sql` (profiles · attempts · skill_mastery + RLS + trigger) — `supabase start` áp
  **sạch**; **Edge Function `grade`** (consumer #2 server) chấm đúng qua `functions serve` (gồm
  `2x+4 ≡ 2(x+2)`), **đáp án không lộ** (D4). Engine chạy trên Deno OK.
  - ⚠️ Edge-runtime chỉ mount `supabase/functions` → engine phải đồng bộ vào `functions/_shared/` bằng
    `npm run sync:edge` (import map trỏ `./_shared`). `packages/` vẫn là nguồn-sự-thật (D13). Chạy/deploy: `supabase/README.md`.
- Docs: `README.md`, `CLAUDE.md`, `docs/00-architecture.md` (Decision Log D1–D13), `docs/02-roadmap.md`.

## Việc tiếp theo (theo thứ tự)

1. **CI** `.github/workflows/ci.yml`: format → lint → test → **`npm run sync:edge` + `git diff --exit-code`**
   (chống lệch engine ↔ `_shared`) → `expo export -p web` → (sau) Playwright e2e.
2. **Spike render Toán universal**: component vẽ phân số/biểu thức + UI nhập đáp số trên mobile;
   cân nhắc NativeWind cho design tokens dùng chung.
3. **Verify iOS sim** (`expo run:ios` / `expo start --ios`) khi có máy Mac có simulator runtime —
   web đã pass, native chưa kiểm trên môi trường này.
4. Khởi tạo **Spec Kit** (`.specify/` + constitution) trước khi vào M1.

## Ghi chú / quyết định mở

- **Lớp khởi đầu M1**: đề xuất lớp 4 (D7) — chốt lại khi vào M1.
- **Nguồn nội dung & bản quyền** (rủi ro lớn nhất): câu hỏi phải bám CT GDPT 2018 nhưng KHÔNG sao
  chép nguyên văn SGK → cần quy trình biên soạn + review.
- **Tên `synaptek`**: kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.
