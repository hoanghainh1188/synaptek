import { test, expect } from "@playwright/test";

// US3 (T050) — Nhắc ôn in-app (SC-007).
//
// Lõi logic "kỹ năng due_at quá khứ → vào mục 'đến hạn ôn'" được kiểm TẤT ĐỊNH ở unit test
// `src/lib/path.test.ts` (test "SC-007"). Phần e2e đầy đủ cần **đăng nhập + seed một dòng
// skill_mastery có due_at quá khứ** (Supabase) → AUTH-GATED, không chạy ở CI (như auth-progress).
//
// Khi chạy ở môi trường có Supabase + seed dữ liệu: đăng nhập, đặt due_at quá khứ cho 1 kỹ năng đã
// đủ tiên quyết, mở trang chủ → thấy thẻ "Đến hạn ôn" (in-app, KHÔNG cần cấp quyền push).
test.skip("HS chưa cấp quyền push vẫn thấy nhắc in-app (đến hạn ôn) — cần Supabase + seed", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Đến hạn ôn")).toBeVisible();
});
