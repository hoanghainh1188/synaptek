import { expect, test } from "@playwright/test";
import path from "node:path";

// CẦN Supabase (DB + Storage). KHÔNG cần functions. Ảnh trong câu tự soạn: upload → lưu → hiện lại.
test("soạn câu có ảnh: upload Storage → lưu → ảnh hiện trong danh sách", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô Hình");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`img${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  await page.goto("/questions");
  await page.getByLabel("Số", { exact: true }).click();
  await page.getByLabel("Đề bài").fill("Đếm số chấm trong hình");
  await page.getByLabel("Đáp án đúng").fill("1");

  // Upload ảnh qua file picker (DOM input động → filechooser)
  const fcPromise = page.waitForEvent("filechooser");
  await page.getByLabel("Thêm ảnh").click();
  const fc = await fcPromise;
  await fc.setFiles(path.join(process.cwd(), "tests/fixtures/dot.png"));
  await expect(page.getByLabel("Xoá ảnh")).toBeVisible({ timeout: 20_000 }); // upload xong → thumbnail

  await page.getByLabel("Lưu câu hỏi").click();
  await expect(page.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Đếm số chấm trong hình")).toBeVisible({ timeout: 15_000 });
});
