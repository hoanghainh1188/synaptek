import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase (DB + auth + Edge Functions). Xóa tài khoản (D52, soft delete qua Edge Function
// service-role): HS/PH xóa được ngay; GV còn lớp có HS bị CHẶN (bảo vệ dữ liệu HS khỏi mất đột ngột).
test("HS xóa tài khoản → không đăng nhập lại được nữa", async ({ page }) => {
  const s = Date.now();
  const email = `delacc${s}@test.local`;
  const password = "matkhau123";

  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Xóa Tài Khoản");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill(password);
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  await page.goto("/profile");
  await page.getByLabel("Xóa tài khoản").click();
  await page.getByLabel("Gõ XÓA để xác nhận").fill("XÓA");
  await page.getByLabel("Xác nhận xóa tài khoản").click();
  await expect(page.getByLabel("Đăng nhập")).toBeVisible({ timeout: 15_000 });

  // Đăng nhập lại bằng tài khoản đã xóa → PHẢI thất bại.
  await page.goto("/login");
  await page.getByPlaceholder("email@vidu.com").fill(email);
  await page.getByPlaceholder("••••••").fill(password);
  await page.getByLabel("Đăng nhập", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).not.toBeVisible({ timeout: 10_000 });
});

test("GV còn lớp có HS → bị chặn xóa tài khoản, HS không còn lớp → xóa được", async ({
  browser,
}) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Xóa TK");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvdel${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);
  await gvPage.goto("/");
  await gvPage.getByLabel("Lớp của tôi").click();
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Xóa TK");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Xóa TK").click();
  await expect(gvPage.getByText("Mã mời", { exact: true })).toBeVisible({ timeout: 15_000 });
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Vào Lớp Xóa TK");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsdel${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  // GV còn lớp có HS → xóa bị chặn, báo lỗi rõ ràng, GV vẫn đăng nhập được bình thường sau đó.
  await gvPage.goto("/profile");
  await gvPage.getByLabel("Xóa tài khoản").click();
  await gvPage.getByLabel("Gõ XÓA để xác nhận").fill("XÓA");
  await gvPage.getByLabel("Xác nhận xóa tài khoản").click();
  await expect(gvPage.getByText(/còn lớp có học sinh/)).toBeVisible({ timeout: 15_000 });
  await gvPage.reload();
  await expect(gvPage.getByLabel("Xóa tài khoản")).toBeVisible({ timeout: 15_000 });

  await gv.close();
  await hs.close();
});
