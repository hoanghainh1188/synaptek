# Implementation Plan: M1 — Vòng luyện tập học sinh

**Branch**: `feature/m1-practice-loop` (Spec Kit feature `001-m1-practice-loop`) | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-m1-practice-loop/spec.md`

## Summary

Dựng vòng luyện tập học sinh end-to-end: chọn chủ đề (lớp 4 + ôn lớp 1–3) → làm từng câu → **chấm tức
thì** bằng `@synaptek/grading-engine` (phía client, low-stakes) + giải thích → kết quả phiên; **auth tối
thiểu** (Supabase email/mật khẩu) lưu `attempts` + tiến độ. Câu hỏi nạp từ **content JSON** (biên soạn
thủ công + import, bundle vào app). Toán render bằng **component tự vẽ** universal. Thêm package thuần
`@synaptek/curriculum` làm **schema authority** cho nội dung; logic phiên/tiến độ tách thành
`apps/app/lib/*` thuần (test trước, Vitest).

## Technical Context

**Language/Version**: TypeScript. Node ≥ 22 (packages/test), React 19 / RN 0.85 (app), Deno (edge — không đụng ở M1).
**Primary Dependencies**: Expo SDK 56 + Expo Router (có sẵn); `@synaptek/grading-engine` (có sẵn, dùng lại);
**mới**: `@synaptek/curriculum` (TS thuần), **NativeWind v4** (styling tokens universal),
`@supabase/supabase-js` (auth + persistence; session lưu bằng AsyncStorage/SecureStore), **TanStack Query** (server state).
**Storage**: Supabase Postgres — `profiles` · `attempts` · `skill_mastery` (đã có ở `supabase/migrations/0001_init.sql`,
**không cần migration mới**). Nội dung = JSON versioned trong `content/` (D6), **bundle vào app** cho M1.
**Testing**: Vitest (`@synaptek/curriculum`, `apps/app/lib/*`), `@testing-library/react-native` (component chính),
Playwright web e2e (luồng luyện tập + auth).
**Target Platform**: Web (ra trước) + iOS/Android (sau) — universal một codebase.
**Project Type**: Mobile/web universal (Expo) + serverless (Supabase).
**Performance Goals**: phản hồi chấm < 200ms (client); INP < 200ms; phiên mặc định ~10 câu.
**Constraints**: chạy được khi mất mạng (chấm client, content bundle); chữ Việt có dấu; vùng chạm lớn (trẻ em); reduced-motion.
**Scale/Scope**: lớp 4 (3 chủ đề) + ít chủ đề lớp 1–3; ~120 câu mẫu; ~6–8 màn.

## Constitution Check

_GATE: phải qua trước Phase 0; tái kiểm sau Phase 1._

- **I. Engine là moat** — M1 **dùng lại** `grading-engine` ở client (không fork, không sửa hành vi chấm). ✅
- **II. Một nguồn-sự-thật** — nội dung là JSON versioned trong `content/`; spec/plan trỏ số D; không chép rationale. ✅
- **III. Test-first** — `@synaptek/curriculum` + `apps/app/lib/*` (session/progress/content) viết test trước (Vitest); engine đã test. ✅
- **IV. Milestone-gated** — M1 là lát cắt chạy được; mỗi user story (P1/P2/P3) độc lập demo. ✅
- **V. Vừa-đủ** — `@synaptek/curriculum` có **2 consumer** (app + tooling validate/import nội dung; sau là `learning-path`/edge) → tách package đúng D5, không đầu cơ. Không thêm app/service mới. ✅

→ **PASS — không vi phạm.** (Phần khó kỹ thuật đã giải ở `research.md`.)

## Project Structure

### Documentation (this feature)

```text
specs/001-m1-practice-loop/
├── spec.md              # WHAT/WHY (đã có)
├── plan.md              # file này
├── research.md          # Phase 0 — quyết định kỹ thuật
├── data-model.md        # Phase 1 — entities + dùng DB
├── contracts/
│   └── content-schema.md# Phase 1 — schema curriculum + câu hỏi (JSON) — GATE content pipeline
├── quickstart.md        # Phase 1 — cách chạy & nghiệm thu
└── tasks.md             # Phase 2 — /speckit-tasks (chưa tạo)
```

### Source Code (repository root)

```text
packages/
├── grading-engine/                 # có sẵn — dùng lại
└── curriculum/                     # MỚI @synaptek/curriculum (TS thuần, zero-dep)
    ├── src/{types,schema,select}.ts
    └── tests/                      # Vitest: validate + traversal + buildSession

content/
├── curriculum/grade-4.json         # cây kiến thức lớp 4 (+ grade-1..3 rút gọn để ôn)
└── questions/<topicId>.json        # ngân hàng câu hỏi (mẫu ~120 câu lớp 4)

apps/app/
├── app/(auth)/login.tsx · (student)/{index,practice/[topicId],result,progress}.tsx
├── lib/                            # view-models THUẦN (Vitest)
│   ├── content.ts                  # nạp + validate content (qua @synaptek/curriculum)
│   ├── session.ts                  # reducer phiên: câu hiện tại, chấm (grading-engine), điểm
│   ├── progress.ts                 # gộp attempts → tiến độ theo chủ đề
│   └── supabase/{client,auth,attempts}.ts
├── components/{practice,math,auth,progress,ui}/…
│   └── math/{FractionView,ExpressionView}.tsx   # render Toán tự vẽ (universal)
├── theme/tokens.ts + tailwind.config.js (NativeWind)
└── tests/{unit (Vitest), e2e (Playwright)}

supabase/                           # đã có; M1 KHÔNG cần migration mới (dùng 0001_init.sql)
```

**Structure Decision**: Giữ monorepo hiện tại; thêm **một** package `@synaptek/curriculum` (schema
authority cho nội dung). Phụ thuộc một chiều `apps/* → packages/*` (D5). Logic nghiệp vụ phiên/tiến độ ở
`apps/app/lib/*` (thuần, test không cần render); UI nhóm theo feature. Nội dung M1 **bundle vào app**
(offline, đơn giản; trade-off ở `research.md`). Không thêm app/service.

## Complexity Tracking

> Không có vi phạm Constitution cần biện minh. `@synaptek/curriculum` thỏa D5 (2 consumer: app + tooling
> validate/import nội dung). Nội dung-bundle-trong-app là lựa chọn có chủ đích cho M1 low-stakes (xem research).
