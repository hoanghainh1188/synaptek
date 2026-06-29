import { expect, test } from "@playwright/test";

// US2 — CẦN Supabase (đăng nhập + lưu attempt). Chạy ở CI job e2e-auth.
test("đăng ký → làm bài → tiến độ được lưu", async ({ page }) => {
  const email = `e2e${Date.now()}@test.local`;

  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Minh");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  // Đã đăng nhập → trang chủ hiện avatar "Hồ sơ"
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  // Luyện tập Phân số, trả lời đúng câu đầu (q001 mcq, đáp án 1/2)
  await page.goto("/practice/g4.num.fractions");
  await page.getByLabel("1/2").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 15_000 });

  // Tiến độ đã lưu (attempt)
  await page.goto("/progress");
  await expect(page.getByText("Tiến độ của em")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/% đúng/)).toBeVisible({ timeout: 15_000 });
});
