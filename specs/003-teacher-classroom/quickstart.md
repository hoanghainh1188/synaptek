# Quickstart — M3 Giáo viên (chạy & nghiệm thu)

## Chạy local

```bash
npm install                      # link @synaptek/classroom (workspace mới)
npm test                         # logic thuần: engine + curriculum + learning-path + classroom (TDD)
npm run sync:edge                # sinh _shared (grading-engine + learning-path + answer-keys MỚI)
supabase start                   # áp 0001 + 0002 + 0003 (cần Docker)
supabase functions serve grade-assignment   # chấm chính thức
npm run web -w @synaptek/app     # app universal (web ra trước)
```

## Nghiệm thu theo user story

- **US1 (lớp + mã + tham gia)**: đăng ký 1 tài khoản **role=teacher** → tạo lớp → copy mã. Đăng ký 1
  tài khoản HS → màn `/join` nhập mã → vào lớp. GV mở `class/[id]` thấy HS trong roster. Đăng nhập tài
  khoản khác → **không** thấy lớp.
- **US2 (giao bài + chấm server)**: GV soạn bài (chọn vài `questionId` từ `content/` + hạn) → giao. HS
  trong lớp mở `/assignment/[id]`, làm, nộp → điểm hiện (auto). Kiểm payload `grade-assignment` **không**
  chứa đáp án (DevTools/network). HS ngoài lớp gọi function → `not_member`.
- **US3 (ghi đè + nhận xét + phân tích)**: GV mở `submission/[id]` → nhập điểm ghi đè + nhận xét → HS thấy
  **điểm cuối** + nhận xét; DB giữ cả `auto_score`. GV mở phân tích lớp → điểm yếu/tiến độ đúng theo lớp.

## Kiểm RLS (GATE — SC-002/007)

Chạy script `contracts/db-schema-0003.md §7` trên Supabase local (psql/service-role seed 2 GV + 2 HS chéo
lớp). Khẳng định 6 mệnh đề cô lập (HS không thấy lớp/bài/điểm lớp khác; GV không sửa submission lớp khác;
HS không tự đặt `auto_score`; `join_class_by_code` mã sai/hết hạn → lỗi).

## Cổng CI (mở rộng từ M2)

- `npm test` (gồm `@synaptek/classroom`) · `sync:edge` + `git diff` (gồm `answer-keys.ts`) ·
  `validate:content` · `deno test` (gồm `grade-assignment` logic) · `expo export` web · guest e2e.
- **Regression (FR-021)**: engine test xanh; luyện tự do M1/M2 không đổi.

## Hậu-M3 (không chặn)

- Deploy hosted: `supabase db push` (0003) + `functions deploy grade-assignment`.
- RLS test tự động trong CI (cần Postgres dịch vụ) — cân nhắc bổ sung.
