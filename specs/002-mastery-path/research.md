# Research — M2 Mastery & Lộ trình (Phase 0)

Giải các điểm cần quyết trong Technical Context. Mỗi mục: **Quyết định / Lý do / Phương án loại**. Các
giá trị tham số đã chốt ở `## Clarifications` của spec (ngưỡng 0.95, chẩn đoán 5–8 câu, XP theo độ khó,
push best-effort, mốc ngày VN).

## R1. Mô hình mastery — Bayesian Knowledge Tracing (BKT) → **D19**

- **Quyết định**: BKT chuẩn 4 tham số mỗi kỹ năng, lưu **P(L) = mastery** trong [0,1].
  - **Mặc định**: `pInit=0.30`, `pLearn(transit)=0.15`, `pSlip=0.10`, `pGuess=0.20` (giá trị phổ biến,
    "an toàn" khi chưa có dữ liệu thật). `MASTERED=0.95`.
  - **Cập nhật sau mỗi câu** (đúng `c`):
    - posterior: nếu đúng → `P(L|c) = P(L)(1−pSlip) / [P(L)(1−pSlip) + (1−P(L))pGuess]`;
      nếu sai → `P(L|¬c) = P(L)·pSlip / [P(L)·pSlip + (1−P(L))(1−pGuess)]`.
    - học: `P(L') = P(L|obs) + (1−P(L|obs))·pLearn`.
  - **Tính chất**: đúng → tăng đơn điệu; sai → giảm về phía 0 rồi mới +learn → ròng là "giảm/chậm lại".
    Tất định với cùng lịch sử (test SC-003).
- **Lý do**: Chuẩn học thuật (Corbett & Anderson 1995), code nhỏ & thuần, kiểm thử dễ, đúng yêu cầu
  "đúng→tăng, sai→giảm". Một skill = một đơn vị BKT (skill là đơn vị mastery nguyên tử — `curriculum`).
- **Phương án loại**: EWMA độ đúng (đơn giản nhưng không mô hình hóa slip/guess, kém giải thích); DKT/
  deep models (cần dữ liệu lớn + runtime nặng, ngược "vừa-đủ"); IRT (cần hiệu chỉnh tham số câu hỏi).
- **Rủi ro**: tham số mặc định chưa chuẩn cho VN → để **một nơi cấu hình** (`BktParams`), tinh chỉnh sau;
  đổi tham số không được gây mastery "nhảy bậc" với cùng lịch sử (FR-020) — test guard.

## R2. Khởi tạo mastery từ chẩn đoán (diagnostic)

- **Quyết định**: `buildDiagnostic(skills, questions, {max:8})` chọn **~5–8 câu trải kỹ năng nền** — ưu
  tiên kỹ năng **gốc** (không/ít tiên quyết) trong đồ thị, mỗi kỹ năng ≤ 1–2 câu, tất định theo seed.
  `initFromDiagnostic(responses, params)` chạy BKT update từ `pInit` cho mỗi kỹ năng được chạm; kỹ năng
  **chưa chạm** giữ `pInit` mặc định (lazy).
- **Lý do**: Ngắn (không nản trẻ), vẫn neo được điểm xuất phát cho các nhánh chính; tái dùng đúng cơ chế
  BKT (không thêm mô hình khởi tạo riêng).
- **Phương án loại**: chẩn đoán cố định 10 câu (dài hơn cần); 1 câu/kỹ năng (số câu trôi theo số kỹ năng,
  khó kiểm soát độ dài).

## R3. Bộ gợi ý "học gì tiếp" (recommender)

- **Quyết định**: `recommendNext(skills, masteryMap, {now, dueAt})` trả danh sách kỹ năng thỏa **tất cả**:
  (a) **mọi tiên quyết đã đạt** (mastery ≥ 0.95); (b) **mastery < 0.95**; (c) hợp lệ để học (có câu hỏi).
  **Xếp ưu tiên**: kỹ năng **đến hạn ôn** (due ≤ now) trước, trong đó quá hạn lâu hơn trước; rồi tới kỹ
  năng mới mastery thấp nhất. Trả kèm lý do (`new` | `due` | `weak`) cho UI.
- **Lý do**: Khớp trực tiếp FR-003/FR-004/FR-015; thuần hàm trên đồ thị → test "0 vi phạm tiên quyết"
  (SC-002). Tách "ôn (due)" vs "học mới" để trang chủ hiển thị 2 nhóm.
- **Phương án loại**: chọn ngẫu nhiên/tuần tự (M1 — không cá nhân hóa); tối ưu đa mục tiêu phức tạp (thừa).

## R4. Lập lịch ôn ngắt quãng (SM-2 đơn giản hóa) — dùng chung client + edge

- **Quyết định**: `nextDueAt({ mastery, lastReviewed, repetition })` — khoảng cách (ngày) **giãn theo
  mastery & số lần ôn**: mastery thấp → 1 ngày; tăng dần (vd 1→3→7→16 ngày) theo bậc, nhân hệ số ease tỉ
  lệ mastery. Trả mốc ngày kế (theo **Asia/Ho_Chi_Minh**, dùng `dayKeyVN`). Lưu `skill_mastery.due_at`.
- **Lý do**: SM-2 rút gọn đủ tốt cho ôn tập tiểu học, không cần độ chính xác Anki. Là **hàm thuần** → tái
  dùng nguyên vẹn ở Edge Function nền qua `_shared` (D13), không lệch logic client/server.
- **Phương án loại**: SM-2/FSRS đầy đủ (thừa, nhiều tham số); lịch cố định (không thích nghi theo mastery).

## R5. Gamification — XP / streak / huy hiệu → **D20**

- **Quyết định**: hàm thuần trong `gamification.ts`.
  - **XP**: `xpForAttempt(isCorrect, difficulty)` = `isCorrect ? base × weight[difficulty] : 0`
    (base=10; weight {1:1, 2:1.5, 3:2}). `difficulty` lấy từ câu hỏi hoặc `difficultyOf(q)` fallback theo
    loại (mcq=1, numeric/fraction=2, expression/fill-blank=3).
  - **Streak**: `updateStreak(state, practicedDayKeyVN)` so với `last_practiced_on`: cùng
    ngày → giữ; ngày kế tiếp → +1; cách ≥ 2 ngày → reset về 1. Cập nhật `longest_streak`.
  - **Huy hiệu**: `evaluateBadges(state, masteryMap, catalog)` — catalog là **JSON** (`content/gamification/
badges.json`, D6) gồm `{id, name, desc, icon, criteria}`; `criteria` là kiểu hữu hạn evaluator hiểu:
    `{type:'streak', gte}` · `{type:'xp', gte}` · `{type:'skill_mastered', skillId}` ·
    `{type:'topic_mastered', topicId}` · `{type:'correct_count', gte}`. Trả huy hiệu **mới đạt** (so với
    đã có) → mở **đúng một lần** (FR-011).
- **Lý do**: Tách định nghĩa (data, versioned) khỏi logic (pure, test) — mở rộng huy hiệu không sửa code
  (đúng tinh thần D6). Mọi luật kiểm thử được (SC-005).
- **Phương án loại**: hard-code điều kiện huy hiệu rải rác trong UI (khó test/mở rộng); XP phẳng (bỏ độ
  khó — trái yêu cầu).

## R6. Bản đồ điểm yếu (error heatmap)

- **Quyết định**: `skillWeakness(attempts, skills, masteryMap)` → mỗi chủ đề/kỹ năng một ô {mastery, độ
  đúng gần đây, số lần}. `commonErrorType(attempts, questionsMeta)` suy **dạng lỗi hay mắc** bằng nhóm
  theo `skillId` + loại câu sai nhiều nhất (vd "phân số: rút gọn sai", "đo lường: sai đơn vị") từ metadata
  câu hỏi (loại + skill). M2 dùng tín hiệu sẵn có (`is_correct` + `skill_id` + loại); không cần phân tích
  văn bản đáp án.
- **Lý do**: Đủ để chỉ "yếu ở đâu + dạng gì" (FR-005/SC-004) mà không thêm dữ liệu. Thang màu dùng tokens
  ngữ nghĩa (đỏ→xanh).
- **Phương án loại**: phân loại lỗi chi tiết theo nội dung đáp án (cần gắn nhãn lỗi cho từng câu — để sau).
- **Lưu ý dữ liệu**: heatmap "dạng lỗi" cần `skill_id` + loại câu trên attempt; `attempts` đã có `skill_id`.
  Loại câu suy từ `question_id` → tra `curriculum`/manifest (client có sẵn content).

## R7. Lưu trữ gamification (bảng mới vs cột profiles)

- **Quyết định**: **Bảng mới** (migration `0002`): `gamification_state` (1 dòng/HS: `total_xp`,
  `current_streak`, `longest_streak`, `last_practiced_on`), `student_badges` (HS × badge, `earned_at`),
  `push_tokens` (HS × token, `platform`, `enabled`), `review_reminders` (HS × `due_date` — **unique** để
  job nền idempotent). `skill_mastery` **giữ nguyên** (đủ cột). RLS "của mình" + grants `authenticated`
  như M1.
- **Lý do**: `profiles` là **định danh** — không trộn trạng thái game (dễ RLS, dễ mở rộng, đúng chuẩn hóa).
  `review_reminders` với khóa duy nhất `(student_id, due_date)` cho **idempotency** (SC-006) thay vì cột cờ.
- **Phương án loại**: thêm cột vào `profiles` (trộn mối quan tâm, khó khi badge là quan hệ nhiều-nhiều);
  bảng `reminders` không ràng buộc duy nhất (không đảm bảo idempotent).

## R8. Job nền — Supabase scheduled Edge Function → **D21**

- **Quyết định**: Edge Function `review-scheduler` chạy theo lịch (Supabase scheduled function / pg_cron
  gọi function). Mỗi lần chạy: với mỗi HS có kỹ năng `due_at ≤ now`, **insert idempotent** vào
  `review_reminders (student_id, due_date)` (on conflict do nothing) → nếu là dòng mới thì xếp gửi push.
  **Dùng lại `nextDueAt`/quy ước ngày** từ `learning-path` qua `_shared` (mở rộng `sync:edge`).
- **Lý do**: Không server riêng (D3); tái dùng logic lập lịch (không fork — D5/D13); idempotent nhờ ràng
  buộc DB (chạy chồng vô hại — SC-006).
- **Phương án loại**: cron ngoài (thêm hạ tầng); tính "đến hạn" ở client mỗi lần mở app (không nhắc được
  khi app đóng — mất giá trị push).
- **Cần xác nhận khi implement**: cú pháp scheduled function của Supabase hiện hành + cách service-role
  đọc xuyên HS (job nền chạy bằng service key, bỏ qua RLS) — chốt ở tasks (đọc docs Supabase).

## R9. Push notification (expo-notifications) — best-effort

- **Quyết định**: client `notifications.ts` xin quyền + lấy **Expo push token**, lưu `push_tokens`
  (chỉ khi được cấp quyền). Job nền gửi qua **Expo push API**. **Web**: hạn chế → bỏ qua êm; **native**:
  cần **EAS build + quyền** → có thể chưa chạy thật ở dev. **Luôn** có nhắc **in-app** (lộ trình + dấu
  "đến hạn") — đường bắt buộc (FR-017/SC-007). Tôn trọng tắt thông báo (`enabled=false`, FR-019).
- **Lý do**: Push là kênh kéo lại nhưng phụ thuộc store/EAS (vốn M5) → để **best-effort**, không chặn M2
  "done"; in-app đảm bảo giá trị ngay trên web.
- **Phương án loại**: bắt buộc push native trong M2 (kéo hạ tầng EAS sớm, rủi ro tiến độ); hoãn toàn bộ
  push sang M5 (mất kênh nhắc — chọn giữ best-effort).
- **Cần xác nhận khi implement**: API `expo-notifications` ở Expo SDK 56 (xem `docs.expo.dev/versions/
v56.0.0/`) — chốt ở tasks.

## R10. Trường `difficulty` cho câu hỏi (schema `@synaptek/curriculum`)

- **Quyết định**: thêm `difficulty?: 1 | 2 | 3` (tùy chọn) vào `Question`; `validateQuestion` chấp nhận
  vắng mặt, nếu có thì phải ∈ {1,2,3}. `difficultyOf(q)` trả `q.difficulty ?? mapByType(q.type)`.
- **Lý do**: XP theo độ khó (clarify Q1) mà **không** bắt tag lại ~120 câu seed ngay; người soạn nâng cấp
  dần. Giữ schema là nguồn-sự-thật (D6/D14); thêm vào `curriculum` vì nó là schema authority.
- **Phương án loại**: suy độ khó hoàn toàn từ loại (kém linh hoạt); XP phẳng (trái yêu cầu).

## Tóm tắt phụ thuộc mới

`@synaptek/learning-path` (workspace, TS thuần) · `expo-notifications` (app, best-effort) · migration
`0002_m2_mastery.sql` · `content/gamification/badges.json` · mở rộng `scripts/sync-edge-engine.mjs` để
đồng bộ phần lập lịch vào `_shared`. Không thêm app/service. Phiên bản chốt khi cài (docs/Context7).
