import { expect, test } from "@playwright/test";

// CẦN Supabase. Đăng xuất thiết bị khác (D50): dùng signOut({scope:"others"}) — chỉ thu hồi REFRESH
// TOKEN của các phiên khác (không có API kiểm tra ngay lập tức phiên khác đã mất hiệu lực chưa, vì
// access token JWT vẫn còn hạn tới khi hết hạn/refresh tiếp theo — đây là hành vi CHUẨN của JWT).
// Test verify: luồng xác nhận hoạt động đúng + phiên HIỆN TẠI (người gọi) không bị đăng xuất theo.
test("đăng xuất thiết bị khác: xác nhận thành công, phiên hiện tại vẫn còn", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé OtherDevices");
  await page.getByPlaceholder("email@vidu.com").fill(`otherdev${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  await page.goto("/profile");
  await page.getByLabel("Đăng xuất khỏi thiết bị khác").click();
  await page.getByLabel("Xác nhận đăng xuất thiết bị khác").click();
  await expect(page.getByText(/Đã đăng xuất thiết bị khác/)).toBeVisible({ timeout: 15_000 });

  // Phiên hiện tại (người vừa gọi) KHÔNG bị đăng xuất theo — vẫn ở trong Hồ sơ, tải lại vẫn còn đăng nhập.
  await expect(page.getByLabel("Đổi mật khẩu")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Đổi mật khẩu")).toBeVisible({ timeout: 15_000 });
});
