import { expect, test } from "@playwright/test";

// Luồng KHÁCH (nội dung bundle, không cần Supabase). Bộ chọn 2 tầng cấp→lớp (D54) — nay đã có nội dung
// THCS thật (Toán lớp 6 Số nguyên, pilot) nên hàng "Cấp" HIỆN với Tiểu học + THCS.
test("bộ chọn 2 tầng: Tiểu học 1–5 ↔ THCS 6–9, chuyển cấp đổi dải lớp", async ({ page }) => {
  await page.goto("/");
  // Mặc định Tiểu học: có hàng "Cấp" + lớp 1–5, chưa có lớp 6.
  await expect(page.getByLabel("Cấp Tiểu học")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Cấp THCS")).toBeVisible();
  for (const g of [1, 2, 3, 4, 5]) await expect(page.getByLabel(`Lớp ${g}`)).toBeVisible();
  await expect(page.getByLabel("Lớp 6")).toHaveCount(0);

  // Chuyển THCS: dải lớp đổi sang 6–9, mất 1–5.
  await page.getByLabel("Cấp THCS").click();
  for (const g of [6, 7, 8, 9]) await expect(page.getByLabel(`Lớp ${g}`)).toBeVisible();
  await expect(page.getByLabel("Lớp 1")).toHaveCount(0);
  await expect(page.getByLabel("Số nguyên")).toBeVisible();
});

// THCS Toán lớp 6 (Số nguyên) — chấm đúng câu số nguyên âm (engine đã hỗ trợ số âm, D45-style).
test("THCS lớp 6 Số nguyên: luyện + chấm đúng câu số âm", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  await page.getByLabel("Số nguyên").click();
  await expect(page).toHaveURL(/practice\/g6\.num\.integers/, { timeout: 10_000 });
  // Câu đầu "Số đối của -9 là số nào?" → 9.
  await expect(page.getByText("Số đối của -9")).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Phím 9").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});
