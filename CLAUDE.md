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
  Sau M4 đã làm thêm nhiều ngoài roadmap (xem Decision Log D26–D52): authoring **11 loại câu** (gồm trình bày
  từng bước + nhiều phần a/b/c, CÓ THỂ lồng derivation) + nhãn môn + tùy chọn chấm + ảnh + gợi ý + bàn phím
  toán có cấu trúc; engine moat mở rộng (hỗn số/%/đơn vị/La Mã/căn bậc hai/6 chẩn đoán); đa môn (nền + seed
  Tiếng Việt lớp 1–3); TN học sinh (mục tiêu ngày · luyện nhanh · BXH · avatar); insight GV–PH; **gia sư AI
  MVP** (Gemini, giải thích khi sai, chờ `GEMINI_API_KEY` thật); **quên mật khẩu** (Resend SMTP — TẠM DỪNG,
  chờ chủ repo mua domain); **tự phục vụ tài khoản đầy đủ**: đổi mật khẩu khi đã đăng nhập · đổi tên hiển
  thị · đăng xuất thiết bị khác · avatar ảnh thật (lựa chọn thêm cạnh emoji-XP) · xóa tài khoản (soft
  delete, GV còn lớp có HS bị chặn) — cả 5 việc này KHÔNG phụ thuộc domain, hoạt động đầy đủ.
  **Còn lại**: M5 native/store (chờ tài khoản, `docs/M5-NATIVE.md`) - nhóm "Tương lai" (THCS/THPT sâu hơn ·
  môn khác đầy đủ · chấm từng bước+LaTeX thật) - auth còn thiếu: xác thực email/đổi email (chặn bởi domain,
  cùng lý do quên mật khẩu), social login, MFA.
- **Stack**: TypeScript · Expo SDK 56 / Expo Router / React 19 / RN 0.85. Packages: `@synaptek/grading-engine`
  (moat) + `@synaptek/curriculum` + `@synaptek/learning-path` (heatmap/mastery) + `@synaptek/classroom` (mã mời +
  giới hạn nộp + điểm + tổng hợp + `pickForStudent`) + `@synaptek/step-grading` (chấm lời giải từng bước).
  NativeWind v4, `@supabase/supabase-js`, TanStack Query.
- **Storage**: Supabase — migrations **`0001`–`0025`** (mới nhất: 0023 nhiều phần a/b/c · 0024 avatar ảnh
  thật · 0025 xóa tài khoản). RLS chéo vai trò qua helper `SECURITY DEFINER` (D24/D26/D30/D32). Edge
  Functions: `grade` · `grade-assignment` · `review-scheduler` · `ai-tutor-explain` (D46, Gemini, cần
  secret `GEMINI_API_KEY` riêng) · `delete-account` (D52, service-role, soft delete). Auth SMTP: Resend
  (D47, cần secret `RESEND_API_KEY` + domain — TẠM DỪNG), cấu hình qua Management API trong
  `deploy-supabase.yml`. Deploy: web Vercel auto + backend GitHub Action auto (db push + functions
  deploy + ensure auth config) từ `develop`.
- **CI** (`.github/workflows/ci.yml`): 3 gate — **verify** (format · npm test · engine↔_shared sync · content ·
  deno · web build · 6 guest e2e) · **RLS isolation** (rls-\*.sql trên Supabase thật) · **e2e-auth** (40 luồng
  đăng nhập trên Supabase+Edge). Supabase CLI pin `2.108.0`.

## Recent Changes

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
