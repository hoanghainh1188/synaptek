import { expect, test } from "@playwright/test";

// CẦN Supabase (Mailpit cục bộ bắt email — KHÔNG cần Resend thật, xem D47). Đăng ký → đăng xuất →
// yêu cầu khôi phục → lấy link từ Mailpit (SMTP giả cục bộ khi chạy `supabase start`) → đặt mật khẩu
// mới → xác nhận đăng nhập được bằng mật khẩu MỚI (mật khẩu cũ không còn dùng được).
const MAILPIT_URL = "http://127.0.0.1:54324";

test("quên mật khẩu: đăng ký → khôi phục qua email → đăng nhập bằng mật khẩu mới", async ({
  page,
  request,
}) => {
  const s = Date.now();
  const email = `forgot${s}@test.local`;
  const oldPassword = "matkhau123";
  const newPassword = "matkhaumoi456";

  // Đăng ký rồi đăng xuất — để cuối bài kiểm tra đăng nhập lại đúng bằng mật khẩu MỚI.
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Forgot");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill(oldPassword);
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });
  await page.goto("/profile");
  await page.getByLabel("Đăng xuất", { exact: true }).click();
  await page.getByLabel("Xác nhận đăng xuất").click();
  await expect(page.getByLabel("Đăng nhập")).toBeVisible({ timeout: 15_000 });

  // Yêu cầu khôi phục
  await page.goto("/login");
  await page.getByLabel("Quên mật khẩu").click();
  await expect(page).toHaveURL(/forgot-password/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Gửi email khôi phục").click();
  await expect(page.getByText(/Đã gửi email/)).toBeVisible({ timeout: 15_000 });

  // Lấy link khôi phục từ Mailpit — poll vì gửi email là bất đồng bộ (server → SMTP giả).
  let resetLink = "";
  for (let i = 0; i < 20 && !resetLink; i++) {
    const res = await request.get(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    if (res.ok()) {
      const data = await res.json();
      const msg = data.messages?.[0];
      const id = msg?.ID ?? msg?.id;
      if (id) {
        const full = await request.get(`${MAILPIT_URL}/api/v1/message/${id}`);
        const body = await full.json();
        const html: string = body.HTML ?? body.html ?? body.Text ?? body.text ?? "";
        const m = html.match(/href="([^"]+)"/) ?? html.match(/(https?:\/\/[^\s"<]+)/);
        // Href trong HTML mã hoá "&" thành "&amp;" — cần giải mã trước khi dùng làm URL thật.
        if (m) resetLink = m[1].replace(/&amp;/g, "&");
      }
    }
    if (!resetLink) await page.waitForTimeout(500);
  }
  expect(resetLink, "không thấy email khôi phục ở Mailpit").not.toBe("");

  // Mở link khôi phục → đặt mật khẩu mới
  await page.goto(resetLink);
  await expect(page.getByLabel("Mật khẩu mới")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Mật khẩu mới").fill(newPassword);
  await page.getByLabel("Nhập lại mật khẩu").fill(newPassword);
  await page.getByLabel("Đổi mật khẩu").click();
  await expect(page.getByText(/Đã đổi mật khẩu/)).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Về trang chủ").click();

  // Đăng xuất (phòng khi phiên recovery vẫn còn) rồi đăng nhập lại bằng mật khẩu MỚI để xác nhận thật.
  await page.goto("/profile");
  await page.getByLabel("Đăng xuất", { exact: true }).click();
  await page.getByLabel("Xác nhận đăng xuất").click();
  await page.goto("/login");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill(newPassword);
  await page.getByLabel("Đăng nhập", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 15_000 });
});
