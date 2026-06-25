import { expect, test } from "@playwright/test";

// US1 (T027): các màn mới của M2 render trên web (guest mode — không cần Supabase).
// Luồng mastery-unlock đầy đủ cần đăng nhập → kiểm ở môi trường có auth (ngoài CI, như auth-progress).

test("trang chủ tải + lộ trình cold-start + duyệt chủ đề", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Cùng học nhé!")).toBeVisible();
  // Guest: nhắc đăng nhập để lưu tiến độ
  await expect(page.getByText(/Đăng nhập để lưu tiến độ/)).toBeVisible();
  // Lộ trình hôm nay hiện (cold-start: gợi ý kỹ năng nền)
  await expect(page.getByText("Lộ trình hôm nay")).toBeVisible();
  // Vẫn duyệt được chủ đề (thẻ chủ đề có nhãn chính xác "Phân số")
  await expect(page.getByLabel("Phân số", { exact: true })).toBeVisible();
});

test("màn chẩn đoán mở được và hiển thị câu hỏi", async ({ page }) => {
  await page.goto("/diagnostic");
  await expect(page.getByText(/mình hiểu em đang ở đâu/)).toBeVisible();
  // Có nút Kiểm tra (màn luyện đang chờ trả lời)
  await expect(page.getByText("Kiểm tra")).toBeVisible();
});

test("bản đồ điểm yếu — trạng thái rỗng khi chưa có dữ liệu", async ({ page }) => {
  await page.goto("/heatmap");
  await expect(page.getByText("Bản đồ điểm yếu")).toBeVisible();
  await expect(page.getByText(/Chưa có dữ liệu/)).toBeVisible();
});
