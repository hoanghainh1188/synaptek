# Contract — Edge Function `review-scheduler` (job nền)

Supabase **scheduled** Edge Function (D21). Chạy bằng **service role** (bỏ qua RLS, đọc xuyên HS). Tái
dùng logic lập lịch/quy ước ngày từ `@synaptek/learning-path` qua bản **`_shared`** tự sinh (D13) — không
viết lại. Idempotent (D-schema PK `(student_id, due_date)`).

## Kích hoạt

- Lịch định kỳ (vd mỗi giờ hoặc mỗi sáng giờ VN). Cú pháp scheduled function của Supabase **chốt ở tasks**
  (đọc docs hiện hành). Không nhận input người dùng.

## Thuật toán mỗi lần chạy

```
now ← thời điểm hiện tại
dueDateVN ← dayKeyVN(now)                              // từ _shared/learning-path
rows ← SELECT student_id FROM skill_mastery
        WHERE due_at <= now GROUP BY student_id        // HS có ≥1 kỹ năng đến hạn
for each student_id in rows:
  ins ← INSERT INTO review_reminders (student_id, due_date)
        VALUES (student_id, dueDateVN)
        ON CONFLICT (student_id, due_date) DO NOTHING RETURNING student_id
  if ins is a NEW row:                                 // chưa nhắc trong chu kỳ này
     tokens ← SELECT token FROM push_tokens WHERE student_id=… AND enabled=true
     for token: gửi Expo push "Đến giờ ôn tập rồi!" (best-effort)
     UPDATE review_reminders SET pushed_at=now WHERE … (nếu gửi được ≥1)
```

## Bất biến (test — SC-006)

- Chạy **2 lần** trong cùng `due_date` của một HS → tạo **đúng 1** dòng `review_reminders` (lần 2:
  `ON CONFLICT DO NOTHING`, không gửi lại).
- HS **không có** token `enabled` → vẫn tạo nhắc (để in-app thấy "đến hạn"); không gửi push. **Không lỗi**.
- Push lỗi/timeout → `pushed_at` giữ null; **không** rollback dòng nhắc (in-app vẫn hoạt động). Push là
  best-effort (FR-017).

## Phụ thuộc `_shared`

- `scripts/sync-edge-engine.mjs` mở rộng: đồng bộ `schedule.ts` + `time.ts` (và phụ thuộc thuần) của
  `@synaptek/learning-path` vào `supabase/functions/_shared/learning-path/` (banner "AUTO-GENERATED").
- CI chạy `sync:edge` + kiểm `git diff` để chống lệch (như engine).

## Ngoài phạm vi (M2)

- Không gửi email/SMS; chỉ Expo push (best-effort) + in-app.
- Không cá nhân hóa nội dung push theo kỹ năng (chỉ nhắc chung "đến giờ ôn") — tinh chỉnh sau.
