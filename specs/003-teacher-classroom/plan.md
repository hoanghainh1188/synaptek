# Implementation Plan: M3 — Giáo viên (lớp học, giao bài, chấm chính thức)

**Branch**: `003-teacher-classroom` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-teacher-classroom/spec.md`

## Summary

Mở vai trò **giáo viên** vận hành một lớp end-to-end mà **không** đụng moat (engine) và **không** đổi
hành vi M1/M2. Phần lõi M3 là **dữ liệu quan hệ + RLS chéo vai trò** (Postgres), không phải thuật toán:
nên trọng tâm là **migration `0003` + chính sách RLS chặt** (qua helper `SECURITY DEFINER` chống đệ quy)
và **một Edge Function chấm chính thức** dùng lại `@synaptek/grading-engine`. Logic nghiệp vụ thuần ít
nhưng vẫn tách ra package thuần mới **`@synaptek/classroom`** (sinh/validate mã mời, quy tắc hạn nộp,
hợp lệ điểm ghi đè, tổng hợp phân tích lớp) — test-first, dùng lại được ở client + edge. Phân tích lớp
**dùng lại** `@synaptek/learning-path` (heatmap/mastery) trên tập attempts của HS trong lớp. UI thêm
luồng GV (lớp/roster/soạn bài/chấm/nhận xét/phân tích) + chỗ HS thấy "bài được giao" & kết quả. Ghi
Decision Log **D22** (vai trò), **D23** (mô hình lớp/bài/nộp + audit điểm), **D24** (RLS chéo vai trò +
chấm chính thức server-side qua answer-keys đồng bộ `_shared`).

## Technical Context

**Language/Version**: TypeScript. Node ≥ 22 (package/lib test qua `node --experimental-strip-types`),
React 19.2 / RN 0.85 (app), Deno (Edge Function).
**Primary Dependencies**: có sẵn — Expo SDK 56 + Expo Router, `@synaptek/grading-engine`,
`@synaptek/curriculum`, `@synaptek/learning-path`, NativeWind v4, `@supabase/supabase-js`, TanStack Query.
**Mới**: `@synaptek/classroom` (TS thuần, zero-dep). Không thêm dependency runtime mới.
**Storage**: Supabase Postgres. **Migration mới `0003_m3_classroom.sql`**: `profiles.role` (enum/text),
`classes`, `class_members`, `assignments`, `submissions` + **RLS chéo vai trò** + helper `SECURITY DEFINER`

- grants. M1=`0001`, M2=`0002` **không đổi**. Đề + đáp án vẫn ở `content/` (D6); answer-keys cho chấm
  server đồng bộ vào `supabase/functions/_shared` (D13).
  **Testing**: `node --experimental-strip-types` cho `@synaptek/classroom` (TDD) + `apps/app/src/lib/*`
  (view-model thuần). **RLS test** = script SQL/integration chạy trên Supabase local (chèn 2 GV + HS chéo
  lớp → khẳng định cô lập). Edge Function chấm: Deno test logic (fake) + verify live local. Playwright web
  e2e: luồng GV (guest-feasible phần nào; phần auth-gated như M1/M2). **Regression**: engine test giữ xanh.
  **Target Platform**: Web (ra trước) + iOS/Android sau — universal.
  **Project Type**: Mobile/web universal (Expo) + serverless (Supabase Edge Functions).
  **Performance Goals**: truy vấn roster/assignment/submission có index; phân tích lớp tổng hợp theo lô;
  chấm 1 bài nộp < vài trăm ms (engine thuần).
  **Constraints**: **đáp án không rời server** (D4); **RLS 0 rò rỉ chéo** (SC-002/007); audit điểm (giữ
  auto+final); không phá M1/M2 (FR-021); chữ Việt có dấu; vùng chạm ≥ 48px.
  **Scale/Scope**: vài lớp/GV, vài chục HS/lớp; bài tập vài–vài chục câu từ `content/` hiện có.

## Constitution Check

_GATE: phải qua trước Phase 0; tái kiểm sau Phase 1._

- **I. Engine là moat** — M3 **không** đụng `grading-engine`; chấm chính thức **dùng lại** engine y nguyên
  ở Edge Function (consumer #2 thật sự, thay stub M0). ✅
- **II. Một nguồn-sự-thật** — đề/đáp án vẫn ở `content/` (D6); DB chỉ tham chiếu `questionId`. Answer-keys
  cho chấm server là **artifact tự sinh** từ `content/` (đồng bộ `_shared`), không nhập tay. Trạng thái
  lớp/bài/nộp là dữ liệu quan hệ tối thiểu; spec/plan trỏ số D. ✅
- **III. Test-first** — `@synaptek/classroom` (mã mời/hạn nộp/điểm hợp lệ/tổng hợp lớp) viết test trước;
  **RLS có bộ test cô lập** (phần "khó" của M3 là RLS, phải kiểm như code). ✅
- **IV. Milestone-gated, luôn chạy được** — 3 user story P1/P2/P3 độc lập; P1 (lớp+roster) là MVP vai trò
  GV; mỗi US một PR, repo luôn chạy + CI xanh. ✅
- **V. Vừa-đủ** — `@synaptek/classroom` có ≥ 2 consumer (app client + edge cho hạn nộp/điểm hợp lệ) → tách
  package đúng D5; answer-keys đồng bộ `_shared` đúng D13. Không thêm server/app mới. Migration chỉ thêm
  bảng thật sự cần. RLS dùng helper `SECURITY DEFINER` (tối thiểu) thay vì view/columns thừa. ✅

→ **PASS — không vi phạm.** (Chi tiết kỹ thuật ở `research.md`.)

## Project Structure

### Documentation (this feature)

```text
specs/003-teacher-classroom/
├── spec.md              # WHAT/WHY (đã có; đã clarify)
├── plan.md              # file này
├── research.md          # Phase 0 — quyết định kỹ thuật (vai trò, RLS chống đệ quy, chấm server, answer-keys)
├── data-model.md        # Phase 1 — entities + migration 0003 + RLS
├── contracts/
│   ├── db-schema-0003.md       # bảng + RLS + helper SECURITY DEFINER + grants — GATE storage
│   ├── grade-assignment.md     # hợp đồng Edge Function chấm chính thức (ẩn đáp án, audit)
│   └── classroom-api.md        # API công khai @synaptek/classroom (mã mời/hạn nộp/điểm/tổng hợp)
├── quickstart.md        # Phase 1 — cách chạy & nghiệm thu (gồm kịch bản kiểm RLS)
└── tasks.md             # Phase 2 — (CHƯA tạo; bước /tasks)
```

### Source Code (repository root)

```text
packages/
├── grading-engine/      # có sẵn — KHÔNG đụng (chỉ dùng lại)
├── curriculum/          # có sẵn — dùng lại (chọn câu cho bài tập)
├── learning-path/       # có sẵn — dùng lại heatmap/mastery cho phân tích lớp
└── classroom/           # MỚI @synaptek/classroom (TS thuần, zero-dep, raw .ts)
    ├── src/
    │   ├── index.ts
    │   ├── invite.ts         # sinh mã mời khó đoán (từ seed inject) + validate/định dạng + hết hạn
    │   ├── grading-policy.ts # quy tắc hạn nộp (đúng hạn/trễ), điểm ghi đè hợp lệ [0,1], gộp điểm bài
    │   └── analytics.ts      # tổng hợp phân tích lớp từ attempts (dùng lại learning-path heatmap)
    └── tests/

apps/app/src/
├── app/
│   ├── (teacher)/                 # nhóm route GV (guard role=teacher)
│   │   ├── classes.tsx            # danh sách lớp + tạo lớp
│   │   ├── class/[id].tsx         # roster + mã mời + danh sách bài + phân tích
│   │   ├── assignment/new.tsx     # soạn bài (chọn câu từ content + hạn)
│   │   └── submission/[id].tsx    # xem bài nộp → ghi đè điểm + nhận xét
│   ├── join.tsx                   # HS nhập mã mời vào lớp
│   ├── assignments.tsx            # HS xem bài được giao
│   └── assignment/[id].tsx        # HS làm + nộp bài (chấm server-side)
├── lib/
│   ├── classroom.ts               # view-model thuần (gọi @synaptek/classroom)
│   └── supabase/{classes,assignments,submissions,role}.ts  # query/mutation TanStack
├── components/teacher/…           # UI nhóm theo feature, bám tokens (anti-template)
└── tests/{unit,e2e}

content/                            # đề/đáp án (D6) — KHÔNG đổi cấu trúc; answer-keys suy ra khi sync
supabase/
├── migrations/0003_m3_classroom.sql   # MỚI — profiles.role + classes/class_members/assignments/submissions + RLS
└── functions/
    ├── _shared/
    │   ├── grading-engine.ts          # có sẵn
    │   ├── learning-path/             # có sẵn (US3)
    │   └── answer-keys.ts             # MỚI — tự sinh từ content/questions (đáp án cho chấm server, D13)
    └── grade-assignment/index.ts      # MỚI — chấm chính thức 1 bài nộp; ẩn đáp án; ghi auto_score
```

**Structure Decision**: Giữ monorepo; thêm **một** package thuần `@synaptek/classroom` (logic mã mời/hạn
nộp/điểm/tổng hợp — ≥2 consumer). Đề/đáp án vẫn ở `content/` (D6); **answer-keys** cho chấm server là
artifact tự sinh, đồng bộ vào `_shared` qua `scripts/sync-edge-engine.mjs` mở rộng (D13) — KHÔNG nhập tay,
KHÔNG nhồi đáp án vào DB. **RLS** là trọng tâm: dùng helper `SECURITY DEFINER` (`owns_class`, `is_member`)
để biểu diễn quan hệ chéo bảng **không đệ quy**. Edge Function `grade-assignment` chấm chính thức (ẩn đáp
án — D4) + ghi `submissions.auto_score`. View-model `apps/app/src/lib/*` thuần.

## Complexity Tracking

> Không có vi phạm Constitution cần biện minh.

| Quyết định                        | Vì sao cần                                                                                    | Phương án đơn giản hơn bị loại vì                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Package `@synaptek/classroom`     | Mã mời/hạn nộp/điểm hợp lệ cần ở **cả** client (UX tức thì) lẫn edge (đáng tin) → ≥2 consumer | Nhồi vào `apps/app/lib` → edge không dùng lại; khó test cô lập (D5)                     |
| Helper `SECURITY DEFINER` cho RLS | Quan hệ chéo bảng (GV↔lớp↔HS) gây **đệ quy RLS** nếu policy tham chiếu bảng khác trực tiếp    | Policy tự tham chiếu chéo → đệ quy/ô nhiễm; tắt RLS rồi lọc ở app → rò rỉ (trái SC-002) |
| Answer-keys đồng bộ `_shared`     | Edge chỉ mount `supabase/functions` (D13); chấm cần đáp án nhưng đáp án **không** vào client  | Nhồi đáp án vào DB → trùng nguồn (trái D6); gửi đáp án ra client → lộ (trái D4)         |
| Edge Function `grade-assignment`  | Chấm chính thức **phải** server-side để ẩn đáp án + điểm đáng tin (D4)                        | Chấm ở client cho bài tập → HS xem/sửa được đáp án/điểm                                 |

```

```
