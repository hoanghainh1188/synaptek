# Feature Spec: Giới hạn nộp bài tập (mở rộng M3)

**Branch**: `feature/assignment-limits` · **Created**: 2026-06-28 · **Status**: Done
**Input**: Sau M3 (giao bài + chấm chính thức), bổ sung **giới hạn nộp** để bài tập "đáng tin" như kiểm tra:
hạn nộp cứng, số lần nộp, thời gian làm bài. Quy trình lean (không full Spec Kit) — feature tăng dần.

## Clarifications (2026-06-28)

- Sau **hạn nộp**? → **GV chọn mỗi bài** (`allow_late`): tắt → server chặn nộp sau hạn; bật → cho nộp + đánh dấu trễ.
- **Số lần** nộp? → **GV đặt mỗi bài** (`max_attempts`, trống = không giới hạn). Server đếm & chặn khi vượt.
- **Thời gian làm** (đồng hồ đếm ngược mỗi lần làm)? → **Có** (`time_limit_minutes`); HS bắt đầu → đếm ngược → auto-nộp khi hết giờ.

## Yêu cầu

- **FR-1**: GV cấu hình mỗi bài: `allow_late` (mặc định true) · `max_attempts` (null=∞) · `time_limit_minutes` (null=không).
- **FR-2 (Server enforce — D4)**: Edge `grade-assignment` MUST từ chối nộp khi: quá hạn ∧ !allow_late (`past_due`);
  đã đạt `max_attempts` (`no_attempts_left`); quá thời gian làm (+grace) (`time_expired`). Client chỉ hỗ trợ UX.
- **FR-3**: Logic giới hạn MUST là hàm thuần test-first (`@synaptek/classroom` `checkSubmitAllowed`), dùng chung
  client + edge (đồng bộ `_shared` — D13).
- **FR-4**: `started_at` (mốc đếm ngược) đặt bằng **server** (RPC `start_attempt`, security definer + kiểm membership).
- **FR-5**: HS thấy: đồng hồ còn lại, số lượt còn, lý do bị khoá; auto-nộp khi hết giờ. Không phá luồng M3.

## Thành phần

- `@synaptek/classroom/submit-rules.ts` — `checkSubmitAllowed(rules, state, now)` (+10 test). Thứ tự: past_due → no_attempts_left → time_expired.
- Migration `0004`: `assignments` +`allow_late`/`max_attempts`/`time_limit_minutes`; `submissions` +`attempt_count`/`started_at` (answers default `{}`); RPC `start_attempt`.
- Edge `grade-assignment`: load rules+state → `checkSubmitAllowed` → chặn; tăng `attempt_count`.
- UI: composer GV (3 trường); màn HS (đồng hồ + auto-nộp + khoá nút + thông báo lý do).

## Success Criteria

- **SC-1**: max_attempts=1 → HS nộp 1 lần → `attempt_count` tăng (server) → hết lượt (nút khoá). **Verified e2e live.**
- **SC-2**: !allow_late + quá hạn → server từ chối (`past_due`). (logic test; edge dùng cùng hàm)
- **SC-3**: time_limit → đồng hồ đếm ngược, auto-nộp khi hết; quá giờ+grace → `time_expired`.
- **SC-4 (regression)**: bài không đặt giới hạn → hành vi như M3 (nộp/nộp lại bình thường). **Verified e2e live.**

## Decision Log

**D25** — giới hạn nộp, server-enforce qua `checkSubmitAllowed` (xem `docs/00-architecture.md §0`).
