# WORKING NOTES — điểm tiếp tục

> Đọc file này đầu mỗi phiên để biết đang ở đâu; cập nhật trước khi dừng.

## Đang ở đâu (cập nhật mới nhất)

**+ Fix bug thật do USER báo trực tiếp — 2 lượt fix (feature/latex-fix-css, PR đang mở, sau khi D53 đã
merge):** Screenshot user gửi: phân số "1/2" ở màn luyện tập hiện thành "21" (không gạch ngang, tử/mẫu
đảo + dính liền). Nguyên nhân gốc: `@import "katex/dist/katex.min.css"` trong `global.css` KHÔNG được
Metro resolve (CSS `@import` trỏ gói npm — khác `import` JS/TS) → KaTeX render HTML nhưng KHÔNG có
style → cấu trúc định vị CSS tuyệt đối (`.mfrac`/`.vlist`) sụp thành chữ phẳng đọc theo thứ tự DOM.

**Lượt fix #1** (`import "katex/dist/katex.min.css"` ngay trong `KatexSpan.web.tsx`) sửa đúng hiển thị
NHƯNG tự gây ra bug MỚI nặng hơn, chỉ lộ ra khi chạy CI (41+ spec liên tục): Metro dev server RÒ RỈ BỘ
NHỚ khi bundle lại CSS này qua nhiều request → `heap out of memory`, sập server giữa chừng → HÀNG LOẠT
test SAU ĐÓ fail `net::ERR_CONNECTION_REFUSED` (không phải lỗi test logic). Debug bằng A/B thật:
`git checkout develop` (chưa có `import` CSS) chạy sạch 57/57; branch có `import` CSS sập ở request
~30 — xác nhận đúng nguyên nhân trước khi thử NODE_OPTIONS heap-bump (không đủ, vẫn sập) rồi mới quyết
đổi hẳn cách nạp.

**Lượt fix #2 (chốt)**: copy `katex.min.css` + fonts vào `public/katex/` (Expo Router static assets,
tự copy vào `dist/` lúc export) + nạp qua thẻ `<link>` chèn tay trong `useEffect`, KHÔNG qua Metro
module graph nữa (tách hẳn khỏi cả `@import` CSS lẫn `import` JS). Verify lại toàn bộ 59 spec local
(`CI=true npx playwright test`, mô phỏng đúng điều kiện CI) — sạch, không OOM.

**Bài học**: unit test + e2e ban đầu (chỉ đếm số phần tử `.katex`) ĐỀU XANH dù bug hiển thị tồn tại —
đếm elements không đủ, DOM vẫn có `.katex` hợp lệ chỉ THIẾU CSS. Viết lại test: verify
`document.styleSheets` thật sự chứa rule `.katex` (poll vì `<link>` nạp bất đồng bộ) + thứ tự tử/mẫu
qua MathML (`<mfrac>` con — không phụ thuộc CSS, nên cũng đổi `katex.renderToString` sang output mặc
định `htmlAndMathml`, kèm lợi ích accessibility). Đã tự verify test mới THẬT SỰ bắt được bug bằng cách
tạm revert fix rồi chạy lại (fail đúng như kỳ vọng), sau đó khôi phục fix (pass). Decision Log D53
(cập nhật 2 lần).

**+ Tự động hoá đồng bộ vendor assets KaTeX (cùng nhánh, theo yêu cầu user "đối với cấu trúc lưu trữ
có cần sửa gì không"):** `public/katex/` ban đầu copy TAY từ `node_modules/katex/dist` — dễ quên cập
nhật khi nâng cấp `katex`. Thêm `scripts/sync-katex-assets.mjs` (`npm run sync:katex`) + gate CI
`git diff` chống lệch, đúng pattern `sync:edge` đã có cho code TỰ SINH (D13). Loại `public/katex/`
khỏi prettier (`.prettierignore`) — nếu không, prettier tự format lại CSS minified thành nhiều dòng,
lệch với bản gốc script sinh ra mỗi lần chạy (bắt được lúc `git diff --exit-code` fail ngay sau khi
thêm script, trước khi thêm `.prettierignore`).

**+ LaTeX render thật qua KaTeX ✅ (feature/latex-katex, đã merge #80):** Trong 4 việc "cần quyết
định phạm vi sản phẩm lớn hơn" (THCS/THPT sâu hơn · môn mới Lý/Hóa/Anh · LaTeX thật · gia sư AI mở
rộng), user chọn làm LaTeX trước — **duy nhất không phụ thuộc nội dung/chuyên môn sư phạm hay quyết
định an toàn sản phẩm**. `MathText.web.tsx` mới (pattern platform-split `.web.tsx` có sẵn trong repo) —
segment `frac`/`sup` (từ `parseMathMarkup`) render qua KaTeX thật thay vì FractionView/mũ-unicode tự
chế. CHỈ nâng hiển thị — cú pháp lưu DB/bàn phím toán/engine chấm giữ nguyên (hàm thuần
`segmentToLatex` mới, có unit test). Native giữ nguyên renderer cũ (KaTeX là DOM-only). E2E
`latex-render.spec.ts` verify tích hợp thật (đếm `.katex` element sau khi soạn+lưu câu có
phân số/lũy thừa). Decision Log **D53**.

**Phát hiện đáng nhớ lúc build**: đo bundle THẬT (qua `git stash` so sánh trước/sau) cho thấy KaTeX
thêm ~76KB gzip JS — cao hơn ước tính ban đầu (~15-30KB) đưa ra lúc hỏi ý kiến user. Đồng thời phát
hiện baseline TOÀN BỘ app (1 bundle Metro duy nhất, chưa code-split theo route) đã ~702KB gzip TRƯỚC
khi thêm KaTeX — vượt xa ngân sách nêu trong quy tắc hiệu năng chung, nhưng vì lý do kiến trúc
KHÔNG LIÊN QUAN tới thay đổi này (Expo Router web export chưa cấu hình code-split) — ghi lại đây cho
ai muốn tối ưu bundle sau này, không phải việc cần xử lý ngay trong phạm vi D53.

**+ Đổi tên hiển thị + Đăng xuất thiết bị khác + Avatar ảnh thật + Xóa tài khoản ✅ (feature/profile-self-service,
đã merge #79):** TRỌN 4/4 việc trong nhóm "làm được ngay không phụ
thuộc gì" mà user chọn làm. `profile.ts` mới (`useMyFullName`/`useSetFullName`) update
`profiles.full_name` qua RLS có sẵn, KHÔNG cần migration. UI sửa trực tiếp trong Hồ sơ (mục "Tên hiển
thị", giống kiểu "Đổi vai trò"). `signOutOtherDevices()` dùng `signOut({scope:"others"})` — verify kỹ
qua curl trực tiếp vào GoTrue local: server 204 + refresh token phiên gọi vẫn dùng được sau đó (đúng
docs). KHÔNG có API liệt kê chi tiết từng phiên (thiết bị/vị trí) ở client — chỉ thu hồi được, nên chỉ
làm 1 nút hành động trong mục Bảo mật, không phải màn "quản lý phiên" đầy đủ. Avatar ảnh thật: cột
`profiles.avatar_photo_url` (migration 0024) + bucket Storage `avatars` (2MB, chỉ ảnh) — LỰA CHỌN THÊM
bên cạnh emoji-XP, không thay thế; tái dùng pattern upload ảnh câu hỏi (D28). Xóa tài khoản: Edge
Function mới `delete-account` (service-role bắt buộc) — soft delete (`deleteUser(uid,true)`) + cột
`profiles.deleted_at` (migration 0025); GV còn lớp có HS bị CHẶN (`blocksDeletion` thuần, unit test
riêng); UI "Vùng nguy hiểm" gõ chữ "XÓA" để xác nhận. Decision Log **D49/D50/D51/D52**.

**2 bug thật bắt được lúc build (đáng nhớ)**: (1) label mới "Đăng xuất khỏi thiết bị khác" làm
`getByLabel("Đăng xuất")` (không exact) trong 3 test cũ (logout/change-password/forgot-password) khớp
NHẦM 2 phần tử — fix `{exact:true}` cho cả 3. (2) **`service_role` KHÔNG tự có quyền đọc
`public.profiles`/`public.classes`** dù dùng để bypass RLS trong Edge Function — project này yêu cầu
GRANT tường minh từng bảng cho `service_role` (pattern đã có từ D21/0002·0003·0007, dễ quên khi thêm
bảng mới cần Edge đọc). Thiếu GRANT khiến role-check âm thầm fallback "student", bỏ qua điều kiện chặn
GV — lộ ra qua e2e chạy 2 lần liên tiếp lỗi giống hệt nhau (ban đầu tưởng nhầm là race condition/double-
click, mất khá nhiều thời gian debug bằng cách thêm log trực tiếp vào Edge Function + đọc docker logs
container `supabase_edge_runtime_synaptek` mới thấy đúng nguyên nhân — bài học: khi Edge Function dùng
`admin`/service-role đọc bảng MỚI, luôn nhớ thêm GRANT trong cùng migration).

**+ Đổi mật khẩu khi ĐÃ đăng nhập ✅ (feature/change-password, đã merge #78):** `auth.tsx` thêm
`changePassword(currentPassword, newPassword)` — xác thực lại mật khẩu hiện tại qua `signInWithPassword`
trước khi `updateUser` (chống đổi mật khẩu khi phiên bị chiếm dụng). Màn `change-password.tsx` mới, vào
từ mục "Bảo mật" ở Hồ sơ. **Chủ động chọn hướng này** (trong 3 lựa chọn: đổi mật khẩu / đổi tên hiển
thị / xóa tài khoản) vì KHÔNG phụ thuộc email/domain (đang tạm dừng vụ mua domain cho Resend) — hoạt
động đầy đủ ngay, không cần chờ `RESEND_API_KEY`. E2E `change-password.spec.ts` verify cả 2 nhánh (sai
mật khẩu hiện tại bị từ chối; đúng thì đổi + đăng nhập lại bằng mật khẩu mới thành công). Decision Log
**D48**.

**+ Quên mật khẩu ✅ (feature/forgot-password, đã merge #77):** `auth.tsx` thêm
`resetPasswordForEmail`/`updatePassword` + `recoveryMode` (theo dõi event `PASSWORD_RECOVERY`). Màn
`forgot-password.tsx` (luôn báo "đã gửi" giống nhau — chống dò email đã đăng ký) + `reset-password.tsx`
(grace-period 2.5s chờ Supabase xử lý URL bất đồng bộ trước khi báo "link không hợp lệ"). Link "Quên
mật khẩu?" mới trong `AuthForm` (chỉ mode đăng nhập); thêm `accessibilityLabel` cho nút submit (trước
đây trùng text với heading, gây ambiguous selector — fix luôn nhân tiện). SMTP dùng **Resend** (free
tier vĩnh viễn — SendGrid đã bỏ free tier 2025), cấu hình qua Management API trong
`deploy-supabase.yml`, CHỈ bật khi có secret `RESEND_API_KEY` (chưa có → mailer mặc định Supabase).
Sender tạm `onboarding@resend.dev` (sandbox — chỉ gửi được về email chủ tài khoản Resend cho tới khi
verify domain thật). `additional_redirect_urls`/`uri_allow_list` dùng wildcard `**`. E2E
`forgot-password.spec.ts` verify THẬT qua Mailpit (SMTP giả cục bộ, không cần Resend thật) — bắt được 2
bug thật lúc build: (1) race condition URL bất đồng bộ (fix bằng grace-period), (2) href email bị
HTML-entity-encode (`&amp;` cần giải mã trước khi dùng làm URL). Decision Log D47. **Còn lại để dùng
thật**: `gh secret set RESEND_API_KEY` rồi verify domain tại resend.com/domains (xem
`supabase/README.md` mục "Quên mật khẩu").

**+ Gia sư AI (MVP) ✅ (feature/ai-tutor, đã merge #74; đổi provider sang Gemini sau merge):** Edge
Function `ai-tutor-explain` gọi **Gemini API** (`gemini-2.5-flash-lite`, đổi qua secret `GEMINI_MODEL`
không cần sửa code) giải thích ngắn gọn vì sao HS SAI — **engine vẫn chấm, LLM chỉ giải thích**
(docs/future/step-grading.md). Một provider duy nhất (không thiết kế đa provider khi chưa có nhu cầu cụ
thể — `callGemini` tách riêng nên đổi/thêm provider sau vẫn nhỏ). Nút "🤖 Hỏi tại sao sai?" xuất hiện CHỈ
khi sai, trong `Feedback.tsx` (màn luyện tập). Ngữ cảnh do client gửi (không bí mật) — Edge chỉ validate
hình dạng/độ dài, không tra DB. Lỗi mềm (`not_configured`/`ai_failed`) trả HTTP 200 (không phải 503/502 —
hành vi `supabase-js` chặn đọc body khi non-2xx). **CHƯA set `GEMINI_API_KEY`** — trả lời graceful "chưa
sẵn sàng", verify qua e2e `ai-tutor.spec.ts` (không gọi API thật). +10 Deno test
(validateInput/buildUserMessage). Decision Log D46 (cập nhật). **Còn lại để dùng thật**:
`supabase secrets set GEMINI_API_KEY=...` (lấy miễn phí tại aistudio.google.com/apikey; xem
`supabase/README.md` mục "Gia sư AI").

**+ Căn bậc hai (√) ✅ (feature/sqrt-engine, đã merge #72):** engine nhận cả `√` (ký hiệu) lẫn `sqrt(...)` (chữ), tương đương nhau — toán tử một ngôi cùng precedence `neg` (`√x^2`=`√(x^2)`, `√4*2`=`(√4)*2`, nhân ngầm `2√4`=`2*√4`). Căn số âm → NaN tự lọc ở sampling (giống chia 0, D9), không throw. `numericScalar` thêm fallback `sqrtConstantValue` (chỉ khi chuỗi chứa √/sqrt) → HS gõ "√16" ở câu numeric vẫn khớp "4". Áp dụng numeric+expression (derivation thừa hưởng tự động qua `expressionsEquivalent` chung). +13 unit test engine (72 tổng). Bàn phím toán (`math-keypad.ts`) + 6 chỗ thanh chèn nhanh soạn câu đều thêm nút √ — +1 unit test math-keypad. e2e sqrt (HS gõ √16 bằng bàn phím → chấm tương đương 4) PASS. Decision Log D45.

**+ Câu nhiều phần LỒNG derivation ✅ (feature/compound-question tiếp, đã merge #71):** `COMPOUND_PART_TYPES` thêm `derivation` (trình bày từng bước làm 1 phần a/b/c). Orchestrator mới `gradeCompoundParts` sống ở `@synaptek/step-grading` (không phải grading-engine — tránh phụ thuộc ngược) — chấm phần thường qua `grade()`, phần derivation qua `gradeDerivation`, cùng lượt, điểm = trung bình. Edge `grade-assignment` chuyển compound sang dùng hàm mới (superset) — 2 Deno test thêm. `compound-parts.ts` + `CompoundPartsEditor` thêm UI soạn derivation lồng (mode/đề/đích/biến, nhãn `phần {letter}` chống trùng a11y) — 4 unit test thêm (13 tổng). e2e compound-derivation (soạn a=numeric, b=từng bước → giao → HS đúng cả 2 → 100%) PASS. Decision Log D44.

**+ Câu "nhiều phần" (a/b/c) ✅ (feature/compound-question, đã merge #70):** loại `compound` soạn/giao được — mỗi phần là 1 trong 9 loại đơn giản (không derivation/compound lồng). `choices` = mảng JSON hiển thị từng phần; `correct` = mảng JSON đáp án ẨN từng phần. Engine `gradeCompound(parts, answers)` chấm từng phần độc lập, điểm = TRUNG BÌNH các phần (isCorrect chỉ true khi mọi phần đúng) — 4 unit test. Edge `grade-assignment` thêm nhánh compound — 3 Deno test. Client: `compound-parts.ts` thuần (build/decode/valid, +10 unit test) + `CompoundPartsEditor` (soạn, nhãn theo chữ cái phần chống trùng a11y) + `CompoundInput` (làm bài, đệ quy `AnswerInput`). migration 0023. e2e compound (soạn 2 phần → giao → HS đúng 1/sai 1 → 50%) PASS. Decision Log D43.

**+ Hỗ trợ nhập toán khi SOẠN câu ✅ (feature/authoring-math-input, PR đang mở):** ô đáp án fraction/expression + đề/đích derivation thêm thanh chèn nhanh (MathInsertBar: x ^ ( ) / \*) + xem trước MathText. e2e authoring-math (GV chèn → preview → lưu) PASS. Decision Log D42. Trọn Hướng 1 (bàn phím toán: HS đáp án + GV soạn).

**+ Bàn phím toán có cấu trúc ✅ (feature/math-keypad, PR đang mở):** ô đáp án expression thêm nút ^ ( ) x + - \* (numeric/fraction giữ gọn); biểu thức hiển thị qua MathText (mũ đẹp). math-keypad.ts thuần (mathKeypadKeys/isOperatorKey, +4 test). KHÔNG đổi engine. e2e auth math-keypad (HS bấm 2(x+2) → chấm tương đương 100%) PASS. Decision Log D41.

**+ Câu "trình bày từng bước" GIAO ĐƯỢC ✅ (feature/derivation-question, PR đang mở):** loại derivation soạn/giao được, chấm CHÍNH THỨC server-side qua step-grading (Edge). migration 0022; spec ẩn trong correct (JSON), choices=[start,mode,variable] cho HS; engine QuestionType +derivation (grade() default); authoring (mode/đề/đích/biến) + AnswerInput nhập nhiều dòng (preview per-line). Decision Log D40. Deno +3 test, e2e derivation (GV soạn PT → HS nộp lời giải → 100%) PASS.

**+ Mở rộng nội dung Tiếng Việt (feature/tv-expand, PR đang mở):** thêm lớp 1 (dấu câu), LỚP 2 (từ chỉ đặc điểm · mẫu câu "Ai thế nào?"), LỚP 3 (đồng nghĩa/trái nghĩa). Tổng nội dung 205 câu (TV ~45 câu, 3 lớp). e2e subject-browse mở rộng kiểm lớp 2. Vẫn gốc bám CT, không chép SGK.

**+ Đa môn — NỀN ✅ (feature/full-subject, PR đang mở):** Grade.subject (mặc định math) + subjectsOf/topicsByGrade(subject) + bộ chọn MÔN ở home. Seed Tiếng Việt lớp 1 (2 chủ đề: từ loại, chính tả; 15 câu). Decision Log D39. Nội dung gốc bám CT GDPT, KHÔNG chép SGK — seed nhỏ, content thật cần review (D14). e2e khách subject-browse (2 ca) + curriculum +2 test. Tương thích ngược (Toán nguyên vẹn).

**+ Chấm từng bước — UI luyện tập (feature/step-practice-ui, PR đang mở):** màn /step-practice (client-only, low-stakes) — chọn bài số học nhiều bước/PT, nhập từng dòng → chấm qua @synaptek/step-grading, tô xanh/đỏ + định vị dòng sai + điểm. step-problems.ts (5 bài seed, +2 test; lời giải mẫu validate qua engine). Lối vào "Luyện trình bày từng bước" ở home. e2e GUEST step-practice (2 ca).

**+ Chấm từng bước — NỀN ✅ vừa xong** (`feature/step-grading`, PR đang mở): package thuần /step-grading (gradeDerivation) chấm lời giải nhiều dòng bằng lấy mẫu — expression (≡ giá trị) + equation (cùng tập nghiệm qua chân-trị); evalExpr mới ở grading-engine. firstErrorIndex + validSteps + reachedGoal + score. 7 unit test. Decision Log D38. CHƯA tích hợp UI/loại câu (PR sau — cần bàn phím nhập có cấu trúc).

**+ Đồng bộ tài liệu ✅ vừa xong** (`docs/sync-status`): Decision Log thêm D32–D37 (BXH·avatar·nhãn môn·loại câu multi/ordering/matching·tùy chọn chấm·gợi ý — migrations 0014–0021); CLAUDE.md Active/Recent + 02-roadmap.md "Sau M4" cập nhật đúng trạng thái (M0–M4 đóng; còn M5 + Tương lai).

**+ Câu Nối cặp (matching) ✅ vừa xong** (`feature/matching`, PR đang mở): hoàn tất bộ loại câu. Engine type "matching" (chấm theo vị trí — chung logic ordering, +3 test); migration 0021 (CHECK). matching.ts thuần (pack/unpack qua sentinel, +3 test) — choices gói trái+phải-xáo-trộn, correct=JSON phải-theo-trái (ẩn). MatchingInput (chạm xoay vòng) + authoring cặp trái–phải + Edge parse. e2e matching PASS.

**+ Gợi ý/hướng dẫn kèm câu ✅ vừa xong** (`feature/question-hint`, PR 5/5 — TRỌN nhóm soạn câu+môn): cột hint + RPC trả hint (CỐ Ý hiện khi HS làm, khác explanation ẩn — D4). curriculum Question.hint; QuestionCard render "💡 gợi ý"; authoring thêm ô Gợi ý. migration 0020. e2e question-hint PASS.

**+ Câu Sắp thứ tự (ordering) ✅ vừa xong** (`feature/ordering`, PR 4/5): engine type "ordering" (so dãy theo vị trí, +3 test); migration 0019 (CHECK). Authoring nhập mục theo đúng thứ tự → lưu correct=JSON, choices=XÁO TRỘN (chống lộ). AnswerInput OrderingInput (↑↓). Edge parse JSON. e2e ordering PASS. (Nối cặp/matching để PR sau nếu cần.)

**+ Tùy chọn chấm câu tự soạn ✅ vừa xong** (`feature/custom-options`, PR 3/5): câu tự soạn lưu options (jsonb, migration 0018) → numeric: làm tròn N chữ số + dung sai; fill-blank: KHÔNG theo thứ tự. Authoring UI + Edge truyền options vào engine (engine đã hỗ trợ sẵn). e2e custom-options (fill-blank unordered→100%) PASS.

**+ Multi-select MCQ ✅ vừa xong** (`feature/multi-select`, PR 2/5): loại câu "Chọn nhiều" (chọn nhiều đáp án đúng). Engine type "multi" (so TẬP, +4 test); curriculum QUESTION_TYPES + CustomType + migration 0017 (CHECK). Authoring (đánh dấu nhiều đúng, correct=JSON) + AnswerInput (checkbox) + Edge (parse JSON multi). e2e multi-select (chấm 100%) PASS.

**+ Nhãn MÔN cho câu tự soạn ✅ vừa xong** (`feature/subject-tag`, PR đang mở — PR 1/5 nhóm authoring+môn): migration 0016 (custom_questions.subject). subjects.ts thuần (Toán/Tiếng Việt/Tiếng Anh/Khoa học, +2 test CI). questions.tsx: picker môn + nhãn ở list. Mức nhẹ — KHÔNG đụng content Toán (D6). e2e authoring-advanced +assert PASS.

**+ PH gợi ý hành động ✅ vừa xong** (`feature/parent-suggest`, PR đang mở): màn theo dõi con thêm card "💡 Gợi ý tuần này" (3 điểm yếu nên ôn) + nút "Giao bài ôn điểm yếu" → composer mở SẴN câu (?skills= → buildQuickSet từ questionsForSkill). e2e parent-suggest PASS. Không migration.

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

## Còn mở (cập nhật — thay cho "Việc tiếp theo"/"Nợ kỹ thuật" cũ bên dưới, vốn là snapshot thời M0–M2 đã lỗi thời)

Kiểm kỹ ở phiên 2026-07-02/03 (đối chiếu roadmap + Decision Log D26–D48). Còn lại thực chất:

- **M5 native** — chặn bởi tài khoản (EAS/Apple/Google), không phải việc code. Chi tiết + lệnh cụ thể:
  `docs/M5-NATIVE.md`.
- **Push thật + cron review-scheduler lên lịch hosted** — phụ thuộc M5.1 (projectId EAS).
- **Gia sư AI**: MVP đã ship (D46, `ai-tutor-explain`, dùng Gemini) — CHỈ còn thiếu `GEMINI_API_KEY` thật
  (chưa có, `supabase secrets set` khi sẵn sàng) để trả lời thật thay vì "chưa sẵn sàng"; mở rộng phạm vi
  (chat tự do, các màn khác ngoài luyện tập, đa provider) là quyết định sản phẩm riêng, chưa làm.
- **Quên mật khẩu**: đã ship (D47) — **TẠM DỪNG** theo quyết định của chủ repo (chưa có domain nào cả,
  kể cả cho web app). Hiện dùng mailer mặc định Supabase — CHỈ gửi được cho thành viên team Supabase
  (KHÔNG phải HS/GV/PH thật), giới hạn 2 email/giờ — nghĩa là **HS/GV/PH thật KHÔNG nhận được email khôi
  phục lúc này**. Cần: mua domain (~$10-15/năm, dùng chung được cho web + email) → verify tại
  resend.com/domains → `gh secret set RESEND_API_KEY` → `gh workflow run deploy-supabase.yml`. Xem
  `supabase/README.md` mục "Quên mật khẩu".
- **Đổi mật khẩu khi đã đăng nhập**: đã ship (D48) — hoạt động đầy đủ, KHÔNG phụ thuộc domain/email.
- **Auth/quản lý người dùng còn thiếu khác** (audit cùng phiên): xác thực email, đổi tên hiển thị, đổi
  email, xóa tài khoản, avatar ảnh thật, social login, MFA, quản lý phiên đăng nhập — chưa làm. Lưu ý:
  **xác thực email** và **đổi email** cũng cần gửi email xác nhận → bị chặn bởi cùng vụ domain/Resend
  như quên mật khẩu; **đổi tên hiển thị**/**xóa tài khoản** thì KHÔNG phụ thuộc domain, làm được ngay
  nếu cần.
- **Nhóm "Tương lai" còn lại** (`docs/02-roadmap.md`): THCS/THPT sâu hơn · môn khác đầy đủ (Lý/Hóa/Anh,
  mới có nền đa môn D39) · LaTeX render/input cho chấm từng bước (thuật toán đã ship D38–D45, LaTeX thật
  chưa — `docs/future/step-grading.md`) — cả 3 đều **chưa bắt đầu**, là quyết định phạm vi sản phẩm (cần
  chuyên môn sư phạm + quy trình nội dung, khác gia sư AI vốn là việc engineering thuần).
- **Nguồn nội dung & bản quyền** (rủi ro #1 gốc, D14 vẫn đúng): câu hỏi bám CT GDPT 2018, KHÔNG chép SGK —
  chưa có quy trình review chính thức cho nội dung mới thêm.
- **Tên `synaptek`**: chưa kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.

Các mục lịch sử bên dưới (Việc tiếp theo M0–M2, Nợ kỹ thuật thời đó) giữ lại làm bản ghi — **đã hoàn tất
hết**, không còn là việc cần làm.

## Việc tiếp theo (LỊCH SỬ — thời M0→M2, đã xong)

1. ~~Merge PR `feature/m2-polish` → đóng M2~~ ✅
2. ~~M3 — Giáo viên~~ ✅ đóng (xem D22–D25)
3. ~~Deploy hosted M2~~ ✅ — deploy auto Web+Backend từ `develop` đã vận hành
4. ~~Verify iOS sim~~ — thay bằng kế hoạch M5 thật (`docs/M5-NATIVE.md`), sim không còn trong kế hoạch
5. ~~Dọn nhánh `feature/m2-mastery-path`~~ ✅

## Nợ kỹ thuật / để ý sau (LỊCH SỬ — thời M0→M2)

- `correctCount` (huy hiệu) suy từ `attempts` server lúc kết thúc phiên — đặc điểm thiết kế đã biết, vẫn
  đúng nguyên trạng ở `packages/learning-path/src/gamification.ts`, không phải lỗi cần sửa.
- ~~`auth-progress.spec.ts` strict-mode~~ — hiện chạy trong CI (`e2e-auth` job) và xanh, không còn vấn đề.
- ~~Push token/cron~~ — xem mục "Còn mở" ở trên (M5).

> **Định hướng tương lai (chủ repo nêu, thời M0–M2):** tinh chỉnh tham số BKT bằng dữ liệu thật; heatmap
> dạng lỗi chi tiết hơn — cả hai vẫn là ý tưởng mở, chưa làm, chưa được nêu lại gần đây.

## Ghi chú / quyết định mở (LỊCH SỬ — thời M1, đã chốt)

- **Lớp khởi đầu M1**: ✅ chốt **lớp 4** + cho ôn lớp 1–3 (D15).
- **Auth M1**: ✅ chốt **tối thiểu** (Supabase email/mật khẩu) (D16).
