import { expect, test } from "@playwright/test";

// US3 (T035): lọc lớp dưới → luyện chủ đề lớp 2.
test("ôn lớp dưới: lọc lớp 2 → luyện Bảng nhân", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Phân số", { exact: true }).waitFor(); // home (lớp 4 mặc định) đã load

  // Chuyển sang lớp 2
  await page.getByLabel("Lớp 2").click();
  await page.getByLabel("Bảng nhân", { exact: true }).click();

  // Câu đầu: 2 × 3 = ? → nhập 6 (keypad)
  await expect(page.getByText("2 × 3 = ?")).toBeVisible();
  await page.getByText("6", { exact: true }).click(); // phím 6
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible();
});
