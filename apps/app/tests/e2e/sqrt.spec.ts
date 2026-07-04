import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase + functions. Căn bậc hai (√, D45): câu numeric đáp án "4", HS gõ "√16" bằng bàn
// phím cấu trúc (nút √ mới) → chấm tương đương "4" (engine numericScalar căn hằng số) → 100%.
test("căn bậc hai: HS gõ √16 bằng bàn phím cấu trúc → chấm tương đương 4", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Sqrt");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvsq${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  // Soạn câu số (đáp án 4 — HS có thể gõ căn hoặc số đã tính)
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Số", { exact: true }).click();
  await gvPage.getByLabel("Đề bài").fill("Tính √16");
  await gvPage.getByLabel("Đáp án đúng").fill("4");
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Sqrt");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Sqrt").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Sqrt");
  await gvPage.getByLabel(/custom:Tính √16/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Sqrt")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Sqrt");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hssq${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Sqrt").click();
  // Gõ "√16" bằng nút bàn phím (không tính trước) — vẫn chấm tương đương 4.
  await hsPage.getByLabel("Phím √").click();
  await hsPage.getByLabel("Phím 1").click();
  await hsPage.getByLabel("Phím 6").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
