# @synaptek/classroom

Logic **lớp học giáo viên** thuần (TS, zero-dep, raw `.ts`) cho M3. Không import DOM/React/Node-only →
chạy được ở **client + Deno Edge Function**. Tất cả hàm **thuần & tất định** (thời gian/seed truyền vào).

## Vai trò

Phần "khó" của M3 là **RLS chéo vai trò** (ở Postgres, xem `supabase/migrations/0003`), không phải thuật
toán. Package này gom **logic nghiệp vụ thuần** để test-first + dùng lại ở cả client lẫn edge (D5):

- `invite.ts` — sinh **mã mời** khó đoán (base32 an toàn, từ seed inject) + chuẩn hóa + kiểm hết hạn.
- `grading-policy.ts` — quy tắc **hạn nộp** (đánh dấu trễ) · **điểm hợp lệ** [0,1] · điểm hiển thị
  (`final ?? auto`) · gộp điểm bài.
- `analytics.ts` — tổng hợp **phân tích lớp** (tiến độ bài, điểm yếu lớp — dùng lại `@synaptek/learning-path`).

## Quyết định liên quan (Decision Log §0)

- **D22** vai trò = `profiles.role`; quyền GV trên HS đến từ quan hệ lớp.
- **D23** lớp/bài/nộp + audit điểm (giữ auto + final).
- **D24** RLS chéo vai trò qua helper `SECURITY DEFINER` + chấm chính thức server-side (answer-keys đồng bộ `_shared`).

## Test

```bash
npm test -w @synaptek/classroom   # node --experimental-strip-types (TDD, ≥80% coverage)
```
