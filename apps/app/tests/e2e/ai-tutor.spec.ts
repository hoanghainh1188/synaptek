import { expect, test } from "@playwright/test";

// CẦN Supabase + functions. Gia sư AI (D46): sau khi HS trả lời SAI, nút "Hỏi tại sao sai?" gọi Edge
// Function ai-tutor-explain — MÔI TRƯỜNG TEST CHƯA CÓ ANTHROPIC_API_KEY (thực trạng hiện tại) nên phải
// trả lỗi THÂN THIỆN "chưa sẵn sàng" (không throw/crash) — verify graceful-degrade, không gọi API thật.
test("gia sư AI: nút hỏi hiện khi sai, báo lỗi thân thiện khi chưa cấu hình key", async ({
  page,
}) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Tutor");
  await page.getByPlaceholder("email@vidu.com").fill(`tutor${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await expect(page.getByLabel("Hồ sơ", { exact: true })).toBeVisible({ timeout: 25_000 });

  // Trả lời SAI câu mcq đầu tiên (đáp án đúng là 1/2)
  await page.goto("/practice/g4.num.fractions");
  await page.getByLabel("1/3").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Gần đúng rồi/)).toBeVisible({ timeout: 15_000 });

  // Nút hỏi gia sư AI hiện (chỉ khi sai) — bấm → chưa cấu hình key → lỗi thân thiện, không crash.
  const askBtn = page.getByLabel("Hỏi tại sao sai");
  await expect(askBtn).toBeVisible();
  await askBtn.click();
  await expect(page.getByText(/Gia sư AI chưa sẵn sàng/)).toBeVisible({ timeout: 15_000 });

  // Vẫn đi tiếp bình thường được (tính năng không chặn luồng luyện tập).
  await page.getByText("Tiếp tục →").click();
});
