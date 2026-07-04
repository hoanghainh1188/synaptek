import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase. GV đăng ký → Ngân hàng câu → Nhập nhiều câu bằng Markdown → xem trước có tự-chấm → lưu.
test("nhập câu hàng loạt từ Markdown: xem trước tự-chấm + lưu", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô Markdown");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`md${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  await page.goto("/questions");
  await page.getByLabel("Nhập nhiều câu từ Markdown").click();
  await expect(page).toHaveURL(/questions-import/, { timeout: 10_000 });

  // Dán 2 câu: 1 số + 1 trắc nghiệm — cả hai tự-chấm đúng.
  const md = "### Tính 2 + 3\nanswer: 5\n\n### Số nào lớn hơn: -3 hay -8?\n* [x] -3\n* [ ] -8";
  await page.getByLabel("Nội dung Markdown").fill(md);

  // Xem trước: 2/2 hợp lệ.
  await expect(page.getByText(/2\/2 câu hợp lệ/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Câu xem trước 1 hợp lệ")).toBeVisible();
  await expect(page.getByLabel("Câu xem trước 2 hợp lệ")).toBeVisible();

  // Lưu → báo đã lưu 2 câu.
  await page.getByLabel("Lưu các câu hợp lệ").click();
  await expect(page.getByText(/Đã lưu 2 câu/)).toBeVisible({ timeout: 15_000 });
});

// Câu soạn SAI đáp án bị đánh dấu lỗi ở xem trước (tự-chấm bắt được), không cho lưu.
test("Markdown: câu đáp án sai bị đánh dấu lỗi ở xem trước", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô MD2");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`md2${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  await page.goto("/questions-import");
  // mcq KHÔNG đánh dấu lựa chọn đúng → parser báo lỗi (issue), không dựng câu.
  await page.getByLabel("Nội dung Markdown").fill("### Chọn số lớn\n* [ ] 3\n* [ ] 8");
  await expect(page.getByText(/Chưa đánh dấu/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/0\/0 câu hợp lệ/)).toBeVisible();
});
