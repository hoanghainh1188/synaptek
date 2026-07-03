import { expect, test } from "@playwright/test";

// CẦN Supabase. Đổi tên hiển thị (D49): đăng ký với tên A → vào Hồ sơ → sửa thành tên B → tải lại
// trang → vẫn thấy tên B (đã lưu vào profiles.full_name, không chỉ state cục bộ).
test("đổi tên hiển thị: sửa tên rồi tải lại trang vẫn giữ tên mới", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Tên Cũ");
  await page.getByPlaceholder("email@vidu.com").fill(`dispname${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  await page.goto("/profile");
  await expect(page.getByText("Tên Cũ")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Đổi tên hiển thị").click();
  await page.getByLabel("Tên hiển thị mới").fill("Tên Mới");
  await page.getByLabel("Lưu tên hiển thị").click();
  await expect(page.getByText("Tên Mới")).toBeVisible({ timeout: 15_000 });

  // Tải lại trang — tên mới phải đến từ DB (profiles.full_name), không phải state cục bộ.
  await page.reload();
  await expect(page.getByText("Tên Mới")).toBeVisible({ timeout: 15_000 });
});
