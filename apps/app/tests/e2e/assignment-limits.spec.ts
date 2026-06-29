import { expect, test } from "@playwright/test";

// Giới hạn nộp (D25) — CẦN Supabase + `supabase functions serve`. KHÔNG chạy ở CI (auth-gated).
// GV đặt "số lần nộp tối đa = 1" → HS nộp 1 lần → hết lượt (server tăng attempt_count; nút bị khoá).
test("giới hạn số lần nộp: 1 lần → hết lượt sau khi nộp", async ({ browser }) => {
  const stamp = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Thu");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gv${stamp}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Toán 4D");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Toán 4D").click();
  await expect(gvPage.getByText("Mã mời", { exact: true })).toBeVisible({ timeout: 15_000 });
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("KT 1 lần");
  await gvPage.getByLabel("Số lần nộp tối đa").fill("1");
  await gvPage.getByLabel("Phân số").first().click();
  await gvPage.getByLabel("g4.num.fractions.q001").click();
  await gvPage.getByLabel("Giao bài").click();
  await expect(gvPage.getByText("1 câu · chạm để chấm")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Bo");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hs${stamp}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  await hsPage.goto("/assignments");
  await hsPage.getByText("KT 1 lần").click();
  await expect(hsPage.getByText(/Còn 1 lượt nộp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.getByLabel("1/2").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  // Hết lượt: server đã tăng attempt_count → reload thấy "Còn 0 lượt" + nút khoá.
  await hsPage.reload();
  await expect(hsPage.getByText(/Còn 0 lượt nộp/)).toBeVisible({ timeout: 15_000 });
  await expect(hsPage.getByText(/hết lượt nộp/)).toBeVisible();

  await gv.close();
  await hs.close();
});
