import { expect, test } from "@playwright/test";

// Luồng KHÁCH (nội dung bundle, không cần Supabase). Bộ chọn 2 tầng cấp→lớp (D-mở rộng, khung THCS/THPT):
// hiện tại nội dung CHỈ Tiểu học (lớp 1–5) nên hàng "Cấp" KHÔNG hiện (tránh tab trống) — picker giữ
// nguyên như cũ: một hàng "Lớp 1..5". Test này KHOÁ hành vi tương thích ngược đó; khi có nội dung THCS
// thật, hàng "Cấp" mới xuất hiện (đã verify riêng bằng fixture tạm lúc build, không commit fixture).
test("bộ chọn lớp: chỉ Tiểu học → KHÔNG có hàng 'Cấp', hiện lớp 1..5", async ({ page }) => {
  await page.goto("/");
  // Hàng "Lớp" với đủ 5 lớp Tiểu học.
  for (const g of [1, 2, 3, 4, 5]) {
    await expect(page.getByLabel(`Lớp ${g}`)).toBeVisible({ timeout: 10_000 });
  }
  // Chưa có nội dung THCS/THPT → không lớp 6+ và KHÔNG hàng "Cấp".
  await expect(page.getByLabel("Lớp 6")).toHaveCount(0);
  await expect(page.getByLabel("Cấp Tiểu học")).toHaveCount(0);
  await expect(page.getByLabel("Cấp THCS")).toHaveCount(0);
});
