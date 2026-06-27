# Tasks: M3 — Giáo viên (lớp học, giao bài, chấm chính thức)

**Input**: Design documents từ `specs/003-teacher-classroom/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)
**Prerequisites**: plan.md ✅, spec.md ✅ (đã clarify), research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: BẮT BUỘC (Constitution III). Package `@synaptek/classroom` test bằng `node --experimental-strip-types
--no-warnings` (như engine/curriculum/learning-path). **RLS có bộ test cô lập** (phần khó nhất — kiểm như code).
Edge Function `grade-assignment` test bằng `deno test`. Playwright cho e2e web (auth-gated → ngoài CI, như M1/M2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong).
- **[Story]**: US1/US2/US3 (theo spec). Setup/Foundational/Polish không gắn nhãn story.

## Path Conventions

Monorepo (D5): `packages/classroom/` (TS thuần mới), `apps/app/src/{app,lib,components}/`,
`supabase/{migrations,functions,tests}/`, dùng lại `content/` (D6) + `@synaptek/{grading-engine,learning-path,curriculum}`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khởi tạo package mới; chưa logic nghiệp vụ.

- [ ] T001 Tạo skeleton package `@synaptek/classroom`: `packages/classroom/package.json` (`"type":"module"`,
      `"main":"src/index.ts"`, `"test"` chạy lần lượt `tests/*.test.ts` qua `node --experimental-strip-types
    --no-warnings`), `packages/classroom/src/index.ts` (rỗng, export dần), `packages/classroom/README.md`
      (vai trò + D22/D23/D24).
- [ ] T002 [P] Xác minh workspace link: `npm install` ở gốc rồi kiểm `ls node_modules/@synaptek/classroom`
      (symlink). `.env` app giữ nguyên.

**Checkpoint**: `npm test -w @synaptek/classroom` chạy (0 test cũng OK); workspace được nhận.

---

## Phase 2: Foundational (BLOCKING — chặn mọi user story)

**Purpose**: Storage + RLS chéo vai trò là nền cho US1/US2/US3. Phải xong trước.

- [ ] T003 Tạo migration `supabase/migrations/0003_m3_classroom.sql` theo `contracts/db-schema-0003.md`
      §1–6 **đầy đủ**: `profiles.role`; bảng `classes`/`class_members`/`assignments`/`submissions` + indexes;
      helper `SECURITY DEFINER` `owns_class`/`is_member`; RPC `join_class_by_code`; RLS policies mọi bảng;
      grants (gồm `service_role` + revoke `update(auto_score)` khỏi `authenticated`). M1/M2 KHÔNG đổi.
- [ ] T004 Áp migration local: `supabase db reset` (hoặc `migration up`) — 0001+0002+0003 áp **sạch**;
      kiểm bảng/policy tồn tại.
- [ ] T005 [P] Bộ test RLS `supabase/tests/rls-0003.sql` theo `contracts/db-schema-0003.md §7` (seed 2 GV +
      2 HS chéo lớp; 6 mệnh đề cô lập SC-002/007 + `join_class_by_code` mã sai/hết hạn + revoke `auto_score`).
      Chạy local **xanh**.

**Checkpoint**: migration áp sạch; bộ test RLS xanh (gate bảo mật cốt lõi M3).

---

## Phase 3: User Story 1 — Tạo lớp + mời học sinh (Priority: P1) 🎯 MVP

**Goal**: GV tạo lớp + mã mời; HS nhập mã vào lớp; GV thấy roster. RLS cô lập.
**Independent Test**: tài khoản GV tạo lớp → mã; tài khoản HS nhập mã → vào lớp; GV thấy HS; người ngoài không thấy.

### Tests (viết trước — RED)

- [ ] T006 [P] [US1] `packages/classroom/tests/invite.test.ts`: `makeInviteCode` (tất định theo seed, chỉ
      ký tự base32 an toàn, đúng độ dài), `normalizeInviteCode`, `isInviteValid` (biên now==expiresAt, null).

### Implementation

- [ ] T007 [US1] Implement `packages/classroom/src/invite.ts` (`makeInviteCode`/`normalizeInviteCode`/
      `isInviteValid`) cho T006 PASS; export qua `src/index.ts`.
- [ ] T008 [US1] `apps/app/src/lib/supabase/role.ts`: đọc/cập nhật `profiles.role` (TanStack); helper `useRole()`.
- [ ] T009 [US1] `apps/app/src/lib/supabase/classes.ts`: tạo lớp (sinh `invite_code` qua `@synaptek/classroom`),
      liệt kê lớp của GV, thu hồi/tạo lại mã (RLS của GV); guest → no-op.
- [ ] T010 [US1] `apps/app/src/lib/supabase/classes.ts` (tiếp): `joinByCode` (gọi RPC `join_class_by_code`),
      roster (đọc `class_members` + profiles), xóa HS khỏi lớp.
- [ ] T011 [US1] UI chọn vai trò khi đăng ký + đổi trong hồ sơ (`apps/app/src/app/login.tsx` + `profile.tsx`),
      set `profiles.role` (FR-001).
- [ ] T012 [US1] Route GV `apps/app/src/app/(teacher)/classes.tsx`: danh sách lớp + tạo lớp; **guard `role=teacher`**.
- [ ] T013 [US1] Route `apps/app/src/app/(teacher)/class/[id].tsx`: roster + hiển thị/thu hồi mã mời + (chỗ cho bài/phân tích sau).
- [ ] T014 [US1] Route `apps/app/src/app/join.tsx`: HS nhập mã → `joinByCode` → vào lớp; lỗi mã rõ ràng (FR-004).
- [ ] T015 [US1] `apps/app/tests/e2e/class-join.spec.ts` (auth-gated, ngoài CI): GV tạo lớp → HS nhập mã →
      GV thấy roster; người ngoài không thấy lớp.

**Checkpoint US1**: vai trò GV vận hành được lớp + roster độc lập (MVP M3). RLS cô lập (T005).

---

## Phase 4: User Story 2 — Giao bài & chấm chính thức server-side (Priority: P2)

**Goal**: GV soạn/giao bài từ `content/`; HS nộp → chấm server-side (ẩn đáp án — D4) → lưu điểm auto.
**Independent Test**: GV tạo bài 5 câu; HS trong lớp nộp → điểm khớp engine, **payload không có đáp án**; HS ngoài lớp bị chặn.

### Tests (viết trước — RED)

- [ ] T016 [P] [US2] `packages/classroom/tests/grading-policy.test.ts`: `isLate` (dueAt null/biên),
      `isValidScore` ([0,1]/NaN), `displayScore` (final ?? auto), `aggregateScore` (rỗng=0, trung bình).
- [ ] T017 [P] [US2] Deno test `supabase/functions/grade-assignment/index.test.ts`: chấm ẩn đáp án (payload
      không chứa `correct`), bỏ qua `questionId` thiếu (FR-017), không đụng `final_score` (audit). Dùng
      fake answer-keys + fake client (như `review-scheduler`).

### Implementation

- [ ] T018 [US2] Implement `packages/classroom/src/grading-policy.ts` cho T016 PASS; export.
- [ ] T019 [US2] Mở rộng `scripts/sync-edge-engine.mjs`: sinh `supabase/functions/_shared/answer-keys.ts`
      (`Record<questionId,{type,correct,tolerance?}>`) từ `content/questions/*.json` (banner AUTO-GENERATED);
      chạy `npm run sync:edge`. (D6/D13)
- [ ] T020 [US2] Edge Function `supabase/functions/grade-assignment/index.ts` theo `contracts/grade-assignment.md`
      (membership check + answer-keys + engine + upsert `auto_score`, **không trả đáp án**); `deno.json` import
      map (đã có engine/learning-path/supabase-js); `config.toml` `[functions.grade-assignment] verify_jwt=true`.
      Cho T017 PASS.
- [ ] T021 [US2] `apps/app/src/lib/supabase/assignments.ts`: GV tạo bài (chọn `questionId` từ `content/` +
      `due_at`), liệt kê bài cho lớp (GV) + cho HS (thành viên).
- [ ] T022 [US2] `apps/app/src/lib/supabase/submissions.ts`: HS nộp → gọi Edge `grade-assignment`; đọc bài
      nộp của mình (điểm hiển thị qua `displayScore`).
- [ ] T023 [US2] Route GV `apps/app/src/app/(teacher)/assignment/new.tsx`: soạn bài (duyệt câu theo chủ đề
      từ `content/`, chọn, đặt hạn) → tạo assignment.
- [ ] T024 [US2] Route HS `apps/app/src/app/assignments.tsx` (bài được giao) + `assignment/[id].tsx` (làm +
      nộp; dùng lại `QuestionCard`/`AnswerInput` M1; **không** lộ đáp án — chấm qua Edge).
- [ ] T025 [US2] `apps/app/tests/e2e/assignment-grade.spec.ts` (auth-gated, ngoài CI): GV giao bài → HS nộp →
      điểm hiện; HS ngoài lớp không thấy/không nộp được.

**Checkpoint US2**: vòng giao bài → nộp → chấm chính thức (đáng tin, ẩn đáp án) chạy trên nền US1.

---

## Phase 5: User Story 3 — Ghi đè điểm, nhận xét & phân tích lớp (Priority: P3)

**Goal**: GV ghi đè điểm + nhận xét (audit giữ auto); phân tích lớp (dùng lại learning-path heatmap/mastery).
**Independent Test**: GV ghi đè + nhận xét → HS thấy điểm cuối; DB giữ auto. Phân tích lớp đúng theo HS trong lớp.

### Tests (viết trước — RED)

- [ ] T026 [P] [US3] `packages/classroom/tests/analytics.test.ts`: `assignmentProgress` (chỉ thành viên,
      bỏ HS chưa nộp khỏi trung bình), `classWeakSkills` (gộp mastery HS trong lớp, xếp yếu nhất).

### Implementation

- [ ] T027 [US3] Implement `packages/classroom/src/analytics.ts` (dùng lại `@synaptek/learning-path`
      `skillWeakness`) cho T026 PASS; export.
- [ ] T028 [US3] `apps/app/src/lib/supabase/submissions.ts` (tiếp): GV đọc bài nộp theo assignment (RLS lớp);
      ghi đè `final_score` + `feedback` + `is_override` (validate qua `isValidScore`); giữ `auto_score`.
- [ ] T029 [US3] Route GV `apps/app/src/app/(teacher)/submission/[id].tsx`: xem bài nộp + ghi đè điểm + nhận xét.
- [ ] T030 [US3] HS xem **điểm cuối** + nhận xét (mở rộng `assignment/[id].tsx` hoặc màn kết quả bài).
- [ ] T031 [US3] Phân tích lớp ở `(teacher)/class/[id].tsx`: tiến độ bài + điểm yếu lớp (`@synaptek/classroom`
      `analytics` + heatmap learning-path), chỉ HS trong lớp (SC-005).
- [ ] T032 [US3] `apps/app/tests/e2e/override-analytics.spec.ts` (auth-gated, ngoài CI): GV ghi đè + nhận xét
      → HS thấy điểm cuối; phân tích lớp hiển thị.

**Checkpoint US3**: "điểm đáng tin" (audit) + phân tích lớp đầy đủ → GV vận hành lớp end-to-end (done M3).

---

## Phase 6: Polish & Cross-Cutting

- [ ] T033 [P] Coverage `@synaptek/classroom` ≥ 80% (invite/grading-policy/analytics) — bổ sung ca thiếu.
- [ ] T034 [P] `npm run sync:edge` + `git diff --exit-code supabase/functions/_shared` (gồm `answer-keys.ts`) — sạch (CI gate).
- [ ] T035 [P] Thêm `grade-assignment` vào step `deno test` của CI; cân nhắc thêm bộ RLS test vào CI (cần Postgres dịch vụ — nếu khả thi).
- [ ] T036 [P] Trạng thái rỗng + edge cases UI: lớp chưa có HS, chưa có bài, HS chưa nộp, mã hết hạn; guest/role=student không vào route GV.
- [ ] T037 [P] A11y: vùng chạm ≥ 48px, tương phản, chữ Việt có dấu; bám design tokens (anti-template).
- [ ] T038 [P] `npm run format` + `npm test` toàn workspace xanh — gồm **regression** engine (FR-021: chấm M1 không đổi) + `expo export` web xanh.
- [ ] T039 Cập nhật `docs/WORKING-NOTES.md` (điểm tiếp tục) + `docs/02-roadmap.md` (M3 trạng thái) + xác nhận Decision Log D22–D24 — trong cùng PR đóng M3.

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** → **US1 (P3)** → **US2 (P4)** → **US3 (P5)** → **Polish (P6)**.
- **Foundational chặn tất cả**: T003–T005 (migration + RLS + test RLS) xong trước mọi US — đây là nền + gate bảo mật.
- **US1 độc lập** (MVP) — chỉ phụ thuộc Foundational.
- **US2 phụ thuộc US1** (cần lớp + membership) + answer-keys (T019).
- **US3 phụ thuộc US2** (cần bài nộp để ghi đè/phân tích).
- Trong mỗi US: **Tests (RED) trước Implementation (GREEN)** (Constitution III).

## Parallel Opportunities

- **US1 tests**: T006 song song với việc dựng lib I/O.
- **US2 tests**: T016, T017 song song (khác file).
- **US3 tests**: T026 độc lập.
- **Polish**: T033–T038 phần lớn song song.

## Implementation Strategy

**MVP-first**: làm trọn **Setup → Foundational → US1**, dừng ở **Checkpoint US1** để nghiệm thu (GV + lớp +
roster + RLS cô lập đã là giá trị lõi vai trò GV). Sau đó US2 (giao bài + chấm chính thức) rồi US3 (audit +
phân tích). Mỗi US một PR, repo luôn chạy được + CI xanh. **Mỗi PR giữ regression M1/M2 xanh** (FR-021).
