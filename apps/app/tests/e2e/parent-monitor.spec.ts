import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// M4 — CẦN Supabase. KHÔNG chạy ở CI (auth-gated).
// HS tạo mã → PH nhập → con hiện trong "Con của tôi" → PH mở bảng theo dõi (read-only).
test("PH liên kết con bằng mã + mở bảng theo dõi", async ({ browser }) => {
  const s = Date.now();

  // ── HS (con): tạo mã liên kết ────────────────────────────────────────────────
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Bin");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`kid${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);

  await hsPage.goto("/profile");
  await hsPage.getByLabel("Tạo mã liên kết phụ huynh").click();
  // mã hiện dạng 6 ký tự in hoa/số
  const code = (await hsPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  expect(code).toMatch(/^[0-9A-Z]{6}$/);

  // ── PH: đăng ký vai trò Phụ huynh → nhập mã ───────────────────────────────────
  const ph = await browser.newContext();
  const phPage = await ph.newPage();
  await phPage.goto("/login");
  await phPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await phPage.getByPlaceholder("Tên của em").fill("Mẹ Lan");
  await phPage.getByLabel("Phụ huynh").click();
  await phPage.getByPlaceholder("email@vidu.com").fill(`mom${s}@test.local`);
  await phPage.getByPlaceholder("••••••").fill("matkhau123");
  await phPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(phPage);

  await phPage.goto("/children");
  await phPage.getByPlaceholder("Mã con cung cấp").fill(code);
  await phPage.getByLabel("Liên kết").click();
  await expect(phPage.getByText(/Đã liên kết/)).toBeVisible({ timeout: 15_000 });
  await expect(phPage.getByText("Bé Bin")).toBeVisible({ timeout: 15_000 });

  // mở bảng theo dõi con
  await phPage.getByLabel("Theo dõi Bé Bin").click();
  await expect(phPage.getByText("Theo dõi tiến độ (chỉ xem)")).toBeVisible({ timeout: 15_000 });
  // Tóm tắt tuần (digest)
  await expect(phPage.getByText("Tuần này (7 ngày qua)")).toBeVisible({ timeout: 15_000 });

  // HS thấy PH đang theo dõi
  await hsPage.reload();
  await expect(hsPage.getByText("Mẹ Lan")).toBeVisible({ timeout: 15_000 });

  await hs.close();
  await ph.close();
});
