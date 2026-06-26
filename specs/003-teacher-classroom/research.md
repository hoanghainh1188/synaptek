# Research — M3 Giáo viên (Phase 0)

Quyết định kỹ thuật chốt trước khi thiết kế data-model/contracts. Mỗi mục: **Quyết định · Lý do · Loại bỏ**.
Tóm tắt vào Decision Log **D22–D24** (`docs/00-architecture.md §0`).

## R1 — Vai trò người dùng (→ D22)

- **Quyết định**: Thêm cột `profiles.role text not null default 'student' check (role in ('student','teacher'))`.
  Người dùng **tự chọn** khi đăng ký (hoặc đổi trong hồ sơ). UI/route GV guard theo `role`. (clarify Q1)
- **Lý do**: Tối thiểu, không thêm bảng; `profiles` đã là nơi tự nhiên cho thuộc tính định danh. Self-select
  đủ cho M3 (sản phẩm giáo dục giai đoạn đầu); siết duyệt (mã GV/admin) để M4+.
- **Loại bỏ**: bảng `roles` riêng (thừa cho 2 vai trò); tài khoản GV tách riêng (trùng luồng auth); RBAC
  đầy đủ (quá sớm — vừa-đủ).
- **Lưu ý RLS**: `role` **không** tự cấp quyền chéo HS — quyền GV trên HS đến từ **quan hệ lớp** (sở hữu
  lớp + thành viên), không phải từ `role` chung. `role` chỉ mở **khả năng** tạo lớp.

## R2 — Mô hình lớp / bài tập / bài nộp + audit điểm (→ D23)

- **Quyết định**: 4 bảng ở `0003`:
  - `classes(id, owner_teacher_id, name, invite_code unique, invite_expires_at, created_at)`
  - `class_members(class_id, student_id, joined_at)` PK `(class_id, student_id)` — HS thuộc **nhiều** lớp
  - `assignments(id, class_id, title, question_ids text[], due_at, created_at)` — `question_ids` trỏ `content/` (D6)
  - `submissions(id, assignment_id, student_id, answers jsonb, auto_score numeric, final_score numeric,
is_override boolean default false, feedback text, submitted_at, graded_at)` PK gồm unique
    `(assignment_id, student_id)` (1 bài nộp/HS; nộp lại = update)
- **Lý do**: Chuẩn hóa quan hệ; **audit điểm** = giữ cả `auto_score` (máy chấm) + `final_score`/`is_override`/
  `feedback` (GV) → "điểm đáng tin" (clarify Q3). `question_ids` mảng id (không nhúng đề) giữ D6.
- **Loại bỏ**: nhồi trạng thái vào `profiles`/JSON (khó RLS/truy vấn); bảng `assignment_questions` riêng
  (chuẩn hóa thừa cho danh sách id ngắn — mảng đủ + đơn giản); lưu đề trong DB (trái D6).
- **Hạn nộp / nộp lại** (Edge Cases): **đánh dấu trễ** (không chặn cứng) — `submitted_at` so `due_at` →
  cờ `late` suy ra; **nộp lại = update** bản ghi (lần cuối thắng) để HS sửa trước hạn. Quy tắc thuần ở
  `@synaptek/classroom/grading-policy.ts` (test-first).

## R3 — RLS chéo vai trò chống đệ quy (→ D24, phần khó nhất)

- **Vấn đề**: policy của `classes` cần biết "HS có là thành viên?" (đọc `class_members`); policy của
  `class_members`/`assignments`/`submissions` cần biết "GV có sở hữu lớp?" (đọc `classes`). Tham chiếu chéo
  trong policy → **đệ quy RLS** / lỗi.
- **Quyết định**: Hai helper **`SECURITY DEFINER`** (bỏ qua RLS bên trong, chạy với quyền owner) trong
  schema riêng, dùng trong mọi policy:
  - `public.owns_class(cid uuid) returns boolean` → `exists(select 1 from classes where id=cid and owner_teacher_id=auth.uid())`
  - `public.is_member(cid uuid) returns boolean` → `exists(select 1 from class_members where class_id=cid and student_id=auth.uid())`
  - Đặt `search_path = public`, `stable`, `security definer`; grant execute cho `authenticated`.
- **Chính sách (tóm tắt; chi tiết ở contracts/db-schema-0003.md)**:
  - `classes`: SELECT khi `owns_class(id) or is_member(id)`; INSERT/UPDATE/DELETE chỉ `owner_teacher_id=auth.uid()`
    (và `role=teacher` cho INSERT).
  - `class_members`: SELECT khi `is own row or owns_class(class_id)`; HS tự INSERT (join) row của mình
    **chỉ khi mã hợp lệ** (kiểm ở RPC/Edge, xem R4); GV xóa thành viên lớp mình; HS tự rời (DELETE own).
  - `assignments`: SELECT khi `owns_class(class_id) or is_member(class_id)`; ghi chỉ `owns_class`.
  - `submissions`: SELECT khi `student_id=auth.uid() or owns_class(assignment→class)`; HS INSERT/UPDATE
    own (trước hạn); **GV UPDATE** (điểm/nhận xét) khi sở hữu lớp; `auto_score` chỉ do server (service-role) ghi.
- **Lý do**: `SECURITY DEFINER` là cách Supabase khuyến nghị để phá đệ quy RLS quan hệ. Tập trung logic
  quyền ở 2 hàm nhỏ, test được.
- **Loại bỏ**: policy tham chiếu chéo trực tiếp (đệ quy); tắt RLS + lọc ở app (rò rỉ — trái SC-002); view
  bảo mật (phức tạp hơn helper).
- **Kiểm thử**: script SQL chạy local — tạo GV1/GV2 + HS_A(member lớp GV1)/HS_B(member lớp GV2), khẳng
  định: HS_A không đọc được lớp/bài/điểm của GV2; GV1 không sửa được submission lớp GV2; HS không đọc
  submission của HS khác (SC-002/007). Đây là "test" của phần khó.

## R4 — Tham gia lớp bằng mã (an toàn) (→ D24)

- **Quyết định**: Join qua **RPC `SECURITY DEFINER` `join_class_by_code(code text)`**: kiểm mã tồn tại +
  chưa hết hạn → insert `class_members(class_id, auth.uid())` on conflict do nothing → trả `class_id`.
  Hàm chạy quyền definer nên không cần mở SELECT `classes` theo mã cho người ngoài (tránh dò mã).
- **Lý do**: Không lộ bảng `classes` cho người chưa vào lớp; mã khó đoán (sinh ở `@synaptek/classroom`,
  vd 6–8 ký tự base32 không nhập nhằng). Auto-join (clarify Q4).
- **Loại bỏ**: mở SELECT `classes` theo `invite_code` cho mọi authenticated (dò mã / lộ danh sách lớp);
  duyệt thủ công (clarify chọn auto).

## R5 — Chấm chính thức server-side + answer-keys (→ D24)

- **Quyết định**: Edge Function **`grade-assignment`** (verify_jwt = true — HS đăng nhập): nhận
  `{ assignmentId, answers }`; xác minh HS là thành viên lớp của assignment (qua service-role hoặc RPC);
  tra **đáp án từ answer-keys** (artifact tự sinh từ `content/questions`, đồng bộ `_shared` — D13); chấm
  bằng `@synaptek/grading-engine`; **upsert** `submissions.auto_score` + `answers` (service-role ghi
  auto_score); **trả về điểm, KHÔNG kèm đáp án** (D4). Stub M0 trong `grade/index.ts` được thay bằng
  nguồn answer-keys thật (cùng cơ chế).
- **Lý do**: D4 (đáp án không rời server). Dùng lại engine (moat) y nguyên. Answer-keys sinh từ `content/`
  giữ D6/D13; không trùng nguồn, không nhồi DB.
- **Loại bỏ**: chấm client cho bài tập (lộ đáp án); nhồi đáp án vào DB (trái D6); đọc `content/` trực tiếp
  từ edge (edge không mount `content/` — D13).
- **Mở rộng `scripts/sync-edge-engine.mjs`**: sinh `supabase/functions/_shared/answer-keys.ts`
  (`Record<questionId, { type, correct, tolerance? }>`) từ `content/questions/*.json`; CI gate `git diff`.

## R6 — Phân tích lớp

- **Quyết định**: `@synaptek/classroom/analytics.ts` nhận attempts của HS-trong-lớp + gọi
  `@synaptek/learning-path` `skillWeakness`/mastery để tổng hợp theo lớp (điểm yếu chung, % hoàn thành bài).
  GV đọc attempts của HS trong lớp qua RLS (policy submissions/attempts cho phép `owns_class`). attempts
  (0001) cần policy bổ sung cho GV đọc theo lớp — thêm ở `0003` (chỉ SELECT, qua `is_member`/`owns_class`
  của lớp chứa HS) **hoặc** tổng hợp chỉ từ `submissions` (M3) để tránh nới RLS attempts. **Chốt**: M3 phân
  tích từ **submissions + skill_mastery của HS trong lớp** (đủ cho "điểm yếu/tiến độ"); không nới RLS
  `attempts` (giảm bề mặt rủi ro). learning-path heatmap chạy trên mastery sẵn có.
- **Lý do**: Vừa-đủ; tránh mở thêm quyền đọc `attempts` chéo HS.

## R7 — Regression M1/M2 (FR-021)

- M3 **không** sửa `grade/index.ts` logic chấm (chỉ thay nguồn answer-keys stub→sinh, hành vi chấm engine
  giữ nguyên); không đổi luyện tập tự do (client low-stakes). Engine test + e2e M1/M2 phải xanh.

## Tổng hợp Decision Log (ghi ở §0)

- **D22**: Vai trò = `profiles.role (student|teacher)`, tự chọn; quyền GV trên HS đến từ **quan hệ lớp**, không từ role.
- **D23**: Lớp/bài/nộp ở `0003`; **audit điểm** giữ auto+final+override+feedback; hạn nộp = đánh dấu trễ, nộp lại = update.
- **D24**: RLS chéo vai trò qua helper **`SECURITY DEFINER`** (`owns_class`/`is_member`) + RPC `join_class_by_code`;
  chấm chính thức = Edge Function `grade-assignment` dùng engine + **answer-keys tự sinh** đồng bộ `_shared` (D4/D6/D13).
