import { expect, test } from "@playwright/test";

// US2 (T039): XP + huy hiệu hiển thị. Guest mode — không cần Supabase.
// Luồng tích lũy streak/huy hiệu thật (ghi DB) kiểm ở môi trường có auth (ngoài CI).

test("hồ sơ (guest): mời đăng nhập + lưới huy hiệu chưa mở kèm điều kiện", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByText("Hồ sơ")).toBeVisible();
  await expect(page.getByText(/Đăng nhập để tích XP/)).toBeVisible();
  // Huy hiệu seed hiện ở trạng thái chưa mở (khóa) + điều kiện đạt
  await expect(page.getByText("Ba ngày bền bỉ")).toBeVisible();
  await expect(page.getByText("Luyện 3 ngày liên tiếp")).toBeVisible();
});

test("kết quả phiên: hiển thị XP nhận được + ăn mừng huy hiệu mới", async ({ page }) => {
  const data = encodeURIComponent(
    JSON.stringify({
      total: 5,
      correct: 4,
      score: 0.8,
      wrong: [],
      xpGained: 55,
      totalXp: 155,
      newBadgeIds: ["streak-3"],
    }),
  );
  await page.goto(`/result?topic=Ph%C3%A2n%20s%E1%BB%91&topicId=g4.num.fractions&data=${data}`);

  await expect(page.getByText("Hoàn thành phiên!")).toBeVisible();
  // Lời đánh giá theo tỉ lệ đúng (4/5 = 80% → "Giỏi lắm"), KHÔNG còn câu cố định.
  await expect(page.getByText(/Giỏi lắm/)).toBeVisible();
  // XP nhận được trong phiên + tổng XP
  await expect(page.getByText("+55")).toBeVisible();
  await expect(page.getByText(/Tổng XP: 155/)).toBeVisible();
  // Ăn mừng huy hiệu mới (resolve từ catalog thật)
  await expect(page.getByText(/mở huy hiệu mới/)).toBeVisible();
  await expect(page.getByText("Ba ngày bền bỉ")).toBeVisible();
});
