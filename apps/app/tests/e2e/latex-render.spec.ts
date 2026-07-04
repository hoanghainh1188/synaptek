import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

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
  await waitSignedIn(page);

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

// Guest, không cần Supabase. Bug thật đã gặp: CSS KaTeX không nạp được (Metro không resolve @import
// CSS trỏ node_modules) → phân số render KHÔNG có style → "1/2" hiện thành chữ phẳng sai thứ tự "21"
// (mẫu số trước tử số theo thứ tự DOM của KaTeX). Test đếm số phần tử .katex là CHƯA ĐỦ để bắt lỗi này
// (DOM vẫn có phần tử .katex hợp lệ dù CSS không nạp) — phải verify CSS thật sự áp dụng + thứ tự ngữ
// nghĩa qua MathML (<mfrac> con đúng thứ tự tử/mẫu, không phụ thuộc CSS).
test("phân số MCQ render đúng: CSS KaTeX nạp được + đúng thứ tự tử/mẫu (MathML)", async ({
  page,
}) => {
  await page.goto("/practice/g4.num.fractions");

  // <link> CSS nạp qua useEffect (bất đồng bộ) rồi cần round-trip mạng để load thật — poll thay vì
  // check 1 lần (check ngay lúc goto() xong từng flaky vì CSS chưa kịp nạp).
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.styleSheets).some((sheet) => {
            try {
              return Array.from(sheet.cssRules).some((r) => r.cssText.includes(".katex"));
            } catch {
              return false;
            }
          }),
        ),
      { timeout: 15_000 },
    )
    .toBe(true);

  // Câu đầu "Phân số nào lớn hơn?" có 2 lựa chọn 1/2, 1/3 (content/questions/g4.num.fractions.json).
  const firstFrac = page.locator(".katex mfrac").first();
  await expect(firstFrac).toBeVisible({ timeout: 15_000 });
  const [num, den] = await firstFrac.locator("> *").allTextContents();
  expect(num).toBe("1");
  expect(den).toBe("2");
});
