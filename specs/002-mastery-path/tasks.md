# Tasks: M2 — Mastery & Lộ trình cá nhân hóa

**Input**: Design documents từ `specs/002-mastery-path/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)
**Prerequisites**: plan.md ✅, spec.md ✅ (đã clarify), research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: BẮT BUỘC (Constitution III — test-first cho `packages/*` & logic thuần). Package
`@synaptek/learning-path` test bằng `node --experimental-strip-types --no-warnings` (như
`grading-engine`/`curriculum`); app lib tương tự; Playwright cho e2e web.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong).
- **[Story]**: US1/US2/US3 (theo spec). Setup/Foundational/Polish không gắn nhãn story.
- Đường dẫn file chính xác trong mô tả.

## Path Conventions

Monorepo (D5): `packages/learning-path/` (TS thuần mới), `packages/curriculum/` (sửa nhẹ),
`apps/app/src/{app,lib,components}/`, `supabase/{migrations,functions}/`, `content/gamification/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khởi tạo package mới + chỗ chứa nội dung/migration; không logic nghiệp vụ.

- [x] T001 Tạo skeleton package `@synaptek/learning-path`: `packages/learning-path/package.json`
      (`"type":"module"`, `"main":"src/index.ts"`, `"test"` chạy lần lượt các file `tests/*.test.ts` qua
      `node --experimental-strip-types --no-warnings`), `packages/learning-path/src/index.ts` (rỗng, export dần),
      `packages/learning-path/README.md` (mô tả vai trò + D19/D20/D21).
- [x] T002 [P] Thêm trường tùy chọn `difficulty?: 1|2|3` vào `Question` trong
      `packages/curriculum/src/types.ts` (kèm chú thích tiếng Việt).
- [x] T003 [P] Tạo seed nội dung huy hiệu `content/gamification/badges.json` (~6–8 mốc: streak 3/7, xp
      100/500, thành thạo "Phân số", 100 câu đúng) theo `data-model.md §5`.
- [x] T004 [P] Xác minh workspace mới được link: chạy `npm install` ở gốc rồi kiểm
      `ls node_modules/@synaptek/learning-path` (symlink) — `.env` của app giữ nguyên như M1.

**Checkpoint**: `npm test -w @synaptek/learning-path` chạy (0 test cũng OK); workspace được nhận.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung mọi user story — schema validation, quy ước thời gian, migration DB.
**⚠️ Phải xong trước khi bắt đầu US1/US2/US3.**

- [x] T005 [P] TDD `difficulty` ở curriculum: viết test (RED) trong `packages/curriculum/tests/curriculum.test.ts`
      cho `validateQuestion` — `difficulty` vắng → hợp lệ; ∈{1,2,3} → hợp lệ; =0/4/"a" → lỗi `/difficulty`.
- [x] T006 [P] Cập nhật `packages/curriculum/src/schema.ts` cho test T005 PASS (validate `difficulty` tùy chọn).
- [x] T007 [P] TDD `time.ts`: test (RED) `packages/learning-path/tests/time.test.ts` — `dayKeyVN(epochMs)`
      trả "YYYY-MM-DD" theo Asia/Ho_Chi_Minh; ổn định quanh nửa đêm VN (16:59 vs 17:01 UTC khác ngày).
- [x] T008 [P] Implement `packages/learning-path/src/time.ts` cho T007 PASS (export qua `src/index.ts`).
- [x] T009 Tạo migration `supabase/migrations/0002_m2_mastery.sql` theo `contracts/db-schema.md`
      (`gamification_state` · `student_badges` · `push_tokens` · `review_reminders` + RLS + grants).
      Xác minh: `supabase db reset` chạy sạch (migration hợp lệ).

**Checkpoint**: schema validate `difficulty`; `dayKeyVN` xanh; migration `0002` áp được. Nền sẵn sàng.

---

## Phase 3: User Story 1 — Biết "học gì tiếp" & yếu ở đâu (Priority: P1) 🎯 MVP

**Goal**: Chẩn đoán → mastery BKT → lộ trình "học gì tiếp" (gate tiên quyết ∧ mastery thấp) → bản đồ điểm yếu.
**Independent Test**: HS mới làm chẩn đoán → mastery khởi tạo; luyện đúng/sai → mastery đổi hợp lý + lộ
trình ưu tiên kỹ năng yếu, không bao giờ đề xuất kỹ năng tiên quyết chưa đạt; heatmap chỉ đúng chỗ yếu.

### Tests (viết trước — RED)

- [x] T010 [P] [US1] `packages/learning-path/tests/bkt.test.ts`: `updateMastery` đơn điệu (đúng→tăng),
      sai→giảm/chậm, biên [0,1], **tất định**; đổi `BktParams` không "nhảy bậc" (FR-020). `initFromDiagnostic`
      khởi tạo từ `pInit` cho kỹ năng được chạm.
- [x] T011 [P] [US1] `packages/learning-path/tests/recommender.test.ts`: `recommendNext` **0 vi phạm tiên
      quyết** trên bộ ca DAG (SC-002); chỉ trả `mastery < MASTERED` ∧ tiên quyết ≥ MASTERED ∧ `hasQuestions`;
      xếp `due` trước `weak/new`.
- [x] T012 [P] [US1] `packages/learning-path/tests/diagnostic.test.ts`: `buildDiagnostic` trả 5–8 câu trải
      kỹ năng nền (ưu tiên kỹ năng gốc), tất định theo seed.
- [x] T013 [P] [US1] `packages/learning-path/tests/heatmap.test.ts`: `skillWeakness` xếp kỹ năng yếu nhất;
      `commonErrorType` suy nhãn dạng lỗi theo skill + loại câu sai.

### Implementation (cho test GREEN)

- [x] T014 [US1] Implement `packages/learning-path/src/bkt.ts` (`BktParams`, `DEFAULT_BKT`, `MASTERED`,
      `updateMastery`, `initFromDiagnostic`) theo `contracts/learning-path-api.md`; export qua `src/index.ts`.
- [x] T015 [US1] Implement `packages/learning-path/src/recommender.ts` (`recommendNext`, types
      `SkillNode`/`Recommendation`/`RecommendReason`); export.
- [x] T016 [US1] Implement `packages/learning-path/src/diagnostic.ts` (`buildDiagnostic`); export.
- [x] T017 [US1] Implement `packages/learning-path/src/heatmap.ts` (`skillWeakness`, `commonErrorType`,
      type `HeatCell`); export.

### App view-models (logic thuần — test trước)

- [x] T018 [P] [US1] TDD `apps/app/src/lib/mastery.test.ts`: gộp `attempts` (theo thứ tự) → mastery map qua
      `updateMastery`; map question→skill từ content.
- [x] T019 [US1] Implement `apps/app/src/lib/mastery.ts` (build mastery map; chuẩn bị upsert `skill_mastery`)
      cho T018 PASS.
- [x] T020 [P] [US1] TDD `apps/app/src/lib/path.test.ts`: dựng `SkillNode[]` từ `@synaptek/curriculum` + gọi
      `recommendNext`; nhóm "đến hạn" vs "học mới".
- [x] T021 [US1] Implement `apps/app/src/lib/path.ts` cho T020 PASS.
- [x] T022 [US1] `apps/app/src/lib/supabase/mastery.ts`: TanStack Query đọc/upsert `skill_mastery`
      (RLS của HS; guest → no-op như `attempts.ts`). **Khi khách đăng nhập**: đẩy mastery tính trong
      bộ nhớ (gồm kết quả chẩn đoán của phiên khách) lên `skill_mastery` — mirror luồng guest→login của
      `attempts` (M1), theo Edge Case "guest… đẩy lên khi đăng nhập".

### UI (bám design tokens, anti-template, reduced-motion)

- [x] T023 [US1] Màn chẩn đoán `apps/app/src/app/diagnostic.tsx` + components
      `apps/app/src/components/diagnostic/*` (dùng `buildDiagnostic`, tái dùng UI luyện tập M1).
- [x] T024 [US1] Sửa trang chủ `apps/app/src/app/index.tsx` → hiển thị **lộ trình "hôm nay học gì"** (2 nhóm
      due/new) qua `lib/path.ts`; mời chẩn đoán nếu chưa làm (FR-006).
- [x] T025 [US1] Màn bản đồ điểm yếu `apps/app/src/app/heatmap.tsx` + `apps/app/src/components/heatmap/*`
      (thang màu theo tokens ngữ nghĩa, dạng lỗi từ `commonErrorType`).
- [x] T026 [US1] Nối ghi `skill_mastery` sau mỗi phiên luyện (cập nhật `mastery`/`attempts_count`/`last_reviewed`)
      trong luồng kết quả phiên (`apps/app/src/app/result.tsx` hoặc lib phiên), chỉ khi đã đăng nhập.

### E2E (Playwright web)

- [x] T027 [US1] `apps/app/tests/e2e/diagnostic-path.spec.ts`: chẩn đoán → trang chủ có lộ trình; luyện
      đúng nhiều lần → kỹ năng phụ thuộc mở khóa; mở heatmap thấy kỹ năng yếu. (Auth có thể seed/skip như M1.)

**Checkpoint US1** 🎯: MVP M2 — HS biết "học gì tiếp" & yếu ở đâu. Demo độc lập, không cần US2/US3.
**DỪNG ở đây để nghiệm thu nếu chạy theo MVP-first.**

---

## Phase 4: User Story 2 — Có động lực quay lại mỗi ngày (Priority: P2)

**Goal**: XP (theo độ khó) + streak (mốc VN) + huy hiệu (mở một lần) + ăn mừng.
**Independent Test**: hoàn thành phiên → XP đúng; luyện ngày kế → streak+1, bỏ lỡ → reset; đạt mốc → huy
hiệu mở một lần, không trùng.

### Tests (viết trước — RED)

- [x] T028 [P] [US2] `packages/learning-path/tests/gamification.test.ts`: `difficultyOf` (field ưu tiên,
      fallback theo loại); `xpForAttempt` (sai→0, đúng×trọng số {1:1,2:1.5,3:2}); `updateStreak` (+1/ngày,
      reset khi cách ngày, không +2 cùng ngày, cập nhật longest); `evaluateBadges` mở **đúng một lần** (SC-005).
- [x] T029 [P] [US2] `packages/learning-path/tests/badges-schema.test.ts`: validate `content/gamification/
badges.json` hợp schema `Badge`/`BadgeCriteria` (gate nội dung như D6).

### Implementation

- [x] T030 [US2] Implement `packages/learning-path/src/gamification.ts` (`difficultyOf`, `xpForAttempt`,
      `updateStreak`, `evaluateBadges`, types `GamificationState`/`Badge`/`BadgeCriteria`) + validate badge
      catalog; export. Cho T028/T029 PASS.

### App

- [x] T031 [P] [US2] TDD `apps/app/src/lib/gamification.test.ts`: gộp một phiên → ΔXP + streak mới + huy hiệu mới.
- [x] T032 [US2] Implement `apps/app/src/lib/gamification.ts` cho T031 PASS (đọc badges từ content).
- [x] T033 [US2] `apps/app/src/lib/supabase/gamification.ts`: TanStack Query đọc/upsert `gamification_state` + `student_badges` (RLS của HS; guest → no-op).
- [x] T034 [US2] Hiển thị **XP nhận được** + tổng XP ở tổng kết phiên (`apps/app/src/app/result.tsx`) (FR-009).
- [x] T035 [US2] Hiển thị streak + XP ở trang chủ (`apps/app/src/app/index.tsx`).
- [x] T036 [US2] Màn hồ sơ + huy hiệu `apps/app/src/app/profile.tsx` + `apps/app/src/components/gamification/*`
      (huy hiệu chưa mở ở trạng thái mờ + điều kiện) (FR-011).
- [x] T037 [US2] Component ăn mừng mở huy hiệu/đạt mốc `apps/app/src/components/gamification/Celebrate.tsx`
      (transform/opacity, **tôn trọng `reduced-motion`**) (FR-012).
- [x] T038 [US2] Nối cập nhật `gamification_state`/`student_badges` vào luồng kết thúc phiên (chỉ khi đăng nhập).

### E2E

- [x] T039 [US2] `apps/app/tests/e2e/streak-xp.spec.ts`: hoàn thành phiên → XP hiện; (mô phỏng ngày) streak;
      đạt mốc → huy hiệu mở một lần.

**Checkpoint US2**: Gamification đầy đủ chạy độc lập trên nền US1.

---

## Phase 5: User Story 3 — Được nhắc ôn đúng lúc (Priority: P3)

**Goal**: SM-2 đặt `due_at` → lộ trình "đến hạn" → job nền idempotent → push best-effort; in-app bắt buộc.
**Independent Test**: đặt `due_at` quá khứ → chạy scheduler → có đúng 1 nhắc/HS, kỹ năng vào mục "đến hạn";
HS chưa cấp quyền vẫn thấy nhắc in-app.

### Tests (viết trước — RED)

- [x] T040 [P] [US3] `packages/learning-path/tests/schedule.test.ts`: `nextDueAt` — mastery thấp→khoảng cách
      ngắn hơn cao; tăng theo `repetition`; trả mốc theo ngày VN.

### Implementation (logic + edge)

- [x] T041 [US3] Implement `packages/learning-path/src/schedule.ts` (`nextDueAt`) cho T040 PASS; export.
- [x] T042 [US3] Mở rộng `scripts/sync-edge-engine.mjs`: đồng bộ `schedule.ts` + `time.ts` (+ phụ thuộc thuần)
      → `supabase/functions/_shared/learning-path/` (banner AUTO-GENERATED). Chạy `npm run sync:edge`.
- [x] T043 [US3] Edge Function `supabase/functions/review-scheduler/index.ts` theo `contracts/review-scheduler.md`
      (đọc `skill_mastery.due_at ≤ now` theo HS, insert `review_reminders` on-conflict-do-nothing, push best-effort
      qua Expo); cập nhật import map/`deno.json`. **Xác nhận cú pháp scheduled function Supabase hiện hành (docs).**
- [x] T044 [P] [US3] Test idempotency scheduler `supabase/functions/review-scheduler/index.test.ts` (hoặc
      script integration): chạy 2 lần cùng `due_date` → đúng 1 dòng `review_reminders`/HS (SC-006).

### App

- [x] T045 [US3] Nối ghi `skill_mastery.due_at` bằng `nextDueAt` sau mỗi lần cập nhật mastery (mở rộng T026).
- [x] T046 [US3] Mục "Đến hạn ôn" ưu tiên trước "học mới" ở trang chủ (mở rộng `lib/path.ts`/`index.tsx`) (FR-015).
- [x] T047 [P] [US3] `apps/app/src/lib/notifications.ts`: xin quyền + lấy Expo push token (best-effort),
      **xác nhận API expo-notifications ở Expo SDK 56** (docs.expo.dev/versions/v56.0.0/).
- [x] T048 [US3] `apps/app/src/lib/supabase/push.ts`: lưu/cập nhật `push_tokens` (enabled); toggle tắt thông báo (FR-019).
- [x] T049 [US3] Cài `expo-notifications` vào `apps/app` (phiên bản hợp SDK 56) + cấu hình app.json nếu cần.

### E2E

- [x] T050 [US3] `apps/app/tests/e2e/due-reminder.spec.ts`: kỹ năng `due_at` quá khứ → hiện ở mục "đến hạn"
      in-app cho HS chưa cấp quyền (SC-007). (Push native không kiểm ở web.)

**Checkpoint US3**: ôn ngắt quãng + cron idempotent + in-app reminder; push best-effort (không chặn done).

---

## Phase 6: Polish & Cross-Cutting

- [x] T051 [P] Kiểm coverage `@synaptek/learning-path` ≥ 80% (đếm nhánh chính bkt/recommender/schedule/
      gamification/heatmap/time); bổ sung ca thiếu.
- [x] T052 [P] Chạy `npm run validate:content` (gồm badges.json) — xanh.
- [x] T053 [P] Chạy `npm run sync:edge` + `git diff --exit-code supabase/functions/_shared` — sạch (CI gate).
- [x] T054 [P] Trạng thái rỗng + edge cases UI: "đã vững — ôn nâng cao", chẩn đoán bỏ qua, guest (mời đăng
      nhập để lưu) — bám spec Edge Cases.
- [x] T055 [P] Kiểm accessibility: `reduced-motion` cho ăn mừng; tương phản thang heatmap; vùng chạm ≥ 48px;
      chữ Việt có dấu.
- [x] T056 [P] `npm run format` + chạy `npm test` toàn workspace xanh — gồm test `grading-engine`
      (chốt regression FR-021: M2 KHÔNG đổi hành vi chấm M1).
- [x] T057 Cập nhật `docs/WORKING-NOTES.md` (điểm tiếp tục) + `docs/02-roadmap.md` (M2 trạng thái) trong cùng PR;
      xác nhận Decision Log D19–D21 đã ghi.

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** → **US1 (P3)** → **US2 (P4)** → **US3 (P5)** → **Polish (P6)**.
- **Foundational chặn tất cả**: T005–T009 xong trước mọi user story (đặc biệt migration T009 cho US2/US3;
  `time.ts` T007/T008 cho US2 streak + US3 schedule).
- **US1 độc lập** (MVP) — chỉ phụ thuộc Foundational. Có thể dừng nghiệm thu sau Checkpoint US1.
- **US2 độc lập về demo** nhưng một số huy hiệu tham chiếu mastery (US1) → chạy sau US1 để demo đầy đủ.
- **US3 phụ thuộc** mastery + `due_at` (US1) cho dữ liệu "đến hạn"; scheduler tái dùng `schedule.ts`.
- Trong mỗi US: **Tests (RED) trước Implementation (GREEN)** (Constitution III).

## Parallel Opportunities

- **Setup**: T002, T003, T004 song song (khác file).
- **Foundational**: T005/T006 (curriculum) ∥ T007/T008 (time) — khác package; T009 (migration) độc lập.
- **US1 tests**: T010, T011, T012, T013 song song (khác file test) — viết hết RED rồi impl.
- **US1 view-model tests**: T018, T020 song song.
- **US2 tests**: T028, T029 song song; **US3**: T040, T044, T047 song song.
- **Polish**: T051–T056 phần lớn song song.

## Implementation Strategy

**MVP-first**: làm trọn **Phase 1 → 2 → US1**, dừng ở **Checkpoint US1** để nghiệm thu (mastery + lộ trình

- heatmap đã là giá trị lõi của M2). Sau đó tăng dần US2 (động lực) rồi US3 (nhắc ôn). Push native là
  best-effort — không chặn "done" (clarify Q4). Mỗi phase giữ repo ở trạng thái chạy được + CI xanh.
