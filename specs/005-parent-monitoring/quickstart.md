# Quickstart — M4 Phụ huynh

## Chạy local

```bash
npm install
npm test                         # logic thuần (tái dùng classroom/learning-path)
supabase db reset                # áp 0001–0005
npm run web -w @synaptek/app
```

## Nghiệm thu

- **US1 (liên kết)**: đăng ký 1 tài khoản **Phụ huynh**; 1 tài khoản **Học sinh** → Hồ sơ → "Tạo mã liên
  kết phụ huynh" → copy mã. PH → "Con của tôi" → nhập mã → con xuất hiện. PH/HS khác không thấy.
- **US2 (theo dõi)**: con luyện vài câu + (tuỳ chọn) GV giao + chấm 1 bài. PH mở con → thấy điểm yếu,
  XP/streak, tổng quan luyện tập, điểm bài. PH **không** sửa được gì; không thấy HS không phải con.

## Kiểm RLS (GATE — SC-002/003/004/005)

```bash
docker exec -i supabase_db_<proj> psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/rls-0005.sql
# → "RLS 0005: PASS"
```

## Cổng CI / regression

- `npm test` · `sync:edge` không lệch · `expo export` web · guest e2e · **deno test** (M3) · RLS M3+M4.
- Engine + RLS M3 (9 ca) + luyện tập M1/M2 giữ xanh (FR-012/SC-006).
