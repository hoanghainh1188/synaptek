import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase (KHÔNG cần functions cho phần đếm). Pool: GV giao 3 câu, mỗi HS nhận 2 ngẫu nhiên.
test("ngẫu nhiên hoá pool: HS chỉ nhận N câu từ pool", async ({ browser }) => {
  const s = Date.now();
  const title = `Pool ${s}`;

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Pool");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvp${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);
  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Pool");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Pool").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  // GV soạn: pool 3 câu, mỗi HS 2 câu
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill(title);
  await gvPage.getByLabel("Phân số").first().click();
  await gvPage.getByLabel("g4.num.fractions.q001").click();
  await gvPage.getByLabel("g4.num.fractions.q002").click();
  await gvPage.getByLabel("g4.num.fractions.q003").click();
  await gvPage.getByLabel("Số câu ngẫu nhiên mỗi HS").fill("2");
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText(title)).toBeVisible({ timeout: 15_000 });

  // HS vào lớp + mở bài → thấy ĐÚNG 2 câu (không phải 3)
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Pool");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsp${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText(title).click();
  await expect(hsPage.getByTestId(/^assignment-q-/).first()).toBeVisible({ timeout: 15_000 });
  await expect(hsPage.getByTestId(/^assignment-q-/)).toHaveCount(2);

  await gv.close();
  await hs.close();
});
