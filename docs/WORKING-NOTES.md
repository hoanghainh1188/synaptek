# WORKING NOTES — điểm tiếp tục

> Đọc file này đầu mỗi phiên để biết đang ở đâu; cập nhật trước khi dừng.

## Đang ở đâu (cập nhật mới nhất)

**+ Tóm tắt tuần cho GV ✅ vừa xong** (`feature/gv-weekly`, PR đang mở): màn lớp GV thêm card "📅 Tuần này" (lượt nộp · đúng TB · HS làm bài, 7 ngày). useClassWeekly (RLS owns_class) + class-weekly.ts thuần (+2 test CI). e2e class-join +assert PASS. Không migration.

**+ Insight GV (báo cáo) ✅ vừa xong** (`feature/gv-report-insights`, PR đang mở): màn Báo cáo lớp thêm "⚠️ Cần chú ý" (HS điểm thấp/bỏ nhiều bài) + "📈 Xu hướng điểm TB lớp" (sparkline) — tái dùng useClassReport, KHÔNG truy vấn/migration mới. report-insights.ts thuần (atRiskStudents + classTrend, +4 test CI). e2e teacher-report +assert PASS.

**+ Engine moat đợt 2 ✅ vừa xong** (`feature/engine-moat2`, PR đang mở): ĐƠN VỊ ĐO ("5 cm"="5cm", "1 m"="100 cm", "1 kg"="1000 g" cùng đại lượng), SỐ LA MÃ ("IV"=4 chuẩn), chẩn đoán TRANSPOSED (đảo chữ số 12↔21), options.roundTo (làm tròn N chữ số). +9 unit test (44 tổng). Wiring: Question.options.roundTo + answer-keys sync + Edge + Feedback hint. Không migration.

**+ Mở rộng engine chấm (moat) ✅ vừa xong** (`feature/engine-moat`, PR đang mở): HỖN SỐ ("1 1/2"=3/2), PHẦN TRĂM ("50%"=0,5), chẩn đoán OFFBYONE (lệch 1 đơn vị), TẬP KHÔNG THỨ TỰ cho fill-blank (options.unordered, khớp đa tập). +12 unit test engine. Wiring: Question.options.unordered + answer-keys sync + Edge truyền options + Feedback hint. Không migration.

**+ Avatar mở khoá theo XP ✅ vừa xong** (`feature/avatar-unlock`, PR đang mở): migration 0015 (profiles.avatar). avatars.ts thuần (catalog emoji + ngưỡng XP, +3 test CI). Picker ở Hồ sơ (khoá nếu thiếu XP) + hiện ở badge home. Dùng lại profiles_update_own. e2e avatar PASS. Decision Log D33.

**+ Màn kết quả thống nhất ✅ vừa xong** (`feature/session-result-unify`, PR đang mở): SessionRunner (luyện nhanh + ôn lại câu sai) dùng chung component SessionResult (donut % đúng + thống kê + câu cần ôn + nút Luyện lại/Về trang chủ) thay màn kết thúc đơn sơ. e2e review-mistakes chạm màn kết quả mới PASS. Không migration.

**+ Bảng xếp hạng lớp ✅ vừa xong** (`feature/class-leaderboard`, PR đang mở): RPC class_leaderboard (SECURITY DEFINER + gate is_member) — HS xem top XP bạn cùng lớp ở màn lớp tham gia, đánh dấu "(em)". gamification_state vẫn riêng tư. rls-0014 + e2e PASS. Decision Log D32.

**+ Luyện nhanh 1 chạm ✅ vừa xong** (`feature/quick-practice`, PR đang mở): nút home → phiên trộn câu từ ĐIỂM YẾU + ĐẾN HẠN (buildPath như home → buildQuickSet round-robin). Tách `SessionRunner` dùng chung review-mistakes + quick-practice (DRY). quick-set.ts thuần (+4 test CI). e2e quick-practice + review-mistakes(refactor) PASS. Không migration.

**+ Mục tiêu hằng ngày ✅ vừa xong** (`feature/daily-goal`, PR đang mở): HS home thêm vòng tiến độ "X/10 câu hôm nay" (đếm attempts theo ngày VN qua dayKeyVN) + mừng khi đạt. daily-goal.ts thuần (+4 test CI); useAttempts/AttemptLike thêm createdAt. e2e daily-goal PASS. Không migration.

**+ Ngẫu nhiên hoá pool ✅ vừa xong** (`feature/assignment-pool`, PR đang mở): migration 0013 (pool_pick_count). Hàm thuần pickForStudent trong /classroom (sync \_shared) dùng chung client+Edge, seed=assignmentId|studentId → cùng bộ con → chấm đúng. Composer: ô "số câu ngẫu nhiên/HS". pool.test (4) + e2e assignment-pool PASS; deno+grade regression PASS. Decision Log D31.

**+ Giao cho HS cụ thể ✅ vừa xong** (`feature/assignment-targets`, PR đang mở): migration 0012 (bảng assignment_targets + is_targeted + RLS assignments_select). Không target=cả lớp; có target=chỉ HS đó thấy+nộp (Edge enforce). Composer: Cả lớp/Một số HS + toggle roster. rls-0012 + e2e assignment-targets PASS. Decision Log D30.

**+ Ảnh trong câu tự soạn ✅ vừa xong** (`feature/question-images`, PR đang mở): migration 0011 (cột image_url + bucket public question-images + RLS ghi theo uid + RPC trả ảnh). Upload web (DOM input)→Storage→public URL; map vào Question.image (QuestionCard render sẵn). LƯU Ý: dùng insert KHÔNG upsert (upsert→ON CONFLICT cần UPDATE policy→42501). e2e question-image PASS (+CI). Decision Log D29.

**+ Đăng xuất ✅ + Soạn thảo nâng cao ✅ vừa xong** (`feature/authoring-advanced`, PR đang mở): composer thêm TÌM/lọc câu + đếm "đã chọn N" + XEM TRƯỚC như HS; ngân hàng câu thêm SỬA câu tự soạn (useUpdateCustomQuestion); màn lớp thêm NHÂN BẢN bài (useCloneAssignment). e2e authoring-advanced + logout PASS (vào CI e2e-auth). Không migration.

**+ Tóm tắt tuần cho PH ✅ vừa xong** (`feature/parent-weekly`, PR đang mở): card "Tuần này (7 ngày qua)" ở màn theo dõi con — luyện N câu · đúng X% · nộp Z bài. `weekly.ts` thuần (`weeklyStats`, +4 unit test CI); `useChildProgress` thêm created_at/submitted_at. e2e parent-monitor +assert card PASS. Không migration.

**+ Báo cáo lớp GV ✅ vừa xong** (`feature/teacher-report`, PR đang mở): bảng HS × bài (điểm %) + trung bình + **xuất CSV** (web). `useClassReport` (RLS owns_class) + `report-csv.ts` thuần (+2 unit test CI). Màn `(teacher)/report/[id]`; lối vào ở màn lớp. e2e teacher-report PASS. Không migration.

**+ Xem lời giải ở bài tập ✅ vừa xong** (`feature/assignment-explanation`, PR đang mở): sau khi nộp, mỗi câu hiện ✓/✗ + **đáp án + lời giải** (câu content — sẵn client; câu tự soạn vẫn ẩn lời giải, D4). e2e assignment-grade +assert "Lời giải" PASS. Không migration (chỉ UI).

**+ Authoring đủ 6/6 loại ✅ vừa xong** (`feature/authoring-fillblank`, PR đang mở): migration `0010` thêm `fill-blank`; đáp án nhiều ô lưu JSON, Edge parse; AnswerInput đếm ô từ dấu `__` trong prompt (chạy cả content + custom). e2e custom-question (mcq+true-false+fill-blank) PASS. → câu tự soạn ĐỦ 6 loại engine hỗ trợ.

**+ Authoring 5/6 loại ✅ vừa xong** (`feature/authoring-types`, PR đang mở): migration `0009` nới `custom_questions.type` thêm `true-false` + `expression` (engine/AnswerInput đã hỗ trợ; Edge chấm generic — không đổi). UI soạn: toggle Đúng/Sai + ô biểu thức. e2e custom-question (mcq + true-false) PASS. **fill-blank ĐỂ PR RIÊNG** (cần lưu đáp án mảng + đếm ô từ prompt + UI N đáp án).

**+ UX & HS xem lớp ✅ vừa xong**: (A) đổi vai trò có xác nhận · nút Back dùng chung · avatar→Hồ sơ (PR #31). (B) "Lớp của tôi" cho HS — migration `0008` (`is_my_teacher` + `class_member_count`, RLS đọc tên GV + sĩ số) + màn `my-classes`/`my-class/[id]` (tên lớp/GV/sĩ số/bài/trạng thái nộp). RLS 0008 3 nhóm PASS; e2e `student-class-view` PASS.

**+ Phản hồi lỗi thông minh ✅ vừa xong** trên `feature/error-diagnosis` (PR đang mở): engine thêm
`diagnosis?` (sign/magnitude10/reciprocal/rounding) — **phụ trợ, KHÔNG đổi isCorrect/score** (không
regression). Feedback hiện gợi ý "vì sao sai". Engine **26 test** (+7 chẩn đoán); session record mang
diagnosis; `_shared` đồng bộ; deno 5/5. Logic moat unit-test đủ; UI mapping typed.

**+ Ôn lại câu sai ✅ vừa xong** trên `feature/review-mistakes` (PR đang mở): HS làm lại câu mà lần gần nhất
còn sai → làm đúng thì tự loại (đóng vòng "khắc phục điểm yếu"). Pure `lib/mistakes.ts` (`wrongQuestionIds`,
+6 unit test vào CI) · màn `app/review-mistakes.tsx` (tái dùng session reducer + components + lưu attempt) ·
lối vào trang chủ HS (hiện khi `wrongCount>0`). e2e `review-mistakes` (sai→ôn→đúng→tự loại) PASS. npm test 153.

**Mốc:** M0–M3 ✅ đóng + giới hạn nộp bài (D25) + **100 câu nội dung** (lớp 1–4, mỗi skill ≥10) + sprint
hoàn thiện (GV sửa/xoá bài · đổi vai trò · jwt 1 tuần) + **deploy hosted AUTO** (web Vercel + backend Action).
**M4 — Phụ huynh ✅ đóng** (PR #22) + **Giao bài tại nhà ✅** (PR #23, D27, migration `0006`).
**+ Câu hỏi tự soạn (authoring) ✅ vừa xong** trên `feature/custom-questions` (PR đang mở): migration `0007`
(`custom_questions` mcq/numeric/fraction; RLS tác giả-toàn-quyền + hàm `custom_questions_for_student` ẩn
đáp án; chấm server-side lấy `correct` qua service_role — **D28**); **RLS 0007 5 nhóm PASS**; e2e
`custom-question` (GV soạn → giao → HS làm → chấm 100%) PASS. Bug đã bắt: thiếu `grant select … to service_role`.
→ **đủ 3 vai trò + PH giao bài + GV/PH tự soạn câu**. Decision Log **D26/D27/D28**.

**+ Nội dung lớp 5 ✅ vừa xong** trên `content/grade5` (PR đang mở): curriculum `grade-5.json` (6 skill: số
thập phân concept/addsub/muldiv · tỉ số phần trăm · diện tích tam giác-hình thang · thể tích HHCN) + 60 câu
(mỗi skill 10). Tổng **160 câu, 16 skill, lớp 1–5** — phủ trọn Tiểu học. Số thập phân dùng phẩy VN (D8),
smoke-test 160/160 tự-chấm-đúng. GRADE_FILTERS thêm 5. → **M4 ĐÓNG** (đủ 3 vai trò + phủ nội dung).

**M5.0 — chuẩn bị native ✅** (PR #26, `chore/m5-prep`): `app.json` (bundleId/package `com.synaptek.app`

- plugin `expo-notifications` + supportsTablet) · `eas.json` (dev/preview/production) · `docs/M5-NATIVE.md`
  (hướng dẫn EAS). **ĐIỂM TIẾP TỤC M5.1**: cần **bạn** tạo EAS account → `eas login` → `eas init` (ghi
  `extra.eas.projectId` vào app.json) → `eas build -p android --profile preview` (APK test). Tôi headless
  KHÔNG đăng nhập EAS được. Sau đó: push thật (cron review-scheduler đã có ở `supabase/README.md` + projectId),
  offline (TanStack persist — làm khi có device kiểm), iOS (Apple $99/năm), nộp store. Chi tiết: `docs/M5-NATIVE.md`.

**M4 chi tiết:** migration `0005` (`parent_links` + `profiles.parent_link_code` + helper `is_parent_of`/
`is_linked_parent` + RPC `link_parent_by_code`); RLS đọc chéo PH→con **chỉ SELECT** (read-only) — **RLS test
0005 5 nhóm PASS live** (cô lập/read-only/chống tự-liên-kết/hiển thị/đọc tên PH). App: `lib/supabase/parent.ts`,
route `(parent)/children` + `child/[id]`, profile HS có "Mã liên kết phụ huynh", trang chủ phân biệt PH.
Tái dùng `@synaptek/classroom` (mã) + `@synaptek/learning-path` (điểm yếu) — KHÔNG package/Edge mới.
E2E `parent-monitor.spec.ts` live PASS. Regression: engine 19 · RLS 0003 PASS · 152 unit · 11 e2e.

**🚀 DEPLOY HOSTED — LIVE + AUTO** (đã làm xong, ngoài kế hoạch milestone):

- **Web**: https://synaptek-hoanghainh.vercel.app — Vercel auto-deploy từ `develop` (vercel.json gốc +
  rootDirectory=root + env trên Vercel). PR → preview.
- **Backend**: Supabase `uolyirkydjgtmuogjtfr` — DB 0001–0004 + 3 Edge Functions + auth auto-confirm.
  Auto-deploy qua GitHub Action `deploy-supabase.yml` (baseline → db push → functions deploy), secrets ở
  GitHub. Edge import dùng `npm:@supabase/supabase-js` (jsr lỗi 403 khi bundle).
- **Hoãn M5**: cron `review-scheduler` + EAS projectId (push chỉ có giá trị khi có app native). Chi tiết: `docs/DEPLOYMENT.md`.

> Chạy local: `supabase start` (0001+0002+0003) + `supabase functions serve` (cho `grade-assignment`) →
> `npm run web -w @synaptek/app`. GV: đăng ký vai trò GV → tạo lớp → giao bài → chấm/ghi đè. HS: vào lớp
> bằng mã → làm/nộp bài (chấm server-side, ẩn đáp án). Bộ test RLS: `supabase/tests/rls-0003.sql` (9 ca).

**M3 — Giáo viên (39/39 task ✅):**

- ✅ **Foundational** (migration `0003` + RLS chéo vai trò): `classes`/`class_members`/`assignments`/
  `submissions`; helper `SECURITY DEFINER` `owns_class`/`is_member`/`teaches_student`; RPC
  `join_class_by_code`; policy GV đọc profile+skill_mastery HS mình dạy. **Bộ test RLS 9 ca PASS (live)**.
  `profiles.role` đã có ở 0001 (D22). Bug bắt được & sửa: (1) table-level UPDATE che revoke cấp cột →
  HS không ghi submissions trực tiếp; (2) profiles/skill_mastery RLS chặn GV đọc tên/mastery HS → policy `teaches_student`.
- ✅ **`@synaptek/classroom`** (TS thuần, **19 test, cov 100%/98% nhánh**): `invite` (Crockford base32) ·
  `grading-policy` (hạn nộp/điểm hợp lệ/display/aggregate) · `analytics` (assignmentProgress/classWeakSkills).
- ✅ **US1** (lớp+mã+tham gia): role.ts/classes.ts; route GV `(teacher)/classes`+`class/[id]`; HS `join`.
  E2E `class-join` live PASS.
- ✅ **US2** (giao bài + chấm chính thức): Edge `grade-assignment` (dùng engine + answer-keys tự sinh từ
  content/, **ẩn đáp án D4**, Deno test 5 ca); `assignments.ts`/`submissions.ts`; route GV soạn bài, HS
  làm/nộp. E2E `assignment-grade` live PASS (Điểm 100%).
- ✅ **US3** (ghi đè + phân tích): override điểm/nhận xét (audit giữ auto); `class/[id]` "Điểm yếu của lớp"
  (classWeakSkills từ skill_mastery HS); HS thấy điểm cuối + nhận xét. E2E `override-analytics` live PASS (100%→70%).
- ✅ **Polish**: cov ≥80% ✅; `_shared` (gồm `answer-keys.ts`) vào `.prettierignore` (gate=git diff sync);
  Deno test (scheduler+grade-assignment) vào CI; prettier pin 3.8.4; format/regression/web build xanh.

> **CI fix dọc đường (đã ghi):** prettier 3.9.0 mới phát hành reformat file cũ → **pin 3.8.4**; artifact
> tự sinh `answer-keys.ts` bị husky reformat lệch generator → **`_shared/` vào `.prettierignore`**.

**US3 — Spaced repetition + cron + push (T040–T050 ✅):**

- ✅ `@synaptek/learning-path/src/schedule.ts`: `nextDueAt` (SM-2 rút gọn — interval theo repetition ×
  hệ số mastery [0.5,1.5], tối thiểu 1 ngày, tất định). **+6 test** → learning-path **56 test**.
- ✅ `scripts/sync-edge-engine.mjs` mở rộng: đồng bộ `schedule.ts`+`time.ts` → `_shared/learning-path/`
  (+ `index.ts` re-export). `deno.json` thêm import map `@synaptek/learning-path` + `@supabase/supabase-js`.
- ✅ Edge Function `supabase/functions/review-scheduler/index.ts` (service-role; đọc `skill_mastery.due_at
≤ now` theo HS → upsert `review_reminders` ON CONFLICT DO NOTHING → Expo push best-effort). Tách
  `runScheduler(client, now, push)` thuần để test; `Deno.serve` guard `import.meta.main`. **Verify LIVE**
  (local supabase): 401 khi thiếu service-role; chạy 2× cùng due_date → `created:1` rồi `created:0`, đúng
  **1** dòng `review_reminders`, `pushed:0` khi không token (SC-006 ✓). Bug đã bắt: 0001 chỉ grant bảng
  cho `authenticated` → **0002 thêm grant `service_role`** trên skill_mastery/push_tokens/review_reminders.
- ✅ Test idempotency Deno `review-scheduler/index.test.ts` (fake client, 3 ca SC-006) — xanh; **thêm step
  Setup Deno + `deno test` vào CI**.
- ✅ App: `practice/[topicId].tsx` ghi `due_at`/`last_reviewed` bằng `nextDueAt` (T045); home "đến hạn ôn"
  đã ưu tiên sẵn từ US1 (buildPath due/next) — nay có dữ liệu due_at; `lib/notifications.ts` (registerForPush
  best-effort, native-only, guard web/simulator/no-EAS) + `lib/supabase/push.ts` (save token + toggle FR-019);
  profile thêm khối "Nhắc ôn tập" (bật/tắt). Cài `expo-notifications ~56.0.18`.
- ✅ SC-007 (in-app due không cần push) kiểm TẤT ĐỊNH ở `lib/path.test.ts`. E2E `due-reminder.spec.ts` là
  **auth-gated** (`test.skip`, cần Supabase + seed) — không vào CI, như `auth-progress`.
- ✅ `npm test` toàn repo xanh; `sync:edge` không lệch; `validate:content` xanh; **expo export web 12 routes**;
  `deno check` review-scheduler sạch; guest e2e 8/8.

> **Cron deploy (hosted)**: lên lịch bằng Supabase Cron (pg_cron + pg_net) gọi function với service-role
> key từ Vault — **không commit key**. Snippet + hướng dẫn ở `supabase/README.md`. Chưa chạy trên project
> hosted (chưa link). expo-notifications: chưa có **EAS projectId** → push token trả null (best-effort, OK).

**US2 — Gamification (T028–T039 ✅ + T052 badges-gate):**

- ✅ `@synaptek/learning-path/src/gamification.ts`: `difficultyOf` (field→fallback theo loại),
  `xpForAttempt` (base 10 × {1:1,2:1.5,3:2}, sai=0), `updateStreak` (mốc ngày VN, không +2/ngày, reset khi
  cách ngày, cập nhật longest), `evaluateBadges` (mở 1 lần), `validateBadge(s)` (gate D6). **+25 test**
  (17 gamification + 8 badges-schema) → learning-path **50 test**.
- ✅ `validate:content` + manifest sinh nội dung nay gồm `badges.json` (`BADGES` bundle vào app).
- ✅ App: `lib/gamification.ts` thuần (`summarizeSession`, `masteredTopicsOf`, `xpForSession`; **+6 test**);
  `lib/supabase/gamification.ts` (đọc/upsert `gamification_state`+`student_badges`, guest no-op, huy hiệu
  idempotent); nối vào `practice/[topicId].tsx` lúc kết thúc phiên (chỉ ghi gamification khi state server
  đã tải — tránh ghi đè total_xp về 0).
- ✅ UI: `app/result.tsx` (XP nhận + tổng XP + `Celebrate`), `app/index.tsx` (chip XP/streak → `/profile`),
  `app/profile.tsx` (XP/streak/kỷ lục + `BadgeGrid` mờ-khóa kèm điều kiện), `components/gamification/*`
  (`Celebrate` transform/opacity tôn trọng reduced-motion qua hook `use-reduced-motion`).
- ✅ E2E `tests/e2e/streak-xp.spec.ts` (guest: hồ sơ + result XP/huy hiệu) — **xanh**; thêm `diagnostic-path`
  - `streak-xp` vào CI guest e2e. **expo export web xanh** (12 routes, có `/profile`). `format:check` sạch.
- ⚠️ `correctCount` cho huy hiệu suy từ `attempts` server lúc kết thúc — có thể trễ vài câu sát ngưỡng
  (đánh giá lại mỗi phiên nên hội tụ). `auth-progress.spec.ts` lỗi strict-mode 2×"Tiến độ" — **pre-existing**
  (lỗi cả trên `develop` sạch; do hydration Expo static-render; không thuộc CI).

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

1. **Merge PR `feature/m2-polish`** → `develop` (CI xanh) → **đóng M2**.
2. **M3 — Giáo viên** (`specs/003-*`, chưa tạo): tạo lớp + mã mời; soạn/giao bài; chấm chính thức
   server-side + ghi đè thủ công + nhận xét; phân tích lớp; **RLS chéo vai trò đầy đủ**. Bắt đầu bằng
   Spec Kit `specify`. (Edge Function `grade` hiện dùng stub đáp án — M3 đọc `content/questions` phía server.)
3. **Deploy hosted M2** (khi sẵn sàng, không chặn M3): `supabase link` → `db push` →
   `functions deploy grade review-scheduler` + lên lịch cron (Vault key); cấu hình **EAS projectId** cho push.
4. **Verify iOS sim** khi có Mac simulator (web đã pass).
5. **Dọn nhánh**: xóa `feature/m2-mastery-path` (đã merge).

## Nợ kỹ thuật / để ý sau

- `correctCount` (huy hiệu) suy từ `attempts` server lúc kết thúc phiên → có thể trễ vài câu sát ngưỡng;
  đánh giá lại mỗi phiên nên hội tụ. Cân nhắc đếm chính xác nếu cần.
- `auth-progress.spec.ts`: strict-mode 2×"Tiến độ" — pre-existing (hydration Expo static-render), không CI.
- Push token trả null tới khi có **EAS projectId**; cron chưa lên lịch trên hosted (best-effort, đã tài liệu).

> **Định hướng tương lai (chủ repo nêu):** sẽ còn cải tiến tiếp. Ý tưởng để ngỏ: tinh chỉnh tham số BKT
> bằng dữ liệu thật; heatmap dạng lỗi chi tiết hơn; populate heatmap demo (cần login). Ghi lại khi rõ.

## Ghi chú / quyết định mở

- **Lớp khởi đầu M1**: ✅ chốt **lớp 4** + cho ôn lớp 1–3 (D15).
- **Auth M1**: ✅ chốt **tối thiểu** (Supabase email/mật khẩu) (D16).
- **Nguồn nội dung & bản quyền** (rủi ro #1): câu hỏi bám CT GDPT 2018 nhưng KHÔNG chép nguyên văn SGK
  → biên soạn **thủ công JSON + import** (D14), luồng riêng, cần quy trình review.
- **Tên `synaptek`**: kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.
