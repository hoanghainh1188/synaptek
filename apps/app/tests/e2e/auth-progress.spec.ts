import { expect, test } from "@playwright/test";

// US2 (T028) — CẦN Supabase chạy + apps/app/.env. Không chạy ở CI (CI chưa có env).
// Local: supabase start → tạo .env (xem .env.example) → npm run e2e
test("đăng ký → làm bài → tiến độ được lưu", async ({ page }) => {
  const email = `e2e${Date.now()}@test.local`;

  await page.goto("/");
  await page.getByLabel("Đăng nhập").click();
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Minh");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  // Về trang chủ, đã đăng nhập → nút Tiến độ xuất hiện
  await expect(page.getByLabel("Tiến độ")).toBeVisible({ timeout: 25_000 });

  // Luyện tập Phân số, trả lời đúng câu đầu (mcq 1/2)
  await page.getByLabel("Phân số").click();
  await page.getByLabel("1/2").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible();

  // Xem tiến độ → có dữ liệu (đã lưu attempt)
  await page.goto("/progress");
  await expect(page.getByText("Tiến độ của em")).toBeVisible();
  await expect(page.getByText(/% đúng/)).toBeVisible({ timeout: 15_000 });
});
