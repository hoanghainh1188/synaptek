# WORKING NOTES — điểm tiếp tục

> Đọc file này đầu mỗi phiên để biết đang ở đâu; cập nhật trước khi dừng.

## Đang ở đâu (cập nhật mới nhất)

**Mốc:** M0 ✅ · M1 ✅ (đóng/merge) → **M2 — Mastery & Lộ trình** đang implement. Nhánh `feature/m2-mastery-path`.
**Đã tới Checkpoint US1 (MVP) — chủ repo nghiệm thu OK** (xem screenshot: trang chủ/lộ trình, chẩn đoán,
luyện tập phân số, heatmap). US2/US3 + Polish để sau (chủ trương: "sẽ cải tiến tiếp trong tương lai").

> **CHƯA commit** — toàn bộ thay đổi M2 US1 còn ở working tree trên `feature/m2-mastery-path`. Việc kế
> tiếp rõ ràng nhất: **commit checkpoint US1** (conventional commit) rồi tiếp US2, hoặc tiếp US2 trước.
> Chạy local: `supabase start` (migration `0002` đã áp) → `npm run web -w @synaptek/app`. Guest luyện
> được; đăng nhập để lưu mastery + thấy heatmap/lộ trình cá nhân hóa.

**Spec Kit M2 (`specs/002-mastery-path/`):** specify → clarify → plan → tasks → analyze (+remediation) ✅.
Clarify chốt: ngưỡng "đã đạt" **0.95**; chẩn đoán **~5–8 câu**; XP theo độ khó (field `difficulty` tùy
chọn + fallback); push **best-effort** (in-app bắt buộc); mốc ngày **Asia/Ho_Chi_Minh**.
Decision Log **D19** (BKT) · **D20** (gamification) · **D21** (cron+push) đã ghi.

**Implement US1 (27/57 task: T001–T027 ✅; US2/US3/Polish = 30 task còn lại):**

- ✅ **Package mới `@synaptek/learning-path`** (TS thuần, zero-dep, test `node --experimental-strip-types`):
  `bkt.ts` (BKT, `MASTERED=0.95`), `recommender.ts` (gate tiên quyết — 0 vi phạm, SC-002), `diagnostic.ts`,
  `heatmap.ts`, `time.ts` (`dayKeyVN`). **25 test xanh.**
- ✅ `@synaptek/curriculum`: thêm `difficulty?: 1|2|3` + validate (+3 test → 17).
- ✅ Migration **`0002_m2_mastery.sql`** (gamification_state · student_badges · push_tokens · review_reminders)
  — **đã áp local** (`supabase migration up`). `skill_mastery` (0001) giữ nguyên.
- ✅ `content/gamification/badges.json` (6 huy hiệu seed — chưa dùng tới US2).
- ✅ App: view-model thuần `lib/mastery.ts` (+4 test) · `lib/path.ts` (+2 test); `supabase/mastery.ts`
  (read/upsert, guest no-op + flush khi login — U1); helpers content (skillOf/questionsBySkill/topicOfSkill…).
- ✅ UI: `app/diagnostic.tsx`, `app/heatmap.tsx`, `app/index.tsx` (lộ trình "hôm nay" + cold-start gợi ý
  kỹ năng nền), nối ghi `skill_mastery` sau phiên (`practice/[topicId].tsx`).
- ✅ E2E `tests/e2e/diagnostic-path.spec.ts` (3 test, guest mode) — **6/6 e2e** xanh (gồm M1 cũ; đã chỉnh
  `getByLabel(..., {exact:true})` cho nhãn chủ đề do thêm thẻ lộ trình).
- ✅ **expo export -p web xanh** (11 routes); **format:check** sạch; **sync:edge** chưa đụng (US3 mới cần).

**Test toàn repo: xanh** (engine 19 + curriculum 17 + learning-path 25 + app lib session/math-markup/progress
/mastery 4/path 2) + **6 e2e**.

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

1. **Commit checkpoint US1** trên `feature/m2-mastery-path` (conventional commit; no-attribution). Cân nhắc
   `git -c commit.gpgsign=false commit`. Husky pre-commit sẽ format. (Chưa cần PR — M2 chưa xong.)
2. **US2 (P2) — Gamification** (T028–T039): `gamification.ts` (XP theo độ khó · streak mốc VN · huy hiệu
   mở-một-lần) + validate `badges.json`; bảng `gamification_state`/`student_badges`; UI hồ sơ/huy hiệu +
   ăn mừng (reduced-motion). TDD trước.
3. **US3 (P3) — Spaced repetition + cron + push** (T040–T050): `schedule.ts` (SM-2) + mở rộng `sync:edge`
   vào `_shared/learning-path`; Edge Function `review-scheduler` (idempotent); `expo-notifications`
   (best-effort). **Cần xác nhận**: cú pháp Supabase scheduled function + API expo-notifications SDK 56.
4. **Polish** (T051–T057): coverage ≥80% learning-path; thêm `diagnostic-path` vào CI; validate badges;
   accessibility; cập nhật roadmap; PR `feature/m2-mastery-path` → `develop`.
5. **Verify iOS sim** khi có Mac simulator (web đã pass).

> **Định hướng tương lai (chủ repo nêu):** sẽ còn cải tiến tiếp. Ý tưởng để ngỏ: tinh chỉnh tham số BKT
> bằng dữ liệu thật; heatmap dạng lỗi chi tiết hơn; populate heatmap demo (cần login). Ghi lại khi rõ.

## Ghi chú / quyết định mở

- **Lớp khởi đầu M1**: ✅ chốt **lớp 4** + cho ôn lớp 1–3 (D15).
- **Auth M1**: ✅ chốt **tối thiểu** (Supabase email/mật khẩu) (D16).
- **Nguồn nội dung & bản quyền** (rủi ro #1): câu hỏi bám CT GDPT 2018 nhưng KHÔNG chép nguyên văn SGK
  → biên soạn **thủ công JSON + import** (D14), luồng riêng, cần quy trình review.
- **Tên `synaptek`**: kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.
