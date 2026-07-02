import { expect, test } from "@playwright/test";

// CẦN Supabase + functions. Câu NHIỀU PHẦN LỒNG derivation (D44): a) numeric · b) trình bày từng
// bước (giải PT) → giao → HS làm đúng cả 2 phần → chấm CHÍNH THỨC server (gradeCompoundParts) → 100%.
test("câu nhiều phần lồng derivation: soạn a) numeric b) từng bước → giao → HS làm đúng → 100%", async ({
  browser,
}) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô CompoundDeriv");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvcd${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn câu nhiều phần: a) numeric 3+5=? (đáp án 8) · b) từng bước — giải 2x + 3 = 7
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Nhiều phần (a/b/c)").click();
  await gvPage.getByLabel("Đề bài").fill("Giải các phần sau (compound-deriv-e2e)");
  await gvPage.getByLabel("Đề phần a").fill("3 + 5 = ?");
  await gvPage.getByLabel("Đáp án đúng phần a").fill("8");
  await gvPage.getByLabel("Thêm phần").click();
  await gvPage.getByLabel("Loại phần b Từng bước").click();
  await gvPage.getByLabel("Đề phần b").fill("Giải phương trình sau, trình bày từng bước:");
  await gvPage.getByLabel("Kiểu bài Giải phương trình phần b").click();
  await gvPage.getByLabel("Đề derivation phần b").fill("2x + 3 = 7");
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp CompoundDeriv");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp CompoundDeriv").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT CompoundDeriv");
  await gvPage.getByLabel(/custom:Giải các phần sau \(compound-deriv-e2e\)/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT CompoundDeriv")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò CompoundDeriv");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hscd${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT CompoundDeriv").click();

  // Phần a (numeric): 8. Phần b (từng bước): 2x = 4 → x = 2.
  await hsPage.getByLabel("Phím 8").click();
  await hsPage.getByLabel("Dòng 1").fill("2x = 4");
  await hsPage.getByLabel("Thêm dòng").click();
  await hsPage.getByLabel("Dòng 2").fill("x = 2");

  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
