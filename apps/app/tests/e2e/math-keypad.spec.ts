import { expect, test } from "@playwright/test";

// CẦN Supabase + functions. Bàn phím TOÁN có cấu trúc cho câu BIỂU THỨC: HS nhập "2(x+2)" bằng nút
// ( ) x ^ → chấm tương đương "2x+4" (engine, D9) → 100%.
test("bàn phím cấu trúc: nhập 2(x+2) bằng nút → chấm tương đương", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Expr");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvkp${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn câu biểu thức (đáp án 2x+4)
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Biểu thức").click();
  await gvPage.getByLabel("Đề bài").fill("Rút gọn: 2(x+2)");
  await gvPage.getByLabel("Đáp án đúng").fill("2x+4");
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Expr");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Expr").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Expr");
  await gvPage.getByLabel(/custom:Rút gọn/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Expr")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Expr");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hskp${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Expr").click();
  // Nhập 2(x+2) bằng bàn phím cấu trúc
  for (const k of ["2", "(", "x", "+", "2", ")"]) {
    await hsPage.getByLabel(`Phím ${k}`).click();
  }
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
