# Synaptek

> *Synapse* (khớp thần kinh — nơi việc học diễn ra) + *tek* — ứng dụng giúp học sinh Việt Nam **kết nối kiến thức, tự tin chinh phục môn học**.

Nền tảng học & luyện tập, khởi đầu với **Toán Tiểu học (lớp 1–5)**: ôn luyện kiến thức, làm bài
tập **chấm tự động**, biết rõ **điểm yếu** và nhận **lộ trình cá nhân hóa**. Có vai trò **học sinh /
giáo viên / phụ huynh**. Cross-platform (**web + iOS + Android** một codebase), mở rộng được sang
THCS/THPT và các môn khác (Lý/Hóa/Anh).

## Trạng thái

- **M0 — Scaffolding (đang làm):** monorepo + tooling dựng theo convention `twolody`. ✅ Package lõi
  `@synaptek/grading-engine` đã có (TDD, 19/19 test) — chấm MCQ/Đúng-Sai/số/phân số/biểu thức tương
  đương/điền chỗ trống. ⏳ Còn lại: app Expo Router universal, Supabase auth + 1 Edge Function mẫu, CI.

Xem `docs/WORKING-NOTES.md` để biết điểm tiếp tục, `docs/00-architecture.md` cho Decision Log.

## Lệnh

```bash
npm test            # chạy test toàn bộ packages (hiện tại: grading-engine, 19/19)
npm run format      # prettier --write .
npm run format:check
```

- Node **≥ 22** (xem `.nvmrc`). Engine ship & test ở dạng raw `.ts` (`node --experimental-strip-types`),
  không build step.
- Monorepo npm workspaces: `packages/*` (lõi TS thuần) và `apps/*` (sẽ thêm app Expo).

## Kiến trúc (tóm tắt)

1. **Logic lõi = package TS thuần** (`packages/grading-engine`, sắp tới `curriculum`, `learning-path`):
   độc lập nền tảng, test không cần render. Phụ thuộc một chiều: `apps/*` & `supabase/functions/*` → `packages/*`.
2. **Cross-platform = Expo Router universal** (React Native Web): một codebase web + native.
3. **Backend = Supabase BaaS + Edge Functions**: CRUD/RLS qua Supabase; logic đáng tin cậy (chấm
   chính thức, bảo vệ đáp án, cấp quyền, job nền) chạy ở Edge Function, **dùng lại `grading-engine`**.
4. **Nội dung (curriculum + ngân hàng câu hỏi) = JSON versioned trong `content/`**, ground-truth, DB chỉ tham chiếu `id`.

Docs & comment viết **tiếng Việt**; định danh code **tiếng Anh**.
