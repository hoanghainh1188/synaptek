import { expect, test } from "@playwright/test";

// Luồng KHÁCH (client chấm, không cần Supabase). Trình bày từng bước: đúng → trọn vẹn; sai → định vị dòng.
test("step-practice: giải đúng từng bước → 'Đúng trọn vẹn'", async ({ page }) => {
  await page.goto("/step-practice");
  await page.getByLabel("Bài arith-1").click(); // 12 + 3 × 4
  await page.getByLabel("Dòng 1").fill("12 + 12");
  await page.getByLabel("Thêm dòng").click();
  await page.getByLabel("Dòng 2").fill("24");
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Đúng trọn vẹn/)).toBeVisible({ timeout: 10_000 });
});

test("step-practice: bước sai → báo 'Sai từ dòng N'", async ({ page }) => {
  await page.goto("/step-practice");
  await page.getByLabel("Bài arith-1").click(); // 12 + 3 × 4 = 24
  await page.getByLabel("Dòng 1").fill("15 * 4"); // SAI: 12+3 trước → 60 ≠ 24
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Sai từ dòng 1/)).toBeVisible({ timeout: 10_000 });
});
