import { expect, test } from "@playwright/test";

// CẦN Supabase. Đổi mật khẩu khi ĐÃ đăng nhập (D48, khác quên mật khẩu qua email): đăng ký → Hồ sơ →
// Đổi mật khẩu → xác thực mật khẩu hiện tại + đặt mật khẩu mới → đăng xuất → đăng nhập bằng mật khẩu
// MỚI thành công (mật khẩu cũ không còn dùng được).
test("đổi mật khẩu: sai mật khẩu hiện tại bị từ chối, đúng thì đổi thành công", async ({
  page,
}) => {
  const s = Date.now();
  const email = `changepw${s}@test.local`;
  const oldPassword = "matkhau123";
  const newPassword = "matkhaumoi789";

  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé ChangePw");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill(oldPassword);
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  await page.goto("/profile");
  await page.getByLabel("Đổi mật khẩu").click();
  await expect(page).toHaveURL(/change-password/);

  // Sai mật khẩu hiện tại → báo lỗi, KHÔNG đổi được.
  await page.getByLabel("Mật khẩu hiện tại").fill("sai-mat-khau");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(newPassword);
  await page.getByLabel("Nhập lại mật khẩu mới").fill(newPassword);
  await page.getByLabel("Xác nhận đổi mật khẩu").click();
  await expect(page.getByText(/Mật khẩu hiện tại không đúng/)).toBeVisible({ timeout: 15_000 });

  // Đúng mật khẩu hiện tại → đổi thành công.
  await page.getByLabel("Mật khẩu hiện tại").fill(oldPassword);
  await page.getByLabel("Xác nhận đổi mật khẩu").click();
  await expect(page.getByText(/Đã đổi mật khẩu/)).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Về hồ sơ").click();

  // Đăng xuất rồi đăng nhập lại bằng mật khẩu MỚI để xác nhận đã đổi thật.
  await page.getByLabel("Đăng xuất").click();
  await page.getByLabel("Xác nhận đăng xuất").click();
  await expect(page.getByLabel("Đăng nhập")).toBeVisible({ timeout: 15_000 });

  await page.goto("/login");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill(newPassword);
  await page.getByLabel("Đăng nhập", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 15_000 });
});
