import { expect, test } from "@playwright/test";

// M3 US1 (T015) — CẦN Supabase chạy + apps/app/.env. KHÔNG chạy ở CI (như auth-progress).
// Luồng: GV đăng ký (vai trò Giáo viên) → tạo lớp → lấy mã; HS (context khác) đăng ký → /join nhập mã →
// vào lớp; GV thấy HS trong roster. RLS cô lập đã kiểm riêng ở supabase/tests/rls-0003.sql.
test("GV tạo lớp + HS vào bằng mã → GV thấy roster", async ({ browser }) => {
  const stamp = Date.now();

  // ── Context GV ───────────────────────────────────────────────────────────────
  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Lan");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gv${stamp}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Toán 4A");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Toán 4A").click();
  await expect(gvPage.getByText("Mã mời", { exact: true })).toBeVisible({ timeout: 15_000 });
  // Đọc mã mời (chuỗi in hoa/số ngay dưới nhãn "Mã mời")
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  expect(code).toMatch(/^[0-9A-Z]{6}$/);

  // ── Context HS ───────────────────────────────────────────────────────────────
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Minh");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hs${stamp}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();

  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  // ── GV thấy HS trong roster ────────────────────────────────────────────────────
  await gvPage.reload();
  await expect(gvPage.getByText("Bé Minh")).toBeVisible({ timeout: 15_000 });

  await gv.close();
  await hs.close();
});
