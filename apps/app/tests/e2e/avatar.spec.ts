import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase. Avatar: HS mới (0 XP) chọn avatar miễn phí; avatar cao XP bị khoá; lưu lại sau reload.
test("chọn avatar miễn phí; avatar cao XP bị khoá; lưu lại", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Avatar");
  await page.getByPlaceholder("email@vidu.com").fill(`av${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  await page.goto("/profile");
  await expect(page.getByText("Avatar của em")).toBeVisible({ timeout: 20_000 });
  // Avatar cao XP (Rồng 400) bị khoá với HS mới
  await expect(page.getByLabel("Avatar Rồng đã khoá")).toBeVisible({ timeout: 15_000 });
  // Chọn avatar miễn phí (Gấu trúc 🐼)
  await page.getByLabel("Chọn avatar Gấu trúc").click();

  // Lưu lại sau reload
  await page.reload();
  await expect(page.getByText("Avatar của em")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("🐼").first()).toBeVisible({ timeout: 15_000 });
});
