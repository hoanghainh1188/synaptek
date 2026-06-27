import { expect, test } from "@playwright/test";

// M3 US3 (T032) — CẦN Supabase + `supabase functions serve`. KHÔNG chạy ở CI (auth-gated).
// GV giao bài → HS nộp (100%) → GV ghi đè 70% + nhận xét → HS thấy ĐIỂM CUỐI 70% + nhận xét (audit).
test("GV ghi đè điểm + nhận xét → HS thấy điểm cuối", async ({ browser }) => {
  const stamp = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Mai");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gv${stamp}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Toán 4C");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Toán 4C").click();
  await expect(gvPage.getByText("Mã mời", { exact: true })).toBeVisible({ timeout: 15_000 });
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("KT Phân số");
  await gvPage.getByLabel("Phân số").first().click();
  await gvPage.getByText("Phân số nào lớn hơn?").click();
  await gvPage.getByLabel("Giao bài").click();
  await expect(gvPage.getByText("1 câu")).toBeVisible({ timeout: 15_000 });

  // HS vào + nộp đúng (100%)
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Na");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hs${stamp}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("KT Phân số").click();
  await hsPage.getByLabel("1/2").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  // GV chấm tay: ghi đè 70% + nhận xét
  await gvPage.goto("/classes");
  await gvPage.getByLabel("Toán 4C").click();
  await gvPage.getByLabel("Chấm KT Phân số").click();
  await expect(gvPage.getByLabel("Điểm cho Bé Na")).toBeVisible({ timeout: 15_000 });
  await gvPage.getByLabel("Điểm cho Bé Na").fill("70");
  await gvPage.getByPlaceholder("Nhận xét cho em…").fill("Cần trình bày rõ hơn.");
  await gvPage.getByLabel("Lưu điểm").click();
  await expect(gvPage.getByText(/Đã lưu/)).toBeVisible({ timeout: 15_000 });

  // HS thấy điểm cuối 70% + nhận xét
  await hsPage.reload();
  await expect(hsPage.getByText(/Điểm: 70%/)).toBeVisible({ timeout: 15_000 });
  await expect(hsPage.getByText(/Cần trình bày rõ hơn/)).toBeVisible();

  await gv.close();
  await hs.close();
});
