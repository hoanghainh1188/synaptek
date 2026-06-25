# @synaptek/learning-path

Logic **mastery & lộ trình học** của Synaptek — TS thuần, zero-dep, ship raw `.ts`, chạy được cả ở client
(phản hồi tức thì) lẫn Deno Edge Function (job nền). Không import DOM/React/Node-only.

Bao gồm (M2 — `specs/002-mastery-path`):

- **`bkt.ts`** — Bayesian Knowledge Tracing: `updateMastery` (đúng→tăng, sai→giảm/chậm), `initFromDiagnostic`.
  Tham số mặc định + ngưỡng "đã đạt" `MASTERED=0.95`. (**D19**)
- **`recommender.ts`** — `recommendNext`: chọn kỹ năng (tiên quyết đã đạt ∧ mastery thấp ∧ đến hạn).
- **`diagnostic.ts`** — `buildDiagnostic`: ~5–8 câu trải kỹ năng nền để khởi tạo mastery.
- **`schedule.ts`** — `nextDueAt`: ôn ngắt quãng (SM-2 rút gọn) — dùng chung client + edge. (**D21**)
- **`gamification.ts`** — XP (theo độ khó) + streak (mốc VN) + huy hiệu. (**D20**)
- **`heatmap.ts`** — `skillWeakness` + `commonErrorType` (bản đồ điểm yếu).
- **`time.ts`** — `dayKeyVN` (mốc ngày Asia/Ho_Chi_Minh, tất định).

Test: `npm test -w @synaptek/learning-path` (`node --experimental-strip-types`, không cần mạng/DB).
API ổn định: `specs/002-mastery-path/contracts/learning-path-api.md`.
