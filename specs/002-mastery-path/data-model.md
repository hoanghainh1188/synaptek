# Data Model — M2 Mastery & Lộ trình (Phase 1)

Nguồn: spec §Key Entities + `research.md` R1/R5/R6/R7. Trạng thái **tối thiểu** — ưu tiên _suy ra_ hơn
_lưu trùng_ (Constitution II). Phần "đầu vào" tái dùng M1; phần "mới" ở migration `0002`.

## 1. Đầu vào (tái dùng M1 — không đổi)

### Attempt (`attempts`, đã có ở `0001`)

`{ id, student_id, question_id, skill_id, answer, is_correct, score, created_at }`.

- M2 **đọc** để: cập nhật BKT (theo `skill_id` + `is_correct` + thứ tự `created_at`); suy heatmap (dạng
  lỗi theo `skill_id` + loại câu tra từ `question_id`).
- Không đổi schema.

### Skill graph (`@synaptek/curriculum`, content JSON — D6)

`Grade → Strand → Topic → Skill{ id, name, prerequisites[] }`. DAG tiên quyết. M2 **đọc** để gate lộ
trình. Không sửa nội dung.

### Question (`@synaptek/curriculum`) — **THÊM trường tùy chọn**

- Thêm `difficulty?: 1 | 2 | 3` (1=dễ, 2=vừa, 3=khó). **Tùy chọn** — câu hiện có không bắt buộc.
- `validateQuestion`: nếu có `difficulty` phải ∈ {1,2,3}; vắng → hợp lệ.
- Helper `difficultyOf(q): 1|2|3 = q.difficulty ?? byType(q.type)` với `byType`: mcq→1, true-false→1,
  numeric→2, fraction→2, expression→3, fill-blank→3.

## 2. Mastery (tái dùng `skill_mastery`, đã có ở `0001` — KHÔNG đổi cột)

`skill_mastery { student_id, skill_id, mastery numeric(4,3), attempts_count int, last_reviewed timestamptz,
due_at timestamptz, PK(student_id, skill_id) }`.

| Trường           | M2 dùng                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `mastery`        | **P(L) của BKT** (đơn vị mastery). Cập nhật sau mỗi attempt qua `updateMastery`. |
| `attempts_count` | số lần luyện kỹ năng (đã có ở M1; M2 tiếp tục tăng).                             |
| `last_reviewed`  | mốc ôn gần nhất (UTC) — đầu vào `nextDueAt`.                                     |
| `due_at`         | **hạn ôn kế tiếp** do `nextDueAt` đặt. Recommender + job nền đọc.                |

- **Khởi tạo**: sau chẩn đoán, upsert một dòng/kỹ năng được chạm với `mastery=initFromDiagnostic(...)`.
- **Guest**: tính trong bộ nhớ, **chỉ upsert sau khi đăng nhập** (như M1 attempts).
- **Bất biến**: `mastery ∈ [0,1]`; cập nhật **tất định** với cùng lịch sử.

## 3. Mới — migration `0002_m2_mastery.sql` (gamification + push + nhắc)

> Khác M1 (M1 không có migration). RLS "của mình" + grants `authenticated` (mirror `0001`). Job nền chạy
> bằng **service role** (bỏ qua RLS) để đọc xuyên HS.

### gamification_state (1 dòng / học sinh)

| Cột                 | Kiểu                                                   | Ghi chú                                     |
| ------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `student_id`        | uuid PK → `profiles(id)` cascade, default `auth.uid()` |                                             |
| `total_xp`          | int not null default 0, check ≥ 0                      | cộng dồn `xpForAttempt`                     |
| `current_streak`    | int not null default 0, check ≥ 0                      | chuỗi ngày (mốc VN)                         |
| `longest_streak`    | int not null default 0, check ≥ 0                      | kỷ lục                                      |
| `last_practiced_on` | date                                                   | **ngày VN** luyện gần nhất (so sánh streak) |
| `updated_at`        | timestamptz not null default now()                     |                                             |

### student_badges (học sinh × huy hiệu)

| Cột          | Kiểu                                                | Ghi chú                                         |
| ------------ | --------------------------------------------------- | ----------------------------------------------- |
| `student_id` | uuid → `profiles(id)` cascade, default `auth.uid()` |                                                 |
| `badge_id`   | text not null                                       | trỏ id trong `content/gamification/badges.json` |
| `earned_at`  | timestamptz not null default now()                  |                                                 |
|              | PK `(student_id, badge_id)`                         | mở **đúng một lần** (idempotent)                |

### push_tokens (học sinh × thiết bị)

| Cột          | Kiểu                                                | Ghi chú                        |
| ------------ | --------------------------------------------------- | ------------------------------ |
| `student_id` | uuid → `profiles(id)` cascade, default `auth.uid()` |                                |
| `token`      | text not null                                       | Expo push token                |
| `platform`   | text check in ('ios','android','web')               |                                |
| `enabled`    | boolean not null default true                       | tắt thông báo → false (FR-019) |
| `created_at` | timestamptz not null default now()                  |                                |
|              | PK `(student_id, token)`                            |                                |

### review_reminders (idempotency nhắc — SC-006)

| Cột          | Kiểu                               | Ghi chú                                                |
| ------------ | ---------------------------------- | ------------------------------------------------------ |
| `student_id` | uuid → `profiles(id)` cascade      |                                                        |
| `due_date`   | date not null                      | **ngày VN** của chu kỳ nhắc                            |
| `created_at` | timestamptz not null default now() |                                                        |
| `pushed_at`  | timestamptz                        | mốc đã gửi push (null = chưa/không gửi được)           |
|              | PK `(student_id, due_date)`        | job nền `insert … on conflict do nothing` → idempotent |

## 4. Suy ra (KHÔNG lưu)

- **Lộ trình (Learning path)**: `recommendNext(skills, masteryMap, {now, dueMap})` → danh sách `{skillId,
reason: 'due'|'new'|'weak', priority}`. Suy mỗi lần mở trang chủ; không bảng riêng.
- **Heatmap cell**: `skillWeakness(attempts, skills, masteryMap)` + `commonErrorType(...)` → suy từ
  `attempts` + `skill_mastery`. Không lưu.

## 5. Định nghĩa huy hiệu (content — D6, versioned)

`content/gamification/badges.json`: mảng `Badge { id, name, desc, icon, criteria }`.
`criteria` (union, evaluator hiểu): `{type:'streak', gte}` · `{type:'xp', gte}` · `{type:'skill_mastered',
skillId}` · `{type:'topic_mastered', topicId}` · `{type:'correct_count', gte}`. Validate bằng schema của
`@synaptek/learning-path` (gate như content M1). Bộ khởi đầu ~6–8 mốc (vd: streak 3/7; xp 100/500; thành
thạo "Phân số"; 100 câu đúng).

## 6. Trạng thái & dòng dữ liệu (tổng hợp)

```
attempt (M1) ──┬─► updateMastery(BKT) ──► skill_mastery.mastery ──► nextDueAt ──► due_at
               │                                                   │
               ├─► xpForAttempt ──► gamification_state.total_xp     └─► recommendNext ─► Lộ trình (UI)
               ├─► updateStreak ──► current/longest_streak, last_practiced_on
               └─► (gộp) ──► skillWeakness/commonErrorType ──► Heatmap (UI)

evaluateBadges(state, masteryMap, badges.json) ──► student_badges (mới đạt → mở 1 lần)

[cron] review-scheduler: skill_mastery.due_at ≤ now ─► review_reminders (insert idempotent) ─► push (best-effort)
```
