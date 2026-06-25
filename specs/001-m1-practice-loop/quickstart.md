# Quickstart — Nghiệm thu M1 Vòng luyện tập

Hướng dẫn **chạy & kiểm chứng** M1 end-to-end (không phải code chi tiết — đó là `tasks.md` + implement).
Tham chiếu: [data-model.md](./data-model.md), [contracts/content-schema.md](./contracts/content-schema.md).

## Prerequisites

- Node ≥ 22. Deps đã cài (`npm install` ở root).
- Supabase CLI + Docker (cho US2 auth/persistence). Không cần Docker cho US1/US3 (chấm client + content bundle).
- File `apps/app/.env` (local): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (lấy từ `supabase status`).

## 0. Cổng tự động (chạy trước khi mở PR — như CI)

```bash
npm test                                   # @synaptek/grading-engine + @synaptek/curriculum + apps/app/lib/* (Vitest)
npm run sync:edge && git diff --exit-code -- supabase/functions/_shared
npm run build:web --workspace @synaptek/app
```

Kỳ vọng: engine + curriculum (validate content mẫu) + lib (session/progress) **xanh**; build web OK.

## 1. US1 (P1) — Luyện tập + chấm tức thì (KHÔNG cần đăng nhập)

```bash
npm run web --workspace @synaptek/app      # http://localhost:8081
```

Kịch bản:

1. Trang chủ → chọn **lớp 4** → chủ đề **Phân số**.
2. Làm lần lượt; nhập đáp án dạng tương đương để kiểm engine:
   - câu `fraction` "Rút gọn 2/4" → nhập `1/2` **hoặc** `0,5` → **Đúng ✅** tức thì + giải thích.
   - câu `numeric` → nhập `0,5` cho đáp án `0.5` → Đúng.
   - câu `expression` → nhập `2(a+2)` cho đáp án `2a+4` → Đúng.
3. Bỏ trống rồi nộp → báo "chưa nhập" (không tính sai). Nhập sai định dạng (mẫu 0) → báo nhẹ.
4. Hết phiên → màn **kết quả**: đúng/tổng, điểm, danh sách câu sai.

✅ Đạt khi: chấm tương đương đúng, phản hồi < 200ms, kết quả phiên chính xác. (Không cần Supabase.)

## 2. US2 (P2) — Auth + lưu tiến độ

```bash
npm run sync:edge && supabase start         # stack local (Docker)
# điền apps/app/.env từ `supabase status`, rồi: npm run web --workspace @synaptek/app
```

Kịch bản:

1. Đăng ký bằng email/mật khẩu → có hồ sơ học sinh, vào luyện tập.
2. Làm vài câu (đăng nhập) → đăng xuất → đăng nhập lại (hoặc trình duyệt khác) → **tiến độ theo chủ đề
   và lịch sử trả lời hiển thị lại đúng**.
3. Kiểm DB: Studio `http://localhost:54323` → bảng `attempts` có bản ghi của học sinh (RLS: chỉ của mình).

✅ Đạt khi: SC-003 (100% tiến độ khôi phục), attempts ghi đúng qua RLS.

```bash
supabase stop                               # khi xong
```

## 3. US3 (P3) — Ôn lớp dưới

1. Màn chọn chủ đề → lọc **lớp 1–3** → chọn một chủ đề (vd bảng nhân) → luyện trọn phiên.

✅ Đạt khi: chọn & luyện được nội dung đa lớp.

## 4. E2E (Playwright, web)

```bash
npm run e2e --workspace @synaptek/app       # luồng: chọn chủ đề → luyện → kết quả; đăng nhập → tiến độ
```

## Tiêu chí Done của M1 (khớp Success Criteria spec)

- [ ] SC-001 hoàn thành phiên không cần hướng dẫn · [ ] SC-002 chấm tương đương ≥99% (test+e2e)
- [ ] SC-003 tiến độ khôi phục 100% sau đăng nhập lại · [ ] SC-004 phản hồi <200ms
- [ ] SC-005 ≥120 câu lớp 4 (3 chủ đề) + ít chủ đề lớp 1–3 nạp từ content JSON
- [ ] Bộ test (engine/curriculum/lib) + e2e xanh; build web OK; CI xanh trên PR `→ develop`
