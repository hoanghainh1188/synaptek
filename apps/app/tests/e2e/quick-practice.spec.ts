import { expect, test } from "@playwright/test";

// CẦN Supabase. Luyện nhanh: từ home → mở phiên trộn câu (điểm yếu/đến hạn) → có câu để làm.
test("luyện nhanh mở phiên có câu", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Quick");
  await page.getByPlaceholder("email@vidu.com").fill(`quick${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  // Từ home bấm "Luyện nhanh" (chờ nút xuất hiện = đã đăng nhập)
  await page.getByLabel("Luyện nhanh").click({ timeout: 25_000 });
  // Phiên mở có câu để làm → nút Kiểm tra hiện
  await expect(page.getByLabel("Kiểm tra")).toBeVisible({ timeout: 15_000 });
});
