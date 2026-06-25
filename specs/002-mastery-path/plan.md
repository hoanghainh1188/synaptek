# Implementation Plan: M2 — Mastery & Lộ trình cá nhân hóa

**Branch**: `feature/m2-mastery-path` (Spec Kit feature `002-mastery-path`) | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-mastery-path/spec.md`

## Summary

Đưa app từ "luyện tập rời rạc" (M1) thành "biết yếu ở đâu & học gì tiếp". Thêm **một package thuần
`@synaptek/learning-path`** (zero-dep, raw `.ts`, test bằng `node --experimental-strip-types` như
`grading-engine`/`curriculum`) chứa toàn bộ logic: **cập nhật mastery BKT**, **bộ gợi ý "học gì tiếp"**
(gate tiên quyết ≥ 0.95 ∧ mastery < 0.95 ∧ đến hạn), **lập lịch ôn SM-2**, **luật gamification** (XP theo
độ khó, streak, huy hiệu), và **suy bản đồ điểm yếu** từ `attempts`. Đầu vào: `attempts` (M1) + skill
graph/tiên quyết từ `@synaptek/curriculum`. Ghi mastery vào `skill_mastery` (cột đã có ở `0001`); thêm
**migration `0002`** cho gamification (XP/streak/badges), push token, và bản ghi nhắc (idempotent). Job
nền = **Supabase scheduled Edge Function** dùng lại scheduler qua `_shared` (D13). Push **best-effort**
qua expo-notifications; nhắc **in-app bắt buộc**. UI mới: màn chẩn đoán, trang chủ lộ trình, heatmap, hồ
sơ huy hiệu — bám design tokens (anti-template). Ghi Decision Log **D19** (BKT), **D20** (gamification),
**D21** (cron+push).

## Technical Context

**Language/Version**: TypeScript. Node ≥ 22 (packages/lib test qua `node --experimental-strip-types`),
React 19.2 / RN 0.85 (app), Deno (Edge Function scheduled).
**Primary Dependencies**: có sẵn — Expo SDK 56 + Expo Router, `@synaptek/grading-engine`,
`@synaptek/curriculum`, NativeWind v4, `@supabase/supabase-js`, TanStack Query. **Mới**:
`@synaptek/learning-path` (TS thuần, zero-dep); `expo-notifications` (push, best-effort).
**Storage**: Supabase Postgres. `skill_mastery` (đã có: `mastery`/`attempts_count`/`last_reviewed`/`due_at`)
— **không** đổi cột. **Migration mới `0002_m2_mastery.sql`**: `gamification_state`, `student_badges`,
`push_tokens`, `review_reminders` (+ RLS + grants). Định nghĩa huy hiệu = **JSON versioned** trong
`content/` (D6). Schema câu hỏi (`@synaptek/curriculum`) thêm trường `difficulty` **tùy chọn**.
**Testing**: `node --experimental-strip-types --no-warnings` cho `@synaptek/learning-path` (TDD, trọng
tâm) + `apps/app/src/lib/*` (view-model thuần); Playwright web e2e (chẩn đoán → lộ trình → luyện → heatmap;
streak/XP). Edge Function: test logic scheduler qua package + một integration chạy function cục bộ.
**Target Platform**: Web (ra trước) + iOS/Android (sau) — universal. Push: web hạn chế, native cần EAS.
**Project Type**: Mobile/web universal (Expo) + serverless (Supabase Edge Functions).
**Performance Goals**: cập nhật mastery + sinh lộ trình **< 50ms** phía client (logic thuần, không I/O);
INP < 200ms; job nền rà đến-hạn xử lý theo lô.
**Constraints**: mastery BKT **tất định** với cùng lịch sử (test được); job nền **idempotent**; mốc ngày
= **Asia/Ho_Chi_Minh**; tôn trọng `reduced-motion`; chữ Việt có dấu; vùng chạm lớn (trẻ em).
**Scale/Scope**: lớp 1–4 (skill graph hiện có, 6 kỹ năng lớp 4 + lớp dưới); bộ huy hiệu khởi đầu ~6–8;
~4–5 màn mới.

## Constitution Check

_GATE: phải qua trước Phase 0; tái kiểm sau Phase 1._

- **I. Engine là moat** — M2 **không** đụng `grading-engine` (chỉ tiêu thụ `attempts` đã chấm). Logic mới
  cô lập trong package thuần riêng. ✅
- **II. Một nguồn-sự-thật** — mastery/lộ trình là **logic suy ra**, lưu trạng thái tối thiểu (`skill_mastery`
  - `gamification_state`); huy hiệu = JSON versioned trong `content/` (D6); spec/plan trỏ số D, không chép
    rationale. ✅
- **III. Test-first** — `@synaptek/learning-path` (BKT/recommender/SM-2/gamification/heatmap) viết test
  trước, raw `.ts`, nhắm ≥ 80% coverage. Đây là phần "khó" thứ hai sau engine. ✅
- **IV. Milestone-gated, luôn chạy được** — 3 user story P1/P2/P3 độc lập demo; P1 (mastery+lộ trình) tự
  là MVP của M2; P3 (push) best-effort không chặn "done". ✅
- **V. Vừa-đủ** — `@synaptek/learning-path` có **2 consumer** ngay (app client + scheduled Edge Function
  qua `_shared`) → tách package đúng D5. Tái dùng scheduler ở edge bằng **bản `_shared` tự sinh** (D13),
  không viết lại. Không thêm app/service mới. Migration chỉ thêm bảng thật sự cần. ✅

→ **PASS — không vi phạm.** (Quyết định kỹ thuật chi tiết ở `research.md`.)

## Project Structure

### Documentation (this feature)

```text
specs/002-mastery-path/
├── spec.md              # WHAT/WHY (đã có; đã clarify)
├── plan.md              # file này
├── research.md          # Phase 0 — quyết định kỹ thuật (BKT/SM-2/gamification/storage/cron/push)
├── data-model.md        # Phase 1 — entities + migration 0002 + difficulty
├── contracts/
│   ├── learning-path-api.md   # API công khai package thuần (BKT/recommend/schedule/gamification/heatmap)
│   ├── db-schema.md           # migration 0002 (bảng + RLS + grants) — GATE storage
│   └── review-scheduler.md    # hợp đồng Edge Function nền (input lịch, idempotent, push best-effort)
├── quickstart.md        # Phase 1 — cách chạy & nghiệm thu
└── tasks.md             # Phase 2 — /speckit-tasks (CHƯA tạo)
```

### Source Code (repository root)

```text
packages/
├── grading-engine/                 # có sẵn — KHÔNG đụng
├── curriculum/                     # có sẵn — THÊM trường `difficulty` (tùy chọn) vào Question + schema
│   └── src/{types,schema}.ts       #   validate 1..3; helper difficultyOf(q) fallback theo type
└── learning-path/                  # MỚI @synaptek/learning-path (TS thuần, zero-dep, raw .ts)
    ├── src/
    │   ├── index.ts
    │   ├── bkt.ts                   # updateMastery (posterior + learn), BktParams + default, MASTERED=0.95
    │   ├── diagnostic.ts            # buildDiagnostic (~5–8 câu trải kỹ năng nền) + initFromDiagnostic
    │   ├── recommender.ts           # recommendNext: gate tiên quyết ∧ mastery<0.95 ∧ đến hạn; xếp ưu tiên
    │   ├── schedule.ts              # nextDueAt SM-2 đơn giản hóa (theo mastery) — dùng cả ở edge
    │   ├── gamification.ts          # xpForAttempt(difficulty), updateStreak (mốc VN), evaluateBadges
    │   ├── heatmap.ts               # skillWeakness + commonErrorType từ attempts
    │   └── time.ts                  # dayKeyVN (Asia/Ho_Chi_Minh) — quy ước ngày tất định
    └── tests/                       # node --experimental-strip-types: 1 file/feature, TDD

content/
├── curriculum/grade-*.json         # có sẵn (có thể bổ sung `difficulty` cho câu — tùy chọn, không bắt buộc)
└── gamification/badges.json        # MỚI — định nghĩa huy hiệu (id, tên, mô tả, criteria) — D6, validate

apps/app/src/
├── app/
│   ├── diagnostic.tsx              # MỚI — bài chẩn đoán đầu vào
│   ├── index.tsx                   # SỬA trang chủ → lộ trình "hôm nay học gì" + streak/XP
│   ├── heatmap.tsx                 # MỚI — bản đồ điểm yếu
│   └── profile.tsx                 # MỚI — hồ sơ + huy hiệu
├── lib/
│   ├── mastery.ts                  # MỚI — view-model: gộp attempts→BKT (qua learning-path), I/O skill_mastery
│   ├── path.ts                     # MỚI — view-model lộ trình (gọi recommender)
│   ├── gamification.ts             # MỚI — view-model XP/streak/badge (qua learning-path), I/O gamification_state
│   ├── notifications.ts            # MỚI — đăng ký expo-notifications (best-effort) + lưu push_token
│   └── supabase/{mastery,gamification,push}.ts  # MỚI — query/mutation TanStack
├── components/{path,heatmap,gamification,diagnostic}/…  # UI nhóm theo feature, bám tokens
└── tests/{unit, e2e}

supabase/
├── migrations/0002_m2_mastery.sql  # MỚI — gamification_state · student_badges · push_tokens · review_reminders
└── functions/
    ├── _shared/                    # THÊM bản tự sinh từ learning-path (sync:edge mở rộng)
    │   ├── grading-engine.ts       # có sẵn
    │   └── learning-path/          # MỚI — schedule.ts (+ phụ thuộc thuần) cho scheduler
    └── review-scheduler/           # MỚI — Edge Function nền: rà due → review_reminders (idempotent) → push
        └── index.ts
```

**Structure Decision**: Giữ monorepo; thêm **một** package `@synaptek/learning-path` (logic mastery/lộ
trình/gamification thuần). Phụ thuộc một chiều `apps/*` & `supabase/functions/*` → `packages/*` (D5).
Scheduler tái dùng ở Edge Function qua bản `_shared` tự sinh (D13) — mở rộng `scripts/sync-edge-engine.mjs`
để đồng bộ thêm phần lập lịch. View-model ở `apps/app/src/lib/*` (thuần, test không cần render); UI nhóm
theo feature. Định nghĩa huy hiệu = JSON trong `content/` (D6). **Migration mới `0002`** (khác M1) cho
trạng thái gamification + push + idempotency nhắc.

## Complexity Tracking

> Không có vi phạm Constitution cần biện minh.

| Quyết định                        | Vì sao cần                                                                                          | Phương án đơn giản hơn bị loại vì                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Package `@synaptek/learning-path` | 2 consumer (client + scheduled edge), logic thuần test-first                                        | Nhồi vào `apps/app/lib` → edge không dùng lại được (D5/D13); khó test cô lập  |
| Migration `0002` (4 bảng)         | XP/streak/badge/push/idempotency là trạng thái per-student, không thuộc `skill_mastery` (per-skill) | Nhồi cột vào `profiles` → trộn định danh với trạng thái game, khó RLS/mở rộng |
| Đồng bộ `_shared/learning-path`   | edge-runtime chỉ mount `supabase/functions` (D13)                                                   | Import `packages/` ở edge → BOOT_ERROR (đã gặp ở M1)                          |
