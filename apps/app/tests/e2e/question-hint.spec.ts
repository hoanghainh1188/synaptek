import { expect, test } from "@playwright/test";

// CẦN Supabase (KHÔNG cần functions). Gợi ý kèm câu: GV soạn có gợi ý → HS thấy "💡" khi làm.
test("gợi ý kèm câu: HS thấy gợi ý khi làm bài", async ({ browser }) => {
  const s = Date.now();
  const hintText = `Nhớ quy đồng ${s}`;

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Hint");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvh${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn câu số có gợi ý
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Số", { exact: true }).click();
  await gvPage.getByLabel("Đề bài").fill("2 + 3 = ?");
  await gvPage.getByLabel("Đáp án đúng").fill("5");
  await gvPage.getByLabel("Gợi ý").fill(hintText);
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Hint");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Hint").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Hint");
  await gvPage.getByLabel(/custom:2 \+ 3/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Hint")).toBeVisible({ timeout: 15_000 });

  // HS làm → thấy gợi ý
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Hint");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsh${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Hint").click();
  await expect(hsPage.getByText(hintText)).toBeVisible({ timeout: 15_000 });

  await gv.close();
  await hs.close();
});
