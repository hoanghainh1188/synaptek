# Quickstart — Nghiệm thu M2 Mastery & Lộ trình

Hướng dẫn chạy & kiểm chứng end-to-end. Chi tiết API/schema xem `contracts/`; entities xem `data-model.md`.

## Prerequisites

- Node ≥ 22; đã `npm install` (workspace `@synaptek/learning-path` được symlink).
- Supabase local chạy (`supabase start`) + áp `0002_m2_mastery.sql` (`supabase db reset`).
- `apps/app/.env` trỏ Supabase local (như M1).

## 1. Unit test logic thuần (trọng tâm — TDD)

```bash
npm test -w @synaptek/learning-path     # bkt · diagnostic · recommender · schedule · gamification · heatmap · time
npm test -w @synaptek/curriculum        # gồm: difficulty hợp lệ/không hợp lệ + difficultyOf fallback
npm test                                # toàn workspace (engine + curriculum + learning-path + app lib)
```

**Kỳ vọng**: tất cả xanh. Đặc biệt: recommender **0 vi phạm tiên quyết** (SC-002); `updateMastery` đơn
điệu & tất định (SC-003); streak +1/ngày & reset (SC-005); `dayKeyVN` ổn định quanh nửa đêm VN.

## 2. Đồng bộ scheduler vào `_shared` (D13)

```bash
npm run sync:edge                       # đồng bộ grading-engine + learning-path/schedule,time → _shared
git diff --exit-code supabase/functions/_shared   # phải sạch (CI gate)
```

## 3. Validate nội dung huy hiệu (D6 gate)

```bash
npm run validate:content                # gồm content/gamification/badges.json hợp schema
```

## 4. Chạy app (web) — luồng P1 (MVP M2)

```bash
npm run web -w @synaptek/app
```

Nghiệm thu thủ công:

1. **Chẩn đoán**: HS mới → mời làm chẩn đoán (~5–8 câu) → trang chủ hiện **lộ trình "hôm nay học gì"**
   (US1 / SC-001). Bỏ qua chẩn đoán vẫn luyện được (FR-006).
2. **Mastery cập nhật**: luyện một kỹ năng, trả lời **đúng nhiều lần** → mastery tăng; khi ≥ 0.95, kỹ năng
   phụ thuộc **mở khóa** trong lộ trình (US1 #2). Trả lời **sai** → kỹ năng được ưu tiên hơn (US1 #3).
3. **Gate tiên quyết**: kỹ năng có tiên quyết chưa đạt **không** xuất hiện; thay bằng tiên quyết còn yếu
   (US1 #4 / SC-002).
4. **Heatmap**: mở bản đồ điểm yếu → thang màu theo kỹ năng + **dạng lỗi hay mắc** (US1 #5 / SC-004).

## 5. Luồng P2 — Gamification

1. Hoàn thành phiên → tổng kết hiện **XP nhận được** (theo độ khó) + tổng XP (FR-009).
2. Mô phỏng luyện **ngày kế tiếp** → streak +1; bỏ lỡ một ngày → reset (SC-005). _(Test tự động hóa mốc
   thời gian ở unit; thủ công có thể chỉnh `last_practiced_on`.)_
3. Đạt mốc (vd streak 7 / thành thạo Phân số) → huy hiệu **mở một lần** + ăn mừng (tôn trọng
   `reduced-motion`). Hồ sơ hiện huy hiệu **chưa mở** kèm điều kiện (FR-011/FR-012).

## 6. Luồng P3 — Spaced repetition + cron + push

```bash
# Đặt vài kỹ năng due_at ở quá khứ (qua DBeaver/SQL), rồi chạy function nền cục bộ:
supabase functions serve review-scheduler
```

1. Sau cập nhật mastery → `skill_mastery.due_at` được đặt (gần nếu mastery thấp) (FR-014).
2. Kỹ năng **đến hạn** vào mục "Đến hạn ôn" của lộ trình, ưu tiên trước (FR-015).
3. Chạy scheduler **2 lần** → `review_reminders` có **đúng 1** dòng/HS cho `due_date` đó (idempotent —
   SC-006); HS đã cấp quyền nhận push (best-effort).
4. HS **chưa cấp quyền** → vẫn thấy nhắc **in-app** (lộ trình + dấu "đến hạn") — SC-007.

## 7. E2E (Playwright web)

```bash
npm run e2e -w @synaptek/app            # specs: diagnostic→path, mastery-unlock, heatmap, streak-xp
```

Push native (EAS) **không** chạy ở web/CI — best-effort, không chặn "done" (FR-017).

## Định nghĩa "done" M2

- [ ] `npm test` toàn workspace xanh (≥80% coverage `learning-path`).
- [ ] `sync:edge` sạch; `validate:content` xanh (gồm badges.json).
- [ ] P1 demo được trên web: chẩn đoán → lộ trình → mastery cập nhật → heatmap.
- [ ] P2: XP/streak/huy hiệu đúng mốc, không trùng.
- [ ] P3: cron idempotent + in-app reminder; push best-effort (native không chặn done).
- [ ] Decision Log D19–D21 + WORKING-NOTES cập nhật trong cùng PR.
