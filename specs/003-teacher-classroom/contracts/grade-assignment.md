# Contract — Edge Function `grade-assignment` (chấm chính thức server-side)

Chấm **một bài nộp** của HS cho một assignment. Hiện thực hóa D4: **đáp án không rời server**. Dùng lại
`@synaptek/grading-engine` (moat, consumer #2 thật sự) + **answer-keys tự sinh** từ `content/` (đồng bộ
`_shared`, D13). `verify_jwt = true` (HS phải đăng nhập).

## Kích hoạt

- Client (HS trong lớp) POST khi **nộp bài tập** (US2). Không dùng cho luyện tập tự do (giữ chấm client — FR-011).

## Request / Response

```
POST /functions/v1/grade-assignment
Authorization: Bearer <user JWT>
body: { assignmentId: string, answers: Record<questionId, string | string[]> }

200 → { assignmentId, autoScore: number /*0..1*/, perQuestion: { [questionId]: { isCorrect, feedbackCode } } }
4xx → { error: "not_member" | "unknown_assignment" | "missing_fields" | "no_questions" }
```

- **KHÔNG** trả `correct`/đáp án trong bất kỳ trường nào (kiểm ở SC-003).

## Thuật toán

```
user ← từ JWT (auth.getUser)
assignment ← service-role SELECT assignments WHERE id = assignmentId        // {class_id, question_ids}
if !assignment → 404 unknown_assignment
member ← service-role kiểm class_members(class_id, user.id)                  // R3
if !member → 403 not_member
score Σ = 0, n = 0
for qid in assignment.question_ids:
  key ← ANSWER_KEYS[qid]            // từ _shared/answer-keys.ts (type, correct, tolerance?)
  if !key → bỏ qua (FR-017: câu thiếu, không vỡ) ; tiếp
  r ← grade({ type: key.type, correct: key.correct, answer: answers[qid] ?? "", options:{tolerance} })
  perQuestion[qid] = { isCorrect: r.isCorrect, feedbackCode: r.feedbackCode }   // KHÔNG kèm correct
  Σ += r.score ; n++
autoScore ← n>0 ? Σ/n : 0
service-role UPSERT submissions(assignment_id, student_id=user.id)
  SET answers, auto_score=autoScore, graded_at=now()  ON CONFLICT (assignment_id, student_id) DO UPDATE
return { assignmentId, autoScore, perQuestion }
```

## Bất biến (test)

- **Ẩn đáp án (SC-003)**: payload trả về không chứa đáp án đúng (chỉ isCorrect/feedbackCode/score).
- **Membership (SC-002)**: HS không thuộc lớp → `not_member`, không chấm, không ghi.
- **Bền vững nội dung (FR-017)**: `questionId` thiếu trong answer-keys → bỏ qua câu đó, không lỗi.
- **Audit (FR-012)**: function chỉ ghi `auto_score` (+answers); **không** đụng `final_score`/`feedback`/`is_override` (của GV).
- **Engine bất biến (FR-021)**: chấm dùng engine y nguyên (vd `2/4 ≡ 0,5`); hành vi không đổi M1/M2.

## answer-keys (`_shared/answer-keys.ts` — tự sinh)

- `scripts/sync-edge-engine.mjs` mở rộng: quét `content/questions/*.json` → emit
  `export const ANSWER_KEYS: Record<string, { type, correct, tolerance? }>` (banner AUTO-GENERATED).
- CI gate: `npm run sync:edge` + `git diff --exit-code supabase/functions/_shared` (chống lệch — như engine).
- Lý do: đáp án là nguồn `content/` (D6), edge chỉ mount `functions/` (D13) → artifact tự sinh, không nhồi DB,
  không gửi client.

## config.toml

```toml
[functions.grade-assignment]
verify_jwt = true
```

> `grade` (M0 demo) có thể chuyển sang dùng cùng `ANSWER_KEYS` để bỏ stub — tùy chọn, không bắt buộc M3.
