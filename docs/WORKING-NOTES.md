# WORKING NOTES — điểm tiếp tục

> Đọc file này đầu mỗi phiên để biết đang ở đâu; cập nhật trước khi dừng.

## Đang ở đâu (cập nhật mới nhất)

**Mốc:** M0 — Scaffolding & Spike (đang làm).

**Đã xong:**
- Monorepo npm workspaces + tooling mirror twolody: `package.json` (workspaces `packages/*`,
  prettier/lint-staged inline, husky), `.nvmrc` (22), `.gitignore`, `.prettierignore`.
- `packages/grading-engine` — **TDD, 19/19 test xanh** (`npm test`). Chấm `mcq` · `true-false` ·
  `numeric` (chuẩn hóa số VN) · `fraction` (tương đương giá trị) · `expression` (tương đương đại số
  qua lấy mẫu x) · `fill-blank` (partial). Đây là moat của sản phẩm.
- Docs: `README.md`, `CLAUDE.md`, `docs/00-architecture.md` (Decision Log D1–D10), `docs/02-roadmap.md`.

## Việc tiếp theo (theo thứ tự)

1. **Commit đầu tiên**: repo `synaptek` đã `git init` + stage toàn bộ; chờ chủ repo xác nhận quy ước
   commit/attribution rồi commit (và tạo remote nếu cần).
2. **Dựng `apps/app` (Expo Router universal)**: `create-expo-app`, chạy được web + iOS sim. Sau đó
   thêm `"apps/*"` vào `workspaces` của root `package.json`. *(Cần mạng để cài deps.)*
3. **Tích hợp Supabase**: `supabase init` (config-as-code), auth tối thiểu, 1 Edge Function "hello"
   import thử `@synaptek/grading-engine` để khóa pattern 2-consumer (client + server).
4. **CI** `.github/workflows/ci.yml`: format → lint → test → Expo web build → Playwright e2e.
5. **Spike render Toán universal**: component vẽ phân số/biểu thức + UI nhập đáp số trên mobile.
6. Xác nhận phiên bản stack (Expo SDK, Expo Router web output, NativeWind, @supabase/supabase-js,
   Edge Functions Deno) qua Context7/docs chính chủ — ghi vào Decision Log.

## Ghi chú / quyết định mở

- **Lớp khởi đầu M1**: đề xuất lớp 4 (D7) — chốt lại khi vào M1.
- **Nguồn nội dung & bản quyền** (rủi ro lớn nhất): câu hỏi phải bám CT GDPT 2018 nhưng KHÔNG sao
  chép nguyên văn SGK → cần quy trình biên soạn + review.
- **Tên `synaptek`**: kiểm tra trùng thương hiệu/tên miền/app store trước khi đăng ký chính thức.
