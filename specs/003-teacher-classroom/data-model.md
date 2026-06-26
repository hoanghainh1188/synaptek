# Data Model — M3 Giáo viên (Phase 1)

Nguồn: spec §Key Entities + `research.md` R1–R6. Trạng thái **tối thiểu**, chuẩn hóa quan hệ; đề/đáp án
vẫn ở `content/` (D6). Phần "đầu vào" tái dùng M1/M2; phần "mới" ở migration `0003`.

## 1. Đầu vào (tái dùng — không đổi)

- **`content/` (D6)**: đề + đáp án ground-truth. M3 tham chiếu `questionId`; answer-keys cho chấm server
  **suy ra** (sync `_shared`), không sửa content.
- **`attempts` / `skill_mastery` (0001/0002)**: dùng cho phân tích lớp (mastery/heatmap của learning-path).
  **Không** nới RLS `attempts` (R6) — phân tích từ `submissions` + `skill_mastery` của HS trong lớp.
- **`profiles` (0001)**: **THÊM cột** `role` (xem mục 3).

## 2. Suy ra (KHÔNG lưu)

- **Nộp trễ (`late`)**: suy từ `submitted_at > assignments.due_at`. Không lưu cờ riêng.
- **Phân tích lớp**: tổng hợp điểm yếu/tiến độ suy từ `submissions` + `skill_mastery` của HS trong lớp
  (`@synaptek/classroom/analytics.ts` + `@synaptek/learning-path`). Không bảng riêng.
- **Mã hợp lệ**: kiểm `invite_code` tồn tại ∧ `invite_expires_at` null/tương lai — suy lúc join (RPC).

## 3. Mới — migration `0003_m3_classroom.sql`

> RLS chéo vai trò qua helper `SECURITY DEFINER` (chống đệ quy — R3). SQL đầy đủ ở
> `contracts/db-schema-0003.md`. M1=`0001`, M2=`0002` **không đổi**.

### profiles (mở rộng)

| Cột    | Kiểu                                                                 | Ghi chú                        |
| ------ | -------------------------------------------------------------------- | ------------------------------ |
| `role` | text not null default `'student'` check in (`'student'`,`'teacher'`) | tự chọn (D22); đổi trong hồ sơ |

### classes (lớp — chủ sở hữu = GV)

| Cột                 | Kiểu                                                         | Ghi chú                                        |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| `id`                | uuid PK default `gen_random_uuid()`                          |                                                |
| `owner_teacher_id`  | uuid not null → `profiles(id)` cascade, default `auth.uid()` | GV sở hữu                                      |
| `name`              | text not null                                                |                                                |
| `invite_code`       | text not null unique                                         | khó đoán (sinh ở classroom)                    |
| `invite_expires_at` | timestamptz                                                  | null = không hạn; thu hồi = đổi mã/đặt quá khứ |
| `created_at`        | timestamptz not null default now()                           |                                                |

### class_members (HS × lớp — HS thuộc nhiều lớp)

| Cột          | Kiểu                                   | Ghi chú |
| ------------ | -------------------------------------- | ------- |
| `class_id`   | uuid not null → `classes(id)` cascade  |         |
| `student_id` | uuid not null → `profiles(id)` cascade |         |
| `joined_at`  | timestamptz not null default now()     |         |
|              | **PK `(class_id, student_id)`**        |         |

### assignments (bài tập)

| Cột            | Kiểu                                    | Ghi chú                      |
| -------------- | --------------------------------------- | ---------------------------- |
| `id`           | uuid PK default `gen_random_uuid()`     |                              |
| `class_id`     | uuid not null → `classes(id)` cascade   |                              |
| `title`        | text not null                           |                              |
| `question_ids` | text[] not null check (cardinality ≥ 1) | trỏ `content/questions` (D6) |
| `due_at`       | timestamptz                             | null = không hạn             |
| `created_at`   | timestamptz not null default now()      |                              |

### submissions (bài nộp — audit điểm)

| Cột             | Kiểu                                                         | Ghi chú                              |
| --------------- | ------------------------------------------------------------ | ------------------------------------ |
| `id`            | uuid PK default `gen_random_uuid()`                          |                                      |
| `assignment_id` | uuid not null → `assignments(id)` cascade                    |                                      |
| `student_id`    | uuid not null → `profiles(id)` cascade, default `auth.uid()` |                                      |
| `answers`       | jsonb not null                                               | `{ questionId: answer }` (đáp án HS) |
| `auto_score`    | numeric(4,3)                                                 | máy chấm (server ghi, service-role)  |
| `final_score`   | numeric(4,3)                                                 | GV ghi đè (null = dùng auto)         |
| `is_override`   | boolean not null default false                               | GV đã ghi đè?                        |
| `feedback`      | text                                                         | nhận xét GV                          |
| `submitted_at`  | timestamptz not null default now()                           | so `due_at` → suy `late`             |
| `graded_at`     | timestamptz                                                  | mốc chấm auto                        |
|                 | **unique `(assignment_id, student_id)`**                     | 1 bài nộp/HS; nộp lại = update       |

- **Điểm hiển thị** = `final_score ?? auto_score`. **Bất biến**: `score ∈ [0,1]`; `is_override ⇒ final_score not null`.

## 4. Helper RLS (`SECURITY DEFINER`) + RPC

- `public.owns_class(cid uuid) → boolean` — GV sở hữu lớp `cid`.
- `public.is_member(cid uuid) → boolean` — HS hiện tại là thành viên lớp `cid`.
- `public.join_class_by_code(code text) → uuid` — kiểm mã hợp lệ → thêm thành viên → trả `class_id`.

(Chi tiết SQL + policy: `contracts/db-schema-0003.md`.)

## 5. Dòng dữ liệu (tổng hợp)

```
GV (role=teacher) ─► classes (owns) ─► assignments (question_ids → content/)
HS ─ join_class_by_code(code) ─► class_members
HS làm bài ─► [Edge grade-assignment]: answer-keys(_shared) + engine ─► submissions.auto_score (đáp án KHÔNG ra client)
GV ─► submissions.final_score/feedback/is_override (audit: auto giữ nguyên)
GV phân tích lớp ◄─ submissions + skill_mastery (HS trong lớp) ◄─ classroom/analytics + learning-path heatmap
RLS: owns_class / is_member gate mọi đọc/ghi (0 rò rỉ chéo — SC-002/007)
```
