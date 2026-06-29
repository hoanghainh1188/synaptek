import { expect, test } from "@playwright/test";

// CẦN Supabase + functions (chấm). GV soạn câu CHỌN NHIỀU → giao → HS chọn đúng tập → 100%.
test("câu chọn nhiều đáp án: soạn → giao → HS chọn đúng tập → chấm 100%", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Multi");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvm${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn câu chọn nhiều: "Chọn số chẵn" → 2,3,4; đúng = 2 và 4
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Chọn nhiều").click();
  await gvPage.getByLabel("Đề bài").fill("Chọn các số chẵn");
  await gvPage.getByLabel("Lựa chọn 1").fill("2");
  await gvPage.getByLabel("Lựa chọn 2").fill("3");
  await gvPage.getByLabel("Thêm lựa chọn").click();
  await gvPage.getByLabel("Lựa chọn 3").fill("4");
  await gvPage.getByLabel("Đáp án đúng 1").click(); // 2
  await gvPage.getByLabel("Đáp án đúng 3").click(); // 4
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  // Tạo lớp + giao bài gồm câu này
  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Multi");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Multi").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Multi");
  await gvPage.getByLabel(/custom:Chọn các số chẵn/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Multi")).toBeVisible({ timeout: 15_000 });

  // HS làm: chọn 2 và 4 → nộp → 100%
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Multi");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsm${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Multi").click();
  await hsPage.getByLabel("2", { exact: true }).click();
  await hsPage.getByLabel("4", { exact: true }).click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
