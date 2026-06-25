# Tasks: M1 — Vòng luyện tập học sinh

**Feature**: `001-m1-practice-loop` | **Branch**: `feature/m1-practice-loop`
**Input**: `plan.md` · `spec.md` · `research.md` · `data-model.md` · `contracts/content-schema.md` · `quickstart.md`
**Tests**: CÓ (Constitution III — test-first / TDD).

## Format: `[ID] [P?] [Story] Mô tả + đường dẫn`

- **[P]** = chạy song song được (file khác nhau, không phụ thuộc task chưa xong).
- **[US1/US2/US3]** = thuộc user story (chỉ ở phase user story).

## Path Conventions

Monorepo: `packages/curriculum/` (TS thuần) · `apps/app/{lib,components,src/app,theme,tests}` ·
`content/{curriculum,questions}` · Vitest = `*.test.ts`, Playwright = `*.spec.ts`.

---

## Phase 1: Setup (hạ tầng dùng chung)

- [x] T001 Tạo scaffold package `@synaptek/curriculum` (zero-dep, raw `.ts`, `type: module`, `main: src/index.ts`, script test `node --experimental-strip-types`) trong `packages/curriculum/package.json` + `packages/curriculum/README.md`
- [x] T002 Thêm deps M1 vào `apps/app/package.json` (`nativewind`, `tailwindcss`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `@tanstack/react-query`; dev: `@testing-library/react-native`, `vitest`) và chạy `npm install` từ root
- [x] T003 [P] Cấu hình NativeWind v4: `apps/app/tailwind.config.js`, cập nhật `apps/app/metro.config.js` + `babel.config.js` + `apps/app/src/global.css`
- [x] T004 [P] Tạo design tokens trong `apps/app/theme/tokens.ts` (màu theo mạch: Số=xanh dương, Hình học=cam, Đo lường=xanh lá; spacing, typography, duration, easing) — map sang tailwind theme
- [ ] T005 [P] Cấu hình Vitest cho `apps/app` (`apps/app/vitest.config.ts`, alias `@`, inline `@synaptek/*`, **môi trường + preset `@testing-library/react-native` / jsdom cho component test**) và `packages/curriculum`

**Checkpoint**: `npm install` xanh; `npm run web` mở được; tokens + NativeWind áp dụng.

---

## Phase 2: Foundational (chặn — phải xong trước mọi user story)

- [x] T006 [P] Định nghĩa types nội dung trong `packages/curriculum/src/types.ts` (Grade/Strand/Topic/Skill/Question + re-export QuestionType từ `@synaptek/grading-engine`)
- [x] T007 [P] **(TDD)** Viết test trước cho validate + traversal + buildSession trong `packages/curriculum/tests/curriculum.test.ts` (dùng fixture nhỏ; kỳ vọng FAIL)
- [x] T008 Implement `validateCurriculum()` + `validateQuestion()` trong `packages/curriculum/src/schema.ts` (id duy nhất, ref tồn tại, mcq⇒choices, fill-blank⇒mảng, DAG không chu trình) — theo `contracts/content-schema.md` (depends T006, T007)
- [x] T009 Implement `topicsByGrade()`, `questionsByTopic()`, `buildSession(topicId, {count})` trong `packages/curriculum/src/select.ts` + `src/index.ts` re-export (depends T006, T007) → T007 chuyển GREEN
- [x] T010 [P] Tạo content **seed tối thiểu** để chạy E2E: `content/curriculum/grade-4.json` (3 chủ đề + skills) + `content/questions/g4.num.fractions.json` (~8–10 câu đủ loại) — đúng schema
- [x] T011 [P] Supabase client + auth helper trong `apps/app/lib/supabase/client.ts` + `auth.ts` (đọc `EXPO_PUBLIC_SUPABASE_*`, storage = SecureStore/AsyncStorage, `persistSession`)
- [x] T012 [P] Provider TanStack Query + bọc root trong `apps/app/src/app/_layout.tsx`
- [x] T013 Content loader `apps/app/lib/content.ts` (import bundle + `validate*()` qua `@synaptek/curriculum`; export `loadTopics()`, `loadQuestions(topicId)`) (depends T008, T009, T010)

**Checkpoint**: `npm test` (engine + curriculum) xanh; content seed validate sạch; app boot có provider.

---

## Phase 3: User Story 1 — Luyện tập + chấm tức thì (P1) 🎯 MVP

**Mục tiêu**: Chọn chủ đề → làm → chấm tức thì + giải thích → kết quả phiên. **KHÔNG cần đăng nhập.**
**Independent test**: chạy web, làm trọn 1 phiên, kiểm chấm tương đương (`2/4`≡`1/2`, `0,5`≡`0.5`, `2(a+2)`≡`2a+4`), xem kết quả.

### Tests (TDD — viết trước)

- [x] T014 [P] [US1] Test session reducer trong `apps/app/lib/session.test.ts` (start→answer(gọi grade)→next→finish; bỏ trống→empty; tính SessionResult)
- [~] T015 [P] [US1] Render math: **phủ qua e2e** (render thật trong chromium) + unit test `math-markup` (parse phân số/mũ). RNTL snapshot HOÃN (tooling react-test-renderer chưa ổn trên React 19).
- [x] T016 [P] [US1] E2E luồng luyện tập trong `apps/app/tests/e2e/practice.spec.ts` (chọn chủ đề → trả lời tương đương → Đúng tức thì → kết quả; **assert phản hồi chấm < 200ms — SC-004**)

### Implementation

- [x] T017 [US1] Session reducer thuần `apps/app/lib/session.ts` (dùng `grade()` từ `@synaptek/grading-engine`) → T014 GREEN (depends T013)
- [x] T018 [P] [US1] `apps/app/components/math/FractionView.tsx` + `ExpressionView.tsx` (tự vẽ, universal) → T015 GREEN
- [x] T019 [P] [US1] Parser markup Toán nhẹ (`[[frac:a/b]]`, `^`) trong `apps/app/lib/math-markup.ts` (+ test `math-markup.test.ts`)
- [x] T020 [P] [US1] `apps/app/components/practice/AnswerInput.tsx` (bàn phím số tùy biến + `/`,`,`; MCQ nút; fill-blank nhiều ô)
- [x] T021 [P] [US1] `apps/app/components/practice/QuestionCard.tsx` (hiển thị prompt qua math render + AnswerInput theo type)
- [x] T022 [P] [US1] `apps/app/components/practice/Feedback.tsx` (đúng/sai + giải thích, animation transform/opacity)
- [x] T023 [P] [US1] `apps/app/components/practice/SessionResult.tsx` (đúng/tổng, điểm, danh sách câu sai)
- [x] T024 [US1] Màn chọn chủ đề `apps/app/src/app/(student)/index.tsx` (liệt kê topic lớp 4 từ content loader; **empty state** khi chủ đề chưa có câu hỏi)
- [x] T025 [US1] Route phiên `apps/app/src/app/(student)/practice/[topicId].tsx` (useReducer(session) + QuestionCard + Feedback) (depends T017–T022)
- [x] T026 [US1] Route kết quả `apps/app/src/app/(student)/result.tsx` (SessionResult) (depends T023)

**Checkpoint**: US1 demo độc lập — luyện tập + chấm tức thì chạy trên web không cần auth. (Xoá route demo `grading-demo.tsx` hoặc giữ làm dev.)

---

## Phase 4: User Story 2 — Auth + lưu tiến độ (P2)

**Mục tiêu**: đăng nhập email/mật khẩu; attempts + tiến độ lưu & khôi phục qua phiên/thiết bị.
**Independent test**: đăng nhập → làm vài câu → đăng nhập lại → tiến độ hiển thị đúng (cần `supabase start`).

### Tests (TDD)

- [x] T027 [P] [US2] Test gộp tiến độ trong `apps/app/lib/progress.test.ts` (attempts → TopicProgress: attempted/correct theo chủ đề)
- [x] T028 [P] [US2] E2E auth + persistence trong `apps/app/tests/e2e/auth-progress.spec.ts` (đăng ký → làm → đăng nhập lại → tiến độ)

### Implementation

- [x] T029 [P] [US2] `apps/app/lib/progress.ts` (gộp attempts → TopicProgress, map question→topic qua curriculum) → T027 GREEN
- [x] T030 [P] [US2] `apps/app/lib/supabase/attempts.ts` (insert attempt + query attempts theo HS; hook TanStack `useSaveAttempt`, `useAttempts`)
- [x] T031 [US2] Màn đăng nhập/đăng ký `apps/app/src/app/(auth)/login.tsx` + `apps/app/components/auth/AuthForm.tsx` (depends T011)
- [x] T032 [US2] Nối lưu attempt vào phiên: khi đã đăng nhập, `answer()` → `useSaveAttempt` (optimistic) trong `practice/[topicId].tsx` (depends T030, T025)
- [x] T033 [US2] Màn tiến độ `apps/app/src/app/(student)/progress.tsx` (TopicProgress qua `useAttempts` + progress.ts) (depends T029, T030)
- [x] T034 [US2] Guest mode + nhắc đăng nhập để lưu; **hàng đợi attempt offline** (cả guest lẫn HS đã đăng nhập): lưu tạm khi mất mạng, **flush khi online / khi đăng nhập** (trong `lib/supabase/attempts.ts` + practice route)

**Checkpoint**: US2 demo — đăng nhập, tiến độ bền vững (SC-003). Kiểm RLS qua Studio.

---

## Phase 5: User Story 3 — Ôn lớp dưới (P3)

**Mục tiêu**: chọn & luyện chủ đề lớp 1–3 bên cạnh lớp 4.
**Independent test**: lọc lớp 1–3 → luyện một chủ đề lớp dưới trọn vẹn.

### Tests (TDD)

- [x] T035 [P] [US3] E2E lọc theo lớp trong `apps/app/tests/e2e/review-lower-grade.spec.ts`

### Implementation

- [x] T036 [P] [US3] Seed content lớp 1–3 rút gọn: `content/curriculum/grade-1.json`..`grade-3.json` + 1–2 file câu hỏi (vd bảng nhân)
- [x] T037 [US3] Bộ lọc lớp trong màn chọn chủ đề `apps/app/src/app/(student)/index.tsx` (chip chọn lớp 1–4, dùng `topicsByGrade`) (depends T024)

**Checkpoint**: US3 demo — chọn & luyện nội dung đa lớp.

---

## Phase 6: Polish & Cross-Cutting

- [x] T038 [P] Accessibility: vùng chạm ≥44pt, `reduced-motion`, tương phản — rà `components/**`
- [x] T039 [P] Responsive: screenshot 320/768/1024/1440 (Playwright) cho màn chính
- [ ] T040 Bổ sung ngân hàng câu hỏi đạt **~120 câu lớp 4 (3 chủ đề)** từ **content pipeline** (D14) — `content/questions/*.json`, qua `validateQuestion()` (SC-005)
- [x] T041 Nối e2e vào CI: thêm bước `npm run e2e --workspace @synaptek/app` vào `.github/workflows/ci.yml` (Playwright chromium)
- [x] T042 Cập nhật `docs/WORKING-NOTES.md` + roadmap (M1 done) + Decision Log nếu phát sinh; `quickstart.md` nghiệm thu
- [ ] T043 Mở PR `feature/m1-practice-loop` → `develop`, CI xanh

---

## Dependencies (thứ tự hoàn thành story)

- **Setup (P1) → Foundational (P2)** chặn tất cả.
- **US1 (P3)** chỉ phụ thuộc Foundational → là **MVP**, demo độc lập.
- **US2 (P4)** phụ thuộc Foundational (auth/attempts) + tái dùng phiên của US1; demo độc lập sau US1.
- **US3 (P5)** phụ thuộc màn chọn chủ đề (US1 T024); nhẹ.
- **Polish (P6)** sau khi các story xong.

## Song song (ví dụ)

- Phase 1: T003, T004, T005 song song.
- Phase 2: T006/T007 trước; rồi T010, T011, T012 song song; T013 sau T008/T009.
- US1: T014/T015/T016 (tests) song song; rồi T018–T023 (component) song song; T024–T026 (route) sau.

## Implementation Strategy (MVP-first)

1. **MVP = Setup + Foundational + US1** → có vòng luyện tập + chấm tức thì chạy được (không auth). Ship/demo.
2. Thêm **US2** (auth + tiến độ) → hành trình có theo dõi.
3. Thêm **US3** (ôn lớp dưới) + **Polish** → đóng M1.
4. **Content pipeline (song song)** cấp dần câu hỏi tới ~120 (T040) — không chặn code khung.
