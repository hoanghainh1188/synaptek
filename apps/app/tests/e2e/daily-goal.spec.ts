import { expect, test } from "@playwright/test";

// CẦN Supabase (lưu attempt). Mục tiêu hằng ngày: luyện 1 câu → home hiện "1/10 câu".
test("mục tiêu hằng ngày tăng sau khi luyện", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Goal");
  await page.getByPlaceholder("email@vidu.com").fill(`goal${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ")).toBeVisible({ timeout: 25_000 });

  // Luyện 1 câu (q001 mcq, đáp án 1/2)
  await page.goto("/practice/g4.num.fractions");
  await page.getByLabel("1/2").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 15_000 });

  // Về home → mục tiêu hôm nay 1/10
  await page.goto("/");
  await expect(page.getByText("🎯 Mục tiêu hôm nay")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1\/10 câu/)).toBeVisible({ timeout: 15_000 });
});
