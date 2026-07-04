# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Đây là gì

**Synaptek** (_synapse_ + _tek_) là nền tảng học & luyện tập giúp học sinh Việt Nam **thôi sợ và chinh
phục môn học**, khởi đầu với **Toán Tiểu học (lớp 1–5)**. Phần khó & khác biệt ("moat") là **bộ chấm
tương đương** — học sinh nhập `0,5` hay `2/4` hay `2(x+2)` đều được chấm đúng, kèm lộ trình khắc phục
điểm yếu. Phần còn lại (nội dung, tiến độ, lớp học) chủ yếu là CRUD + content.

Vai trò: **học sinh / giáo viên / phụ huynh**. Cross-platform: **web ra trước, native (iOS/Android)
sau**, một codebase Expo. Mở rộng sau: THCS/THPT, môn khác (Lý/Hóa/Anh).

Docs & comment viết **tiếng Việt** — giữ đúng ngôn ngữ khi sửa prose có sẵn; định danh code **tiếng Anh**.

## Lệnh

```bash
npm test            # test toàn bộ packages + apps/app lib thuần (grading-engine 54, learning-path, classroom…). Không cần mạng/thiết bị.
npm run format      # prettier --write .
npm run format:check
```

- Node **≥ 22** (`.nvmrc` → `22`). Package lõi ship & test ở dạng raw `.ts` qua
  `node --experimental-strip-types` — **không có build step / bundler**.
- Monorepo npm workspaces: `packages/*` (TS thuần) + `apps/*` (app Expo universal). Husky pre-commit
  tự format/lint staged files. CI ở `.github/workflows/ci.yml` (chạy trên `develop`).

## Kiến trúc — đọc trước khi thêm code

Toàn bộ rationale ở `docs/00-architecture.md` §0 (Decision Log D1–D13). Bốn điều cốt lõi:

1. **Logic nghiệp vụ = package TS thuần** (`packages/grading-engine`, sắp tới `curriculum`,
   `learning-path`). Không import DOM/React/Node-only → test được không cần render, tái dùng across
   client + Edge Function + native. (D2)
2. **Ranh giới repo (D5):** phụ thuộc một chiều `apps/*` & `supabase/functions/*` → `packages/*`;
   package không biết về app; không app nào import app khác; **dùng lại bằng tên package, không copy**;
   chỉ tách package mới ở consumer **thứ 2**.
3. **Backend = Supabase BaaS + Edge Functions (D3/D4).** Không có server riêng. CRUD/RLS qua Supabase;
   logic đáng tin cậy (**chấm chính thức, ẩn đáp án, cấp quyền, job nền**) chạy ở Edge Function và
   **import lại `@synaptek/grading-engine`** — client chỉ chạy engine cho phản hồi tức thì (low-stakes).
4. **Nội dung = JSON versioned trong `content/` (D6).** Curriculum + ngân hàng câu hỏi là ground-truth,
   review qua git; DB chỉ tham chiếu `id`. Với ngữ cảnh có điểm, Edge Function trả đề **không kèm đáp án**.

## Bộ chấm bài (lõi)

File đơn: `packages/grading-engine/src/grading-engine.ts`. Hàm `grade(input) → { isCorrect, score,
feedbackCode, normalized, diagnosis? }`. Hỗ trợ **9 loại**: `mcq` · `true-false` · `numeric` · `fraction` ·
`expression` · `fill-blank` · `multi` · `ordering` · `matching`. Số kiểu VN (phẩy=thập phân — D8) + hỗn số/%/
đơn vị đo/La Mã/**căn bậc hai `√`·`sqrt()`** (D45); tương đương biểu thức qua **lấy mẫu giá trị x** (D9,
không CAS); 6 chẩn đoán lỗi (D-mở rộng). Sửa engine → chạy lại `npm test` và cập nhật test trước (TDD).

## Quy trình làm việc (mặc định)

Theo Spec Kit (`.specify/` + `specs/NNN-*`). Với mỗi task không-tầm-thường, như một senior engineer:
**(1)** đọc spec/Decision Log liên quan; **(2)** làm rõ điểm mơ hồ & nêu trade-off _trước khi_ code
(dùng AskUserQuestion); **(3)** với UI bám design tokens + design-quality (anti-template); **(4)** code
kèm test — **ưu tiên unit test** cho logic thuần, thêm Playwright e2e cho luồng chính; **(5)** branch →
conventional commit → push → PR (về `develop`), CI xanh (format → test → engine↔_shared → build web); **(6) close-out:** cập
nhật `docs/WORKING-NOTES.md` (điểm tiếp tục) + Decision Log/spec/file liên quan **trong cùng PR**.

## Working norms

- **`docs/WORKING-NOTES.md` là điểm tiếp tục** — đọc đầu phiên, cập nhật trước khi dừng.
- Quyết định không hiển nhiên → thêm/cập nhật một dòng trong **Decision Log** (`docs/00-architecture.md` §0).
- Roadmap **milestone-gated, không theo ngày** (`docs/02-roadmap.md`): M0 scaffolding → M1 vòng luyện
  tập → M2 mastery/lộ trình → M3 giáo viên → M4 phụ huynh/nội dung → M5 native. Giữ mọi thay đổi ở
  trạng thái chạy được.

## Active Technologies (managed by Spec Kit)

- **Đang làm**: **M0–M4 ✅ đóng hết** (luyện tập · mastery/lộ trình · giáo viên · phụ huynh + nội dung lớp 1–5).
  Sau M4 đã làm thêm nhiều ngoài roadmap (xem Decision Log D26–D55): authoring **11 loại câu** (gồm trình bày
  từng bước + nhiều phần a/b/c, CÓ THỂ lồng derivation) + nhãn môn + tùy chọn chấm + ảnh + gợi ý + bàn phím
  toán có cấu trúc; engine moat mở rộng (hỗn số/%/đơn vị/La Mã/căn bậc hai/6 chẩn đoán); đa môn (nền + seed
  Tiếng Việt lớp 1–3); TN học sinh (mục tiêu ngày · luyện nhanh · BXH · avatar); insight GV–PH; **gia sư AI
  MVP** (Gemini, giải thích khi sai, chờ `GEMINI_API_KEY` thật); **quên mật khẩu** (Resend SMTP — TẠM DỪNG,
  chờ chủ repo mua domain); **tự phục vụ tài khoản đầy đủ**: đổi mật khẩu khi đã đăng nhập · đổi tên hiển
  thị · đăng xuất thiết bị khác · avatar ảnh thật (lựa chọn thêm cạnh emoji-XP) · xóa tài khoản (soft
  delete, GV còn lớp có HS bị chặn) — cả 5 việc này KHÔNG phụ thuộc domain, hoạt động đầy đủ; **LaTeX
  render thật qua KaTeX** (web-only, chỉ nâng hiển thị, D53); **khung cấp học 2 tầng** (Tiểu học/THCS/THPT
  suy ra từ số lớp, D54) + **THCS Toán lớp 6** (3 mạch: Số & Đại số D55/D57/D61/D62 + Hình học D63 + Thống kê-Xác suất D64) +
  **gate tự-chấm nội dung** (validate:content chạy engine trên đáp án). Quy trình nội dung cấp trên: AI nháp
  bám CT GDPT + tooling, chủ repo DUYỆT trước merge (cửa bắt buộc, D14/D55).
  **Còn lại**: M5 native/store (chờ tài khoản, `docs/M5-NATIVE.md`) - nhóm "Tương lai còn lại" (mở rộng
  THCS/THPT sâu hơn từ pilot · môn mới Lý/Hóa/Anh — Tiếng Anh cần bộ chấm khác moat · gia sư AI mở rộng
  chat tự do — cần quyết định phạm vi/an toàn) - auth còn thiếu: xác thực email/đổi email (chặn bởi domain,
  cùng lý do quên mật khẩu), social login, MFA.
- **Stack**: TypeScript · Expo SDK 56 / Expo Router / React 19 / RN 0.85. Packages: `@synaptek/grading-engine`
  (moat) + `@synaptek/curriculum` + `@synaptek/learning-path` (heatmap/mastery) + `@synaptek/classroom` (mã mời +
  giới hạn nộp + điểm + tổng hợp + `pickForStudent`) + `@synaptek/step-grading` (chấm lời giải từng bước).
  NativeWind v4, `@supabase/supabase-js`, TanStack Query, `katex` (D53, render LaTeX web-only qua
  `MathText.web.tsx` — pattern platform-split file `.web.tsx`, native dùng `MathText.tsx` cũ; CSS/font
  nạp qua `public/katex/` — static asset, KHÔNG qua Metro module graph, xem D53). Vendor assets TỰ
  ĐỘNG đồng bộ: `npm run sync:edge` (engine↔Edge) + `npm run sync:katex` (`node_modules/katex` →
  `public/katex/`) — cả hai có gate CI `git diff` chống lệch (D13).
- **Storage**: Supabase — migrations **`0001`–`0025`** (mới nhất: 0023 nhiều phần a/b/c · 0024 avatar ảnh
  thật · 0025 xóa tài khoản). RLS chéo vai trò qua helper `SECURITY DEFINER` (D24/D26/D30/D32). Edge
  Functions: `grade` · `grade-assignment` · `review-scheduler` · `ai-tutor-explain` (D46, Gemini, cần
  secret `GEMINI_API_KEY` riêng) · `delete-account` (D52, service-role, soft delete). Auth SMTP: Resend
  (D47, cần secret `RESEND_API_KEY` + domain — TẠM DỪNG), cấu hình qua Management API trong
  `deploy-supabase.yml`. Deploy: web Vercel auto + backend GitHub Action auto (db push + functions
  deploy + ensure auth config) từ `develop`.
- **CI** (`.github/workflows/ci.yml`): 3 gate — **verify** (format · npm test · engine↔_shared sync · content ·
  deno · web build · 7 guest e2e) · **RLS isolation** (rls-\*.sql trên Supabase thật) · **e2e-auth** (41 luồng
  đăng nhập trên Supabase+Edge). Supabase CLI pin `2.108.0`.

## Recent Changes

- **Nhân rộng THCS — lớp 6 Thống kê & Xác suất (sau M4)**: **MẠCH THỨ 3** (`g6.sta`, 2 topic Thống kê + Xác
  suất). Phán đoán CT: trung bình cộng/mốt là LỚP 7 → cố ý không đưa vào; giữ Thống kê ở mức đọc/xử lí dữ
  liệu (dữ liệu bằng CHỮ để né ảnh biểu đồ) + Xác suất (khả năng xảy ra + xác suất phân số → moat). 17 câu.
  Engine sẵn → không đổi; gate tự-chấm áp tự động (tổng **307 câu, 40 kỹ năng**). e2e +1. Decision Log **D64**.
- **Nhân rộng THCS — lớp 6 Hình học trực quan (sau M4)**: **MẠCH MỚI** — strand thứ 2 của lớp 6 (`g6.geo`
  "Hình học và Đo lường"), đa dạng hoá ngoài Số & Đại số. 3 skill: nhận biết hình → chu vi + diện tích. 17
  câu (mcq/true-false nhận biết + numeric chu vi/diện tích). Chọn Hình học thay Thống kê-Xác suất vì hợp
  engine numeric. Xác nhận schema/home chịu nhiều strand không đổi code. Engine sẵn → không đổi; gate tự-chấm
  áp tự động (tổng **290 câu, 37 kỹ năng**). e2e +1 (mcq lục giác đều). Decision Log **D63**.
- **Nhân rộng THCS — lớp 6 Số tự nhiên (sau M4)**: chủ đề THCS thứ 4 → **trọn mạch Số & Đại số lớp 6**. Topic
  `g6.num.naturals` (đặt đầu strand, CT xếp trước Số nguyên): 3 skill lũy thừa+thứ tự phép tính · chia hết/
  nguyên tố · ƯCLN/BCNN (DAG nền, prereq rỗng). 17 câu numeric+mcq+true-false. Engine sẵn → không đổi; gate
  tự-chấm áp tự động (tổng **273 câu, 34 kỹ năng**). e2e +1 test (lũy thừa 2^3→8). Decision Log **D62**.
- **Nhân rộng THCS — lớp 6 Số thập phân (sau M4)**: chủ đề THCS thứ 3 — topic `g6.num.decimals` (3 skill,
  DAG liên chủ đề trỏ Số nguyên vì có số thập phân âm) + 17 câu (số đối/so sánh/làm tròn/±/×÷, gồm số âm).
  **Dấu phẩy VN** (D8) — engine chuẩn hoá số kiểu VN + số âm sẵn → không đổi engine; gate tự-chấm áp tự động
  (tổng **256 câu, 31 kỹ năng**). e2e +1 test (nhập `-2,5` phẩy VN → đúng). Chủ repo DUYỆT trước merge.
  Decision Log **D61**.
- **Nhân rộng THCS — lớp 6 Phân số (sau M4, hướng A)**: chủ đề THCS thứ 2 sau pilot Số nguyên — thêm topic
  `g6.num.fractions` (3 skill concept/addsub/muldiv, DAG **liên chủ đề** trỏ sang Số nguyên vì phân số lớp 6
  dùng tử/mẫu số nguyên có âm) + 17 câu (rút gọn/so sánh/±/×÷ phân số, gồm phân số âm + hỗn số). Engine đã hỗ
  trợ tương đương phân số/hỗn số/số âm sẵn → không đổi engine; gate tự-chấm D55 áp tự động (tổng **239 câu, 28
  kỹ năng**). e2e +1 test khoe moat (nhập `9/12` cho câu 6/8→3/4 vẫn đúng). Chủ repo DUYỆT trước merge (D14/D55).
  Decision Log **D57**.
- **THCS Toán lớp 6 pilot (Số nguyên) + gate tự-chấm nội dung (sau M4)**: nội dung cấp trên đầu tiên —
  `content/curriculum/grade-6.json` (mạch "Số và Đại số", chủ đề "Số nguyên", 3 skill) + 17 câu numeric
  số nguyên âm. Kích hoạt khung 2 tầng D54 → hàng "Cấp: THCS" nay HIỆN thật trên home. `validate:content`
  thêm gate TỰ-CHẤM: chạy `grade()` với answer=correct → phải isCorrect (bắt lỗi soạn đáp án tự động, áp
  cả 205 câu cũ). Quy trình: AI nháp bám CT GDPT + tooling, **chủ repo DUYỆT trước merge** (D14/D55). Nội
  dung tổng 222 câu, 25 kỹ năng. Decision Log **D55**.
- **Khung cấp học 2 tầng — chuẩn bị THCS/THPT (sau M4)**: module thuần `curriculum/src/level.ts` —
  "cấp" (Tiểu học 1–5 · THCS 6–9 · THPT 10–12) SUY RA từ số lớp, KHÔNG lưu riêng (tránh lệch). Nới
  validate curriculum/question 1–5 → 1–12 (DB `grade_level` đã cho phép 1–12 sẵn, không migration). Home
  đổi picker phẳng → 2 tầng cấp→lớp, hàng "Cấp" chỉ hiện khi >1 cấp có nội dung. Decision Log **D54**.
- **LaTeX render thật qua KaTeX (sau M4)**: `MathText.web.tsx` mới (platform-split `.web.tsx`, web-only)
  đổi segment `frac`/`sup` sang KaTeX thật thay vì FractionView/mũ-unicode tự chế — CHỈ nâng hiển thị,
  cú pháp lưu DB/bàn phím toán/engine chấm giữ nguyên. Native giữ renderer cũ (KaTeX là DOM-only).
  Bundle web +~76KB gzip JS thực đo (cao hơn ước tính ban đầu ~15-30KB) — ghi nhận cùng phát hiện
  baseline app đã ~702KB gzip từ trước (kiến trúc single-bundle, không liên quan thay đổi này). Decision
  Log **D53**.
- **Tự phục vụ tài khoản — trọn 4 việc (sau M4)**: đổi tên hiển thị (`profiles.full_name`, RLS có sẵn,
  D49) · đăng xuất thiết bị khác (`signOut({scope:"others"})`, D50) · avatar ảnh thật (bucket Storage
  `avatars` 2MB, LỰA CHỌN THÊM cạnh emoji-XP không thay thế, D51) · xóa tài khoản (Edge Function mới
  `delete-account` service-role, soft delete, GV còn lớp có HS bị chặn, D52). Bug thật bắt được lúc
  build: `service_role` cần GRANT tường minh từng bảng mới (không tự bypass như RLS) — thiếu GRANT trên
  `profiles`/`classes` khiến role-check âm thầm sai, fix trong migration `0025`.
- **Đổi mật khẩu khi đã đăng nhập (sau M4)**: `changePassword` xác thực lại mật khẩu hiện tại (chống
  đổi mật khẩu khi phiên bị chiếm dụng) trước khi `updateUser`. Màn `change-password.tsx`, vào từ Hồ sơ
  mục "Bảo mật". Không phụ thuộc domain/email — hoạt động đầy đủ. Decision Log **D48**.
- **Quên mật khẩu (sau M4, TẠM DỪNG)**: `resetPasswordForEmail`/`updatePassword` + màn `forgot-password.tsx`/
  `reset-password.tsx`. SMTP Resend (free tier vĩnh viễn), sender sandbox `onboarding@resend.dev` cho
  tới khi verify domain thật — chủ repo chưa có domain, tạm dùng mailer mặc định Supabase (chỉ gửi được
  cho team member, không phải người dùng thật). E2E đọc email thật qua Mailpit cục bộ. Decision Log **D47**.
- **Gia sư AI MVP (sau M4)**: Edge Function `ai-tutor-explain` gọi Gemini API giải thích vì sao HS SAI —
  engine vẫn chấm, LLM chỉ giải thích. Nút "Hỏi tại sao sai?" ở màn luyện tập. Chưa có `GEMINI_API_KEY`
  thật → graceful "chưa sẵn sàng". Decision Log **D46**.
- **Căn bậc hai √/sqrt() (sau M4)**: tokenizer nhận cả √ (ký hiệu) lẫn sqrt() (chữ), toán tử một ngôi cùng
  precedence `neg`; áp dụng numeric+expression (derivation thừa hưởng qua expressionsEquivalent chung); bàn
  phím toán + thanh chèn nhanh soạn câu thêm nút √. Decision Log **D45**.
- **Câu nhiều phần LỒNG derivation (sau M4)**: `gradeCompoundParts` (mới, ở `@synaptek/step-grading` — tránh
  phụ thuộc ngược grading-engine) chấm phần thường qua `grade()` + phần derivation qua `gradeDerivation` cùng
  lượt. Decision Log **D44**.
- **Câu nhiều phần (a/b/c) (sau M4)**: loại `compound` — mỗi phần là 1 trong 9 loại đơn giản (nay thêm được
  derivation, D44), chấm độc lập, điểm = trung bình các phần. Decision Log **D43**; migration `0023`.
- **Trình bày từng bước + bàn phím toán (sau M4)**: loại `derivation` giao/chấm được qua `@synaptek/step-grading`
  (Edge); bàn phím toán có cấu trúc cho HS (đáp án) và GV/PH (soạn câu, chèn nhanh + xem trước). Decision Log
  **D38/D40–D42**; migration `0022`.
- **Authoring + môn (sau M4)**: 9 loại câu (mcq · số · phân số · đúng/sai · biểu thức · điền chỗ trống ·
  **chọn nhiều** · **sắp thứ tự** · **nối cặp**) + nhãn môn + tùy chọn chấm (làm tròn/dung sai/không-thứ-tự) +
  ảnh (Storage) + gợi ý. Decision Log **D28–D37**; migrations `0007`–`0021`.
- **TN học sinh / Insight (sau M4)**: mục tiêu hằng ngày · luyện nhanh · bảng xếp hạng lớp · avatar XP;
  cảnh báo HS · xu hướng lớp · tóm tắt tuần GV · PH gợi ý hành động. Decision Log **D29–D33**.
- **Engine moat mở rộng**: hỗn số · phần trăm · đơn vị đo · số La Mã · 6 chẩn đoán lỗi (sign/magnitude10/
  reciprocal/rounding/offByOne/transposed) · options unordered/roundTo. 54 unit test.
- **005-parent-monitoring**: ✅ đóng (M4) — liên kết PH–con qua mã, theo dõi read-only, RLS đọc chéo,
  giao bài tại nhà. Decision Log **D26/D27**.
- **003-teacher-classroom**: ✅ đóng — lớp + mã mời, chấm chính thức server-side (ẩn đáp án), ghi đè/nhận
  xét, phân tích lớp, RLS chéo vai trò. **D22/D23/D24**; + giới hạn nộp bài **D25**.
- **002-mastery-path**: ✅ đóng — BKT mastery + lộ trình + gamification + spaced repetition/cron/push.
  Decision Log **D19** (BKT) · **D20** (gamification) · **D21** (cron+push).
- **001-m1-practice-loop**: ✅ đóng — practice loop: dùng lại engine, package `curriculum`, auth tối thiểu Supabase.
