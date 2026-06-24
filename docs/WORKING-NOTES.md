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
- **CI** `.github/workflows/ci.yml` (chạy trên `develop`): install → format:check → test →
  `sync:edge` + `git diff --exit-code` (chống lệch engine↔`_shared`) → `build:web` (expo export).
  Đã mô phỏng local: **xanh toàn bộ**.
- **Spec Kit khởi tạo** (`specify init --ai claude`): `.specify/` (templates, scripts, memory) +
  `.claude/skills/speckit-*`. **Constitution** `.specify/memory/constitution.md` viết cho Synaptek
  (5 principles, trỏ Decision Log; v0.1.0).
- Docs: `README.md`, `CLAUDE.md`, `docs/00-architecture.md` (Decision Log D1–D13), `docs/02-roadmap.md`.
- **Git**: repo public `github.com/hoanghainh1188/synaptek`, default branch **`develop`** (git-flow).
  Remote origin qua HTTPS (token gh — SSH key không sẵn ở môi trường này).

## Việc tiếp theo (theo thứ tự)

1. **Mở PR** `feature/m0-ci-speckit` → `develop`, chờ CI xanh trên GitHub Actions rồi merge.
2. **Spike render Toán universal** (M0 còn lại): component vẽ phân số/biểu thức + UI nhập đáp số trên
   mobile; cân nhắc NativeWind cho design tokens dùng chung.
3. **Verify iOS sim** (`expo start --ios`) khi có Mac simulator — web đã pass, native chưa kiểm.
4. Vào **M1**: dùng `/speckit-specify` cho "Vòng luyện tập học sinh" (chốt lớp khởi đầu — D7 đề xuất lớp 4).

## Ghi chú / quyết định mở

- **Lớp khởi đầu M1**: đề xuất lớp 4 (D7) — chốt lại khi vào M1.
- **Nguồn nội dung & bản quyền** (rủi ro lớn nhất): câu hỏi phải bám CT GDPT 2018 nhưng KHÔNG sao
  chép nguyên văn SGK → cần quy trình biên soạn + review.
- **Tên `synaptek`**: kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.
