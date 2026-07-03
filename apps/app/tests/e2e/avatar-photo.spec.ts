import { expect, test } from "@playwright/test";
import path from "node:path";

// CẦN Supabase (DB + Storage). Avatar ảnh thật (D51, LỰA CHỌN THÊM bên cạnh emoji): upload → lưu →
// hiện ảnh thay emoji trong mục "Avatar của em" → "Dùng lại emoji" → quay về emoji.
test("avatar ảnh thật: upload → hiện ảnh → dùng lại emoji", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Avatar Ảnh");
  await page.getByPlaceholder("email@vidu.com").fill(`avatarphoto${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  await page.goto("/profile");
  const fcPromise = page.waitForEvent("filechooser");
  await page.getByLabel("Tải ảnh đại diện lên").click();
  const fc = await fcPromise;
  await fc.setFiles(path.join(process.cwd(), "tests/fixtures/dot.png"));
  await expect(page.getByLabel("Ảnh đại diện hiện tại")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel("Dùng lại emoji")).toBeVisible();

  // Tải lại trang — ảnh phải đến từ DB (profiles.avatar_photo_url), không phải state cục bộ.
  await page.reload();
  await expect(page.getByLabel("Ảnh đại diện hiện tại")).toBeVisible({ timeout: 15_000 });

  // Quay lại emoji.
  await page.getByLabel("Dùng lại emoji").click();
  await expect(page.getByLabel("Ảnh đại diện hiện tại")).not.toBeVisible({ timeout: 15_000 });
});
