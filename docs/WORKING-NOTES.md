# WORKING NOTES — điểm tiếp tục

> Đọc file này đầu mỗi phiên để biết đang ở đâu; cập nhật trước khi dừng.

## Đang ở đâu (cập nhật mới nhất)

**Mốc:** M0 đóng → **M1 — Vòng luyện tập** đang implement. Nhánh `feature/m1-practice-loop` (draft PR #2).
**US1 ✅ + Content pipeline ✅ + US2 ✅** (auth + lưu tiến độ, backend verified). Còn: US3 (ôn lớp dưới) + Polish.

> Chạy US2 local: `supabase start` → tạo `apps/app/.env` (xem `.env.example`, key từ `supabase status`)
> → **restart dev server** để nạp env → đăng nhập/đăng ký, tiến độ lưu. Guest vẫn luyện được (không lưu).
> **Đã tới Checkpoint US1 (MVP)** — chờ chủ repo nghiệm thu (`npm run web`).

**Implement (speckit-implement) — đã xong qua US1:**

- ✅ Phase 1 Setup: `@synaptek/curriculum` (T001), tokens (T004), **NativeWind v4 wired + web build verified** (T002/T003).
- ✅ Phase 2 Foundational: types/validate/select + 12 test (T006-T009), content seed lớp 4 (T010), content loader (T013).
- ✅ Phase 3 **US1**: session reducer 8 test (T014/T017), math-markup 5 test (T019), components math/practice (T018,T020-T023), routes home/practice/result (T024-T026). **expo export -p web xanh** (mọi route static-render).
- ✅ **Polish US1**: font **Be Vietnam Pro** (display) + Nunito (body) — Fredoka bị bỏ vì hỏng dấu TV (D17);
  **T016 e2e Playwright 2/2** (chromium); T015 phủ qua e2e + math-markup.
- ✅ **Content pipeline (D14/D18)**: `npm run gen:content` (manifest auto-discovery) + `npm run validate:content`
  (GATE, vào CI); câu hỏi hỗ trợ **ảnh** (`image`, alt bắt buộc) — QuestionCard render qua expo-image.
  Đã có nội dung Hình học (có ảnh data-URI SVG). **Hướng dẫn soạn bài: `docs/content-authoring.md`.**
- ⏳ Chưa làm: T005 (Vitest RN env cho component snapshot — đã thay bằng e2e).
- **Lưu ý**: components/lib/theme dưới `apps/app/src/` (alias `@`→`src`).

**Test toàn repo: 46 xanh** (engine 19 + curriculum 14 + session 8 + math-markup 5) + **2 e2e**.

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
- Docs: `README.md`, `CLAUDE.md`, `docs/00-architecture.md` (Decision Log **D1–D16**), `docs/02-roadmap.md`.
- **Git**: repo public `github.com/hoanghainh1188/synaptek`, default branch **`develop`** (git-flow).
  Remote origin qua HTTPS (token gh — SSH key không sẵn ở môi trường này). PR #1 (CI+Spec Kit) đã
  **merge squash** vào `develop` (`ea0fd48`). CI xanh trên GitHub Actions. → **M0 đóng.**
- **M1 bắt đầu**: `specs/001-m1-practice-loop/spec.md` (Spec Kit specify) — 3 user stories (P1 luyện
  tập+chấm tức thì · P2 auth+lưu tiến độ · P3 ôn lớp dưới), FR-001..012, success criteria. Quyết định
  mới: **D14** (content thủ công JSON + import, luồng riêng), **D15** (lớp 4 + ôn lớp 1–3), **D16**
  (auth tối thiểu Supabase).

## Việc tiếp theo (theo thứ tự)

1. **(tùy chọn) `/speckit-clarify`** cho spec M1 nếu còn điểm mơ hồ; rồi **`/speckit-plan`** → thiết kế
   kỹ thuật M1 (data model, `curriculum` schema đa lớp, contracts, auth flow, render Toán).
2. **`/speckit-tasks`** → sinh task list, rồi **`/speckit-implement`** theo TDD.
3. **Content pipeline (song song)**: chốt **schema câu hỏi/curriculum** (JSON) + cơ chế import; soạn bộ
   mẫu **~120 câu lớp 4** + ít chủ đề lớp 1–3 để chạy end-to-end.
4. Commit theo git-flow trên `feature/m1-practice-loop` → PR về `develop` (CI xanh).
5. **Verify iOS sim** khi có Mac simulator (web đã pass).

## Ghi chú / quyết định mở

- **Lớp khởi đầu M1**: ✅ chốt **lớp 4** + cho ôn lớp 1–3 (D15).
- **Auth M1**: ✅ chốt **tối thiểu** (Supabase email/mật khẩu) (D16).
- **Nguồn nội dung & bản quyền** (rủi ro #1): câu hỏi bám CT GDPT 2018 nhưng KHÔNG chép nguyên văn SGK
  → biên soạn **thủ công JSON + import** (D14), luồng riêng, cần quy trình review.
- **Tên `synaptek`**: kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.
