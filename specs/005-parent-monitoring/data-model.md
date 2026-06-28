# Data Model — M4 Phụ huynh (Phase 1)

Trạng thái tối thiểu; read-only chéo PH→con. SQL đầy đủ: `contracts/db-schema-0005.md`.

## 1. Đầu vào (tái dùng — không đổi)

- `profiles` (0001): có `role` (student|teacher|parent). **THÊM** `parent_link_code`.
- `attempts` · `skill_mastery` · `gamification_state` · `submissions`/`assignments` (0001–0004): PH **đọc**
  của con qua RLS bổ sung. Không đổi cột.

## 2. Mới — migration `0005_m4_parent.sql`

### profiles.parent_link_code

| Cột                | Kiểu               | Ghi chú                                                 |
| ------------------ | ------------------ | ------------------------------------------------------- |
| `parent_link_code` | text unique (null) | HS đặt (mã khó đoán) để PH nhập; thu hồi = đặt null/đổi |

### parent_links (PH × con — nhiều–nhiều)

| Cột          | Kiểu                                                               | Ghi chú           |
| ------------ | ------------------------------------------------------------------ | ----------------- |
| `parent_id`  | uuid → `profiles(id)` cascade                                      |                   |
| `student_id` | uuid → `profiles(id)` cascade                                      |                   |
| `linked_at`  | timestamptz default now()                                          |                   |
|              | **PK `(parent_id, student_id)`** · check `parent_id <> student_id` | không tự liên kết |

## 3. Helper RLS + RPC

- `is_parent_of(sid uuid) → boolean` — PH hiện tại có liên kết con `sid`?
- `link_parent_by_code(code text) → uuid` — resolve mã → student, chặn tự-liên-kết, insert link.

## 4. Suy ra (KHÔNG lưu)

- **Bảng theo dõi con**: điểm yếu (`skillWeakness` từ `skill_mastery`), XP/streak (`gamification_state`),
  tổng quan luyện tập (đếm `attempts`), kết quả bài (`submissions` + `displayScore`). Suy mỗi lần xem.

## 5. Dòng dữ liệu

```
HS đặt profiles.parent_link_code (mã từ @synaptek/classroom)
PH ─ link_parent_by_code(code) ─► parent_links (chặn self; nhiều–nhiều)
PH xem con ◄─ [RLS is_parent_of] ── profiles/attempts/skill_mastery/gamification_state/submissions (CHỈ SELECT)
            └─► skillWeakness/displayScore (learning-path/classroom) → bảng theo dõi (read-only)
PH/HS gỡ parent_links (của mình). KHÔNG quyền ghi chéo (SC-004).
```
