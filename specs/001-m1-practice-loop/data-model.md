# Data Model — M1 Vòng luyện tập học sinh (Phase 1)

Hai nhóm: **(A) Nội dung** (JSON ground-truth, D6 — schema đầy đủ ở [contracts/content-schema.md](./contracts/content-schema.md))
và **(B) Dữ liệu người dùng** (Supabase, đã có ở `0001_init.sql`). Thực thể runtime (session) sống ở
`apps/app/lib/*` (thuần).

## A. Nội dung (content/) — quản lý bởi `@synaptek/curriculum`

### Curriculum graph

- **Grade**: `{ grade: 1..5, strands: Strand[] }`. File `content/curriculum/grade-<n>.json`.
- **Strand (mạch)**: `{ id, name, topics: Topic[] }`. Vd Số và phép tính / Hình học và đo lường.
- **Topic (chủ đề)**: `{ id, name, grade, skillIds: string[] }`. Đơn vị HS chọn để luyện.
- **Skill (kỹ năng / yêu cầu cần đạt)**: `{ id, name, description?, prerequisites: string[] }`. **Đơn vị
  mastery nguyên tử** (M2 dùng). Câu hỏi gắn vào `skillId`.
- **Quan hệ**: Grade 1—n Strand 1—n Topic; Topic n—n Skill; Skill →(prerequisites)→ Skill (DAG, đa lớp
  để hỗ trợ ôn lớp dưới — D15).
- **ID quy ước**: namespaced, vd `g4`, `g4.num` (strand), `g4.num.fractions` (topic),
  `g4.num.fractions.compare` (skill).

### Question (ngân hàng câu hỏi)

File `content/questions/<topicId>.json` = mảng Question. Trường chính (schema đầy đủ ở contracts):
`{ id, skillId, grade, type, prompt, choices?, correct, options?, explanation }`.

- **Bất biến**: mỗi Question MUST map thẳng sang **`GradeInput`** của `@synaptek/grading-engine`
  (`type`/`correct`/`options`) → chấm không cần adapter.
- **Validation** (`@synaptek/curriculum`): `id` duy nhất; `skillId` tồn tại trong curriculum; `type` hợp
  lệ; `choices` bắt buộc khi `type=mcq`; `correct` không rỗng; `explanation` không rỗng.

## B. Dữ liệu người dùng (Supabase — `0001_init.sql`, KHÔNG migration mới)

| Bảng            | Dùng ở M1                                                                                                   | RLS              |
| --------------- | ----------------------------------------------------------------------------------------------------------- | ---------------- |
| `profiles`      | hồ sơ HS (id, role=student, full_name, grade_level) — tạo tự động khi đăng ký                               | đọc/sửa của mình |
| `attempts`      | mỗi lần trả lời: `student_id, question_id, skill_id, answer(jsonb), is_correct, score, created_at`          | đọc/ghi của mình |
| `skill_mastery` | **M1 KHÔNG ghi** — tiến độ derive thuần từ `attempts` (T029); ghi `skill_mastery`/`mastery` dời sang **M2** | đọc/ghi của mình |

> M1 **không** thêm bảng/migration. "Tiến độ theo chủ đề" được **gộp ở client** (`lib/progress.ts`) từ
> `attempts` (+ map question→topic qua curriculum). Có thể tối ưu bằng view/materialized ở M2 nếu cần.

## C. Thực thể runtime (apps/app/lib — thuần, không DB)

- **PracticeSession** (`lib/session.ts`, reducer thuần):
  `{ topicId, questions: Question[], index, answers: Record<qid, {answer, result}>, status }`.
  - **Chuyển trạng thái**: `start(topic)` → `answer(input)` (gọi `grade()` → lưu result + tạo Attempt) →
    `next()` → … → `finish()` (tính tổng: đúng/tổng, điểm, danh sách sai).
  - Thuần → test Vitest không cần render; side-effect (lưu attempt) do tầng trên (TanStack mutation) thực thi.
- **SessionResult**: `{ total, correct, score, wrong: Question[] }` — đầu vào màn `result`.
- **TopicProgress** (`lib/progress.ts`): `{ topicId, attempted, correct }` — derive từ attempts.

## Luồng dữ liệu (P1 → P2)

```
content JSON ──load+validate(@synaptek/curriculum)──▶ Question[]
   │
PracticeSession.answer(input) ──grade()(@synaptek/grading-engine)──▶ {isCorrect,score,feedbackCode}
   │                                                                   │
   └─ hiển thị Feedback + explanation (tức thì)        nếu đã đăng nhập │
                                                       ▼
                                   Attempt ──TanStack mutation──▶ Supabase attempts (RLS của mình)
                                                       ▼
                              lib/progress.ts gộp attempts ──▶ TopicProgress (màn progress)
```
