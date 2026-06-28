# Tasks: M4 — Phụ huynh (liên kết & theo dõi con)

**Input**: `specs/005-parent-monitoring/` (plan, spec, research, data-model, contracts).
**Tests**: RLS có bộ test cô lập (phần khó M4). Logic thuần **tái dùng** (classroom/learning-path) — không
package mới. Playwright e2e auth-gated (ngoài CI). Regression: engine + RLS M3 giữ xanh.

## Format: `[ID] [P?] [Story] Mô tả` · [P] = song song được.

---

## Phase 1: Foundational (BLOCKING — storage + RLS)

- [ ] T001 Tạo migration `supabase/migrations/0005_m4_parent.sql` theo `contracts/db-schema-0005.md`
      §1–6 đầy đủ: `profiles.parent_link_code` (unique) · bảng `parent_links` (PK + check self) + index ·
      helper `is_parent_of` (SECURITY DEFINER) · RPC `link_parent_by_code` (chống self) · RLS (parent_links
      select/delete; **chỉ SELECT** child trên profiles/attempts/skill_mastery/gamification_state/submissions)
      · grant. M1–M4limits KHÔNG đổi.
- [ ] T002 Trigger `handle_new_user`: mở rộng nhận `role='parent'` từ metadata đăng ký (hiện chỉ teacher/student).
- [ ] T003 Áp local: `supabase db reset` (0001–0005 sạch); kiểm bảng/policy/hàm tồn tại.
- [ ] T004 [P] Bộ test RLS `supabase/tests/rls-0005.sql` theo `contracts §7` (PH đọc con mình; chặn HS/PH khác;
      chặn ghi chéo; không tự-liên-kết; HS thấy/gỡ liên kết). Chạy local **xanh**.

**Checkpoint**: migration sạch; RLS 0005 xanh (gate bảo mật M4). RLS M3 (0003) vẫn xanh.

---

## Phase 2: US1 — Liên kết PH–con (P1) 🎯 MVP

- [ ] T005 [US1] `apps/app/src/lib/supabase/parent.ts`: HS tạo/thu hồi `parent_link_code` (qua
      `@synaptek/classroom` makeInviteCode; update own profile); PH `linkByCode` (RPC), `useMyChildren`
      (list qua parent_links + profiles), `unlink`. Guest → no-op/[].
- [ ] T006 [US1] AuthForm + auth.signUp: thêm lựa chọn vai trò **Phụ huynh** (student/teacher/parent).
- [ ] T007 [US1] `profile.tsx` (HS): khối "Mã liên kết phụ huynh" — tạo/hiển thị/thu hồi mã; danh sách PH
      đang theo dõi + gỡ. Đổi vai trò thêm 'parent'.
- [ ] T008 [US1] Route PH `apps/app/src/app/(parent)/children.tsx`: nhập mã liên kết + danh sách "Con của
      tôi" + gỡ. Guard `role=parent`.
- [ ] T009 [US1] Trang chủ + profile: lối vào theo vai trò PH ("Con của tôi" → /children).
- [ ] T010 [US1] E2E `apps/app/tests/e2e/parent-link.spec.ts` (auth-gated): HS tạo mã → PH nhập → con hiện;
      người ngoài không thấy.

**Checkpoint US1**: PH liên kết được con (MVP vai trò PH). RLS cô lập (T004).

---

## Phase 3: US2 — Theo dõi tiến độ con (P2)

- [ ] T011 [US2] `lib/supabase/parent.ts` (tiếp): đọc tiến độ 1 con (RLS-gated): `skill_mastery`→mastery map,
      `gamification_state` (XP/streak), đếm `attempts`, `submissions` (điểm cuối qua `displayScore`).
- [ ] T012 [US2] Route PH `apps/app/src/app/(parent)/child/[id].tsx`: bảng theo dõi read-only — điểm yếu
      (`@synaptek/learning-path` skillWeakness) + XP/streak + tổng quan luyện tập + kết quả bài. Trạng thái rỗng.
- [ ] T013 [US2] Từ "Con của tôi" → chạm con → mở bảng theo dõi.
- [ ] T014 [US2] E2E `apps/app/tests/e2e/parent-monitor.spec.ts` (auth-gated): con có dữ liệu → PH thấy
      điểm yếu/XP; PH không thấy HS khác.

**Checkpoint US2**: PH theo dõi con đầy đủ (read-only) → đủ 3 vai trò.

---

## Phase 4: Polish

- [ ] T015 [P] `npm run format` + `npm test` toàn workspace xanh (regression engine — FR-012).
- [ ] T016 [P] RLS M3 (`rls-0003.sql`) + M4 (`rls-0005.sql`) chạy local xanh; `expo export` web xanh.
- [ ] T017 [P] Trạng thái rỗng + edge: con chưa có dữ liệu, mã sai/thu hồi, guest/role khác chặn route PH.
- [ ] T018 Cập nhật `docs/WORKING-NOTES.md` + `docs/02-roadmap.md` (M4 trạng thái) + `docs/FEATURE-MAP.md`
      (PH → đã ship) + xác nhận Decision Log D26 — trong PR đóng M4.

---

## Dependencies

- **Foundational (P1)** chặn tất cả (migration + RLS). **US1** trước **US2** (cần liên kết để theo dõi).
- Trong mỗi US: ưu tiên RLS/test trước, rồi hook → UI → e2e.
- Mỗi US một PR; repo luôn chạy + CI xanh; regression M1–M3 xanh.
