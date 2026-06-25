import { expect, test } from "@playwright/test";

// US1 (T016): luyện tập một chủ đề → chấm tức thì → feedback.
test("luyện tập chủ đề và được chấm tức thì", async ({ page }) => {
  await page.goto("/");

  // Trang chủ hiển thị
  await expect(page.getByText("Cùng học nhé!")).toBeVisible();

  // Chọn chủ đề Phân số
  await page.getByLabel("Phân số", { exact: true }).click();

  // Màn luyện tập: câu đầu (mcq) "Phân số nào lớn hơn?"
  await expect(page.getByText("Phân số nào lớn hơn?")).toBeVisible();

  // Chọn đáp án đúng "1/2" rồi Kiểm tra
  await page.getByLabel("1/2").click();
  await page.getByText("Kiểm tra").click();

  // Phản hồi: Đúng (tức thì)
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible();
  await expect(page.getByText("Tiếp tục →")).toBeVisible();
});

// Chấm sai → phản hồi không phán xét.
test("đáp án sai → phản hồi động viên", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Phân số", { exact: true }).click();
  await expect(page.getByText("Phân số nào lớn hơn?")).toBeVisible();
  await page.getByLabel("1/3").click(); // đáp án sai
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Gần đúng rồi/)).toBeVisible();
});
