import { expect, type Page } from "@playwright/test";

// Chờ trạng thái ĐÃ đăng nhập (nút avatar "Hồ sơ" ở trang chủ hiện khi có user, mọi vai trò) sau khi
// đăng ký/đăng nhập. Dùng SAU mỗi lần bấm "Đăng ký"/"Đăng nhập" và TRƯỚC khi điều hướng tiếp — chống
// race: serve tĩnh (CI) tải trang tức thì nên `goto` có thể xảy ra trước khi session kịp lưu localStorage,
// khiến trang mở ra ở trạng thái guest. Dev server chậm nên trước đây vô tình che lỗi này.
export async function waitSignedIn(page: Page): Promise<void> {
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });
}
