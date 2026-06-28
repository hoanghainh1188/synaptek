# Implementation Plan: M4 — Phụ huynh (liên kết & theo dõi con)

**Branch**: `005-parent-monitoring` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

## Summary

Mở vai trò **phụ huynh** (read-only) mà **không** đụng moat và **không** đổi M1–M3. Lõi M4 là **một quan
hệ + RLS đọc chéo PH→con** (giống cấu trúc M3 nhưng đơn giản hơn: chỉ đọc, không ghi). Tái dùng tối đa:
mã liên kết = `@synaptek/classroom` invite (đã có); tổng hợp theo dõi = `@synaptek/learning-path`
(skillWeakness/mastery, đã có). **Không thêm package mới, không Edge Function mới.** Phần việc chính:
**migration `0005`** (parent_links + `profiles.parent_link_code` + RLS + helper `is_parent_of` + RPC
`link_parent_by_code`) + **hook/UI** app (PH liên kết, danh sách con, bảng theo dõi; HS tạo mã). Ghi
Decision Log **D26**.

## Technical Context

**Language/Version**: TypeScript; Node ≥ 22; React 19 / RN 0.85 (Expo SDK 56); Postgres (Supabase).
**Primary Dependencies**: có sẵn — `@synaptek/classroom`, `@synaptek/learning-path`, `@supabase/supabase-js`,
TanStack Query, NativeWind. **Không** thêm dependency.
**Storage**: **Migration `0005_m4_parent.sql`**: `profiles.parent_link_code` (text unique null) + bảng
`parent_links` + RLS đọc chéo + helper `SECURITY DEFINER` `is_parent_of(student_id)` + RPC
`link_parent_by_code(code)`. M1=`0001`…M4-limits=`0004` **không đổi**.
**Testing**: `node --experimental-strip-types` (logic thuần — chủ yếu tái dùng, ít mới); **RLS test** mở
rộng (PH đọc được con mình, chặn HS khác, không ghi chéo); Playwright e2e (auth-gated): HS tạo mã → PH
nhập → theo dõi. **Regression**: engine + RLS M3 giữ xanh.
**Target Platform**: Web (ra trước) + native sau.
**Constraints**: PH **read-only** (0 quyền ghi chéo — SC-004); RLS 0 rò rỉ (SC-002); không tự liên kết (SC-005).
**Scale/Scope**: vài PH/con; bảng theo dõi/con.

## Constitution Check

- **I. Engine là moat** — M4 không đụng engine. ✅
- **II. Một nguồn-sự-thật** — quan hệ tối thiểu (`parent_links`); mã liên kết tái dùng logic `classroom`;
  theo dõi suy từ dữ liệu sẵn có (mastery/attempts/submissions). ✅
- **III. Test-first** — RLS PH–con có bộ test cô lập (phần "khó" của M4 là RLS đọc chéo). ✅
- **IV. Milestone-gated** — US1 (liên kết) là MVP độc lập; US2 (theo dõi) thêm trên nền. Mỗi US một PR. ✅
- **V. Vừa-đủ** — KHÔNG tạo package/Edge mới; tái dùng `classroom`/`learning-path`; helper `SECURITY
DEFINER` (tối thiểu) như D24. Migration chỉ thêm 1 bảng + 1 cột. ✅

→ **PASS.**

## Project Structure

```text
specs/005-parent-monitoring/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/db-schema-0005.md   # bảng + RLS + helper + RPC + bộ test RLS — GATE storage
└── tasks.md                      # (bước /tasks)

packages/                          # KHÔNG đổi (tái dùng classroom/learning-path)
apps/app/src/
├── app/
│   ├── (parent)/                  # nhóm route PH (guard role=parent)
│   │   ├── children.tsx           # danh sách con + nhập mã liên kết
│   │   └── child/[id].tsx         # bảng theo dõi 1 con (read-only)
│   └── profile.tsx                # HS: tạo/thu hồi mã liên kết; chọn vai trò thêm 'parent'
├── lib/supabase/parent.ts         # hooks: tạo mã (HS) · link/list/unlink (PH) · đọc tiến độ con
└── tests/e2e/parent-monitor.spec.ts   # auth-gated (ngoài CI)

supabase/migrations/0005_m4_parent.sql
supabase/tests/rls-0005.sql        # bộ test RLS PH–con
```

**Structure Decision**: Không package/Edge mới. `parent_links` + helper `is_parent_of` mirror M3
(`teaches_student`). PH đọc dữ liệu con qua **policy SELECT bổ sung** trên các bảng đã có
(`profiles`/`attempts`/`skill_mastery`/`gamification_state`/`submissions`) gated bởi `is_parent_of` —
**chỉ SELECT, không ghi** (đảm bảo read-only). Liên kết qua RPC `link_parent_by_code` (security definer,
chống tự-liên-kết + không lộ bảng profiles). UI nhóm theo vai trò `(parent)/`.

## Complexity Tracking

> Không vi phạm Constitution.

| Quyết định                                  | Vì sao                                                      | Phương án loại                                                       |
| ------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Helper `is_parent_of` SECURITY DEFINER      | RLS đọc chéo PH→con không đệ quy (như D24)                  | policy tham chiếu chéo trực tiếp → đệ quy; tắt RLS + lọc app → rò rỉ |
| Mã trên `profiles.parent_link_code`         | Mã "thuộc" con; HS tự đặt qua update own profile (RLS 0001) | bảng mã riêng (thừa cho 1 mã/HS)                                     |
| Chỉ thêm policy SELECT (không write) cho PH | PH read-only (SC-004/FR-008)                                | cấp write chéo → trái yêu cầu                                        |
| Tái dùng classroom/learning-path            | Mã mời + heatmap đã có, test sẵn (D5)                       | viết lại → trùng lặp                                                 |
