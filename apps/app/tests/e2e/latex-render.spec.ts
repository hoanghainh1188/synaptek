import { expect, test } from "@playwright/test";

// CẦN Supabase. LaTeX thật qua KaTeX (D53, web-only): soạn câu có phân số + lũy thừa trong đề bài →
// lưu → xem lại trong danh sách → phải render qua KaTeX thật (class .katex), không phải chữ thô
// "1/2"/"x^2". parseMathMarkup/segmentToLatex đã có unit test riêng (math-markup.test.ts) — test này
// verify tích hợp thật với KaTeX + component MathText.web.tsx.
test("soạn câu có phân số + lũy thừa trong đề bài → render qua KaTeX thật", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô LaTeX");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`latex${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();

  await page.goto("/questions");
  await page.getByLabel("Số", { exact: true }).click();
  await page.getByLabel("Đề bài").fill(`Tính 1/2 cộng x^2 (mã ${s})`);
  await page.getByLabel("Đáp án đúng").fill("1");
  await page.getByLabel("Lưu câu hỏi").click();
  await expect(page.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  const saved = page.getByText(new RegExp(`mã ${s}`));
  await expect(saved).toBeVisible({ timeout: 15_000 });
  // KaTeX render ra ít nhất 2 khối .katex (phân số 1/2 + lũy thừa x^2) trong câu vừa lưu.
  const katexCount = await page.locator(".katex").count();
  expect(katexCount).toBeGreaterThanOrEqual(2);
});
