import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase + functions. Câu TRÌNH BÀY TỪNG BƯỚC: soạn (phương trình) → giao → HS nộp lời giải nhiều dòng
// → chấm CHÍNH THỨC server-side qua step-grading (đạt đích x = số → 100%).
test("câu trình bày từng bước: soạn → giao → HS nộp lời giải → chấm", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Deriv");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvdv${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  // Soạn câu derivation (giải phương trình 2x + 3 = 7)
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Trình bày từng bước").click();
  await gvPage.getByLabel("Đề bài").fill("Giải phương trình sau, trình bày từng bước:");
  await gvPage.getByLabel("Giải phương trình").click();
  await gvPage.getByLabel("Đề derivation").fill("2x + 3 = 7");
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Deriv");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Deriv").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Deriv");
  await gvPage.getByLabel(/custom:Giải phương trình/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Deriv")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Deriv");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsdv${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Deriv").click();
  // Nhập lời giải từng bước: 2x = 4 → x = 2
  await hsPage.getByLabel("Dòng 1").fill("2x = 4");
  await hsPage.getByLabel("Thêm dòng").click();
  await hsPage.getByLabel("Dòng 2").fill("x = 2");
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
