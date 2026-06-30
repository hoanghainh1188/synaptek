import { expect, test } from "@playwright/test";

// Luồng KHÁCH (nội dung bundle, không cần Supabase). Duyệt theo MÔN: chọn Tiếng Việt → hiện chủ đề TV;
// mở chủ đề → vào màn luyện tập. (Mục "gợi ý lộ trình" vẫn liệt kê kỹ năng mọi môn — không kiểm ở đây.)
test("duyệt theo môn: chọn Tiếng Việt → hiện chủ đề TV", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Môn Tiếng Việt").click();
  // Đổi môn → tự nhảy về lớp 1 (lớp có nội dung TV)
  await expect(page.getByLabel("Từ chỉ sự vật, hoạt động")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Chính tả: c/k, g/gh, ng/ngh")).toBeVisible();
});

test("mở chủ đề Tiếng Việt → vào màn luyện tập", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Môn Tiếng Việt").click();
  await page.getByLabel("Từ chỉ sự vật, hoạt động").click();
  await expect(page).toHaveURL(/practice\/tv\.g1\.tuloai/, { timeout: 10_000 });
});
