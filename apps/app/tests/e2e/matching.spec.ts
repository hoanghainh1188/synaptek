import { expect, test } from "@playwright/test";

// CẦN Supabase + functions. Câu NỐI CẶP: soạn → giao → HS ghép (chạm) → nộp → chấm (có điểm).
test("câu nối cặp: soạn → giao → HS ghép → chấm", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Match");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvmt${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn nối cặp: 2+2→4, 3+3→6
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Nối cặp").click();
  await gvPage.getByLabel("Đề bài").fill("Nối phép tính với kết quả");
  await gvPage.getByLabel("Vế trái 1").fill("2+2");
  await gvPage.getByLabel("Vế phải 1").fill("4");
  await gvPage.getByLabel("Vế trái 2").fill("3+3");
  await gvPage.getByLabel("Vế phải 2").fill("6");
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Match");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Match").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Match");
  await gvPage.getByLabel(/custom:Nối phép tính/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Match")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Match");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsmt${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Match").click();
  // Thấy giao diện ghép + chạm chọn cho mỗi vế trái
  await expect(hsPage.getByText("Chạm để chọn vế phải cho mỗi vế trái:")).toBeVisible({
    timeout: 15_000,
  });
  await hsPage.getByLabel("Ghép 2+2").click();
  await hsPage.getByLabel("Ghép 3+3").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: \d+%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
