# Research — M4 Phụ huynh (Phase 0)

Quyết định kỹ thuật → Decision Log **D26**.

## R1 — Vai trò PH (→ D22 mở rộng)

- **Quyết định**: dùng `profiles.role='parent'` (đã có ở 0001). Trigger `handle_new_user` (0003) mở rộng
  nhận `'parent'` từ metadata đăng ký (hiện chỉ chấp 'teacher'/'student'). UI chọn vai trò thêm "Phụ huynh".
- **Lý do**: role đã lường trước; quyền PH trên con đến từ **quan hệ** `parent_links`, không từ role (như D22).

## R2 — Liên kết PH–con (→ D26)

- **Quyết định**: **Con tạo mã** (`profiles.parent_link_code`, HS tự đặt qua update own profile — RLS 0001)
  → **PH nhập** qua RPC `link_parent_by_code` (security definer): resolve mã→student, chặn tự-liên-kết,
  insert `parent_links`. Mã sinh bằng `@synaptek/classroom` `makeInviteCode` (tái dùng).
- **Lý do**: con kiểm soát/đồng ý; không lộ bảng `profiles` cho người ngoài (RPC definer); tái dùng pattern
  - logic mã mời (D5). Nhiều–nhiều: PK `(parent_id, student_id)`.
- **Loại bỏ**: PH nhập email con (cần tra email + duyệt — phức tạp); bảng mã riêng (thừa).

## R3 — RLS đọc chéo PH→con, read-only (→ D26, phần khó)

- **Quyết định**: helper `is_parent_of(sid)` `SECURITY DEFINER` (như `teaches_student` của M3) + **thêm
  policy `for select`** vào `profiles/attempts/skill_mastery/gamification_state/submissions` gated bởi
  `is_parent_of`. **KHÔNG** thêm policy ghi cho PH.
- **Lý do**: definer phá đệ quy RLS; chỉ-SELECT đảm bảo PH read-only (SC-004) ở tầng DB (không dựa client).
- **Loại bỏ**: cấp write chéo (trái yêu cầu); policy tham chiếu chéo trực tiếp (đệ quy); lọc ở app (rò rỉ).
- **Kiểm thử**: bộ `rls-0005.sql` (PH1 đọc con mình; chặn HS khác/PH khác; chặn ghi chéo; không tự-liên-kết).

## R4 — Theo dõi (tái dùng)

- **Quyết định**: bảng theo dõi 1 con = đọc `skill_mastery`→`skillWeakness` (learning-path) + `gamification_state`
  (XP/streak) + đếm `attempts` + `submissions` (điểm cuối qua `displayScore` của `@synaptek/classroom`).
  Không thêm logic tổng hợp mới đáng kể (tái dùng).
- **Lý do**: vừa-đủ; mọi tính toán đã có ở package thuần.

## R5 — Regression

- M4 chỉ **thêm** bảng/cột/policy SELECT → không đổi hành vi M1–M3. Engine test + RLS M3 (9 ca) + e2e giữ xanh.

## Tổng hợp Decision Log

- **D26**: **Phụ huynh = read-only qua `parent_links`** (con tạo `parent_link_code` → PH nhập qua RPC
  `link_parent_by_code`, chống tự-liên-kết). RLS đọc chéo PH→con qua helper `is_parent_of` (SECURITY
  DEFINER) + **chỉ policy SELECT** (không ghi). Nhiều–nhiều. Tái dùng `classroom` (mã) + `learning-path`
  (heatmap). Giao-bài-tại-nhà để đợt sau.
