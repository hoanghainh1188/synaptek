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
npm test            # test toàn bộ packages (hiện tại: grading-engine, 19/19). Không cần mạng/thiết bị.
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
feedbackCode, normalized }`. Hỗ trợ: `mcq` · `true-false` · `numeric` · `fraction` · `expression` ·
`fill-blank`. Điểm thiết kế: chuẩn hóa số kiểu VN (phẩy = thập phân — D8); tương đương biểu thức qua
**lấy mẫu giá trị x** (D9, không phải CAS). Sửa engine → chạy lại `npm test` và cập nhật test trước (TDD).

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

- **Đang làm**: M3 — Giáo viên (`specs/003-teacher-classroom/`). Plan: `specs/003-teacher-classroom/plan.md`.
  (M0/M1/M2 ✅ đóng — M2 US1+US2+US3+Polish merge.)
- **Stack**: TypeScript · Expo SDK 56 / Expo Router / React 19 / RN 0.85. Dùng lại
  `@synaptek/grading-engine` (chấm chính thức server-side, thay stub) + `@synaptek/curriculum` +
  `@synaptek/learning-path` (heatmap/mastery cho phân tích lớp); **mới** `@synaptek/classroom` (mã mời +
  hạn nộp + điểm hợp lệ + tổng hợp lớp, TS thuần test-first). NativeWind v4, `@supabase/supabase-js`, TanStack Query.
- **Storage**: Supabase — **migration `0003`** mới: `profiles.role` + `classes`/`class_members`/`assignments`/
  `submissions` + **RLS chéo vai trò** qua helper `SECURITY DEFINER` (`owns_class`/`is_member`) + RPC
  `join_class_by_code`. Đề/đáp án = JSON `content/` (D6); **answer-keys** cho chấm server = artifact tự sinh
  đồng bộ `_shared` (D13). Chấm chính thức = Edge Function `grade-assignment` (ẩn đáp án — D4).

## Recent Changes

- **003-teacher-classroom**: spec + clarify + plan (lớp + mã mời, giao bài, chấm chính thức server-side +
  ghi đè/nhận xét, phân tích lớp, RLS chéo vai trò). Decision Log **D22** (vai trò) · **D23** (lớp/bài/nộp +
  audit) · **D24** (RLS SECURITY DEFINER + chấm server qua answer-keys).
- **002-mastery-path**: ✅ đóng — BKT mastery + lộ trình + gamification + spaced repetition/cron/push.
  Decision Log **D19** (BKT) · **D20** (gamification) · **D21** (cron+push).
- **001-m1-practice-loop**: ✅ đóng — practice loop: dùng lại engine, package `curriculum`, auth tối thiểu Supabase.
