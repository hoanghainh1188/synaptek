import { expect, test } from "@playwright/test";

// CẦN Supabase + functions. Câu NHIỀU PHẦN (a/b): soạn 2 phần (numeric + mcq) → giao → HS làm đúng
// phần a, sai phần b → chấm CHÍNH THỨC server-side qua gradeCompound (điểm = trung bình = 50%).
test("câu nhiều phần: soạn 2 phần → giao → HS làm 1 đúng 1 sai → điểm trung bình", async ({
  browser,
}) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Compound");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvcp${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn câu nhiều phần: a) numeric 3+5=? (đáp án 8) · b) mcq chọn số chẵn (đáp án 4)
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Nhiều phần (a/b/c)").click();
  await gvPage.getByLabel("Đề bài").fill("Giải các phần sau (compound-e2e)");
  await gvPage.getByLabel("Đề phần a").fill("3 + 5 = ?");
  await gvPage.getByLabel("Đáp án đúng phần a").fill("8");
  await gvPage.getByLabel("Thêm phần").click();
  await gvPage.getByLabel("Loại phần b Trắc nghiệm").click();
  await gvPage.getByLabel("Đề phần b").fill("Số nào là số chẵn?");
  await gvPage.getByLabel("Lựa chọn phần b 1").fill("3");
  await gvPage.getByLabel("Lựa chọn phần b 2").fill("4");
  await gvPage.getByLabel("Đáp án đúng phần b 2").click();
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Compound");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Compound").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Compound");
  await gvPage.getByLabel(/custom:Giải các phần sau \(compound-e2e\)/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Compound")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Compound");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hscp${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Compound").click();

  // Phần a (numeric): trả lời ĐÚNG (8). Phần b (mcq): trả lời SAI (3, đáp án đúng là 4).
  await hsPage.getByLabel("Phím 8").click();
  await hsPage.getByLabel("3", { exact: true }).click();

  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 50%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
