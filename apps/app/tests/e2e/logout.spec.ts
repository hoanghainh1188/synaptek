import { expect, test } from "@playwright/test";

// CẦN Supabase. Đăng ký → Hồ sơ → Đăng xuất (xác nhận) → về guest.
test("đăng xuất khỏi tài khoản", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Out");
  await page.getByPlaceholder("email@vidu.com").fill(`out${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  await page.goto("/profile");
  await page.getByLabel("Đăng xuất").click();
  await page.getByLabel("Xác nhận đăng xuất").click();
  // về trang chủ guest → nút "Đăng nhập" xuất hiện
  await expect(page.getByLabel("Đăng nhập")).toBeVisible({ timeout: 15_000 });
});
