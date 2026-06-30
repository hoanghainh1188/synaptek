import { expect, test } from "@playwright/test";

// CẦN Supabase. Soạn câu biểu thức: chèn nhanh ký hiệu ( x ) vào ô đáp án + xem trước (MathText) → lưu.
test("soạn câu: thanh chèn ký hiệu + xem trước khi nhập đáp án biểu thức", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô Ins");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`gvins${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  await page.goto("/questions");
  await page.getByLabel("Biểu thức").click();
  await page.getByLabel("Đề bài").fill("Rút gọn biểu thức");
  await page.getByLabel("Đáp án đúng").fill("2");
  // Chèn nhanh: 2 → 2( → 2(x → 2(x)
  await page.getByLabel("Chèn (").click();
  await page.getByLabel("Chèn x").click();
  await page.getByLabel("Chèn )").click();
  await expect(page.getByLabel("Đáp án đúng")).toHaveValue("2(x)");
  await expect(page.getByText("Xem trước")).toBeVisible();
  await page.getByLabel("Lưu câu hỏi").click();
  await expect(page.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });
});
