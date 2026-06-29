import { expect, test } from "@playwright/test";

// CẦN Supabase (KHÔNG cần functions). Soạn thảo nâng cao: sửa câu tự soạn · tìm/đếm · xem trước · nhân bản.
test("authoring nâng cao: sửa câu · tìm/đếm/preview · nhân bản bài", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Thầy Adv");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`adv${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  // (1) Sửa câu tự soạn
  await page.goto("/questions");
  await page.getByLabel("Số", { exact: true }).click();
  await page.getByLabel("Đề bài").fill("Câu gốc 2+2");
  await page.getByLabel("Đáp án đúng").fill("4");
  await page.getByLabel("Lưu câu hỏi").click();
  await expect(page.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Sửa câu Câu gốc 2+2").click();
  await page.getByLabel("Đề bài").fill("Câu đã sửa 2+2 = ?");
  await page.getByLabel("Cập nhật câu hỏi").click();
  await expect(page.getByText("Đã cập nhật ✓")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Câu đã sửa 2+2 = ?")).toBeVisible({ timeout: 15_000 });

  // (2)(3) Tạo lớp → composer: tìm/đếm/xem trước
  await page.goto("/classes");
  await page.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Adv");
  await page.getByLabel("Tạo lớp").click();
  await page.getByLabel("Lớp Adv").click();
  await page.getByLabel("Soạn bài tập").click();
  await page.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Adv");
  await expect(page.getByText("Đã chọn 0 câu")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Phân số").first().click();
  await page.getByLabel("g4.num.fractions.q001").click();
  await expect(page.getByText("Đã chọn 1 câu")).toBeVisible({ timeout: 15_000 });
  // tìm/lọc
  await page.getByLabel("Tìm câu hỏi").fill("không-khớp-gì-cả");
  await expect(page.getByLabel("g4.num.fractions.q001")).toHaveCount(0);
  await page.getByLabel("Tìm câu hỏi").fill("");
  // xem trước
  await page.getByLabel("Xem trước").click();
  await expect(page.getByText(/Xem trước \(1 câu\)/)).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Giao bài", { exact: true }).click();
  await expect(page.getByText("BT Adv")).toBeVisible({ timeout: 15_000 });

  // (4) Nhân bản
  await page.getByLabel("Nhân bản BT Adv").click();
  await expect(page.getByText("BT Adv (sao chép)")).toBeVisible({ timeout: 15_000 });
});
