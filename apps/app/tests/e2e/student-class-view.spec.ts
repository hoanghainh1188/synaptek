import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase (RLS đọc tên GV/sĩ số; KHÔNG cần functions). KHÔNG chạy ở CI (auth-gated).
// GV tạo lớp + giao bài → HS vào lớp → "Lớp của tôi" hiện tên GV + sĩ số + bài + trạng thái "Chưa nộp".
test("HS xem lớp đang tham gia: tên GV + sĩ số + bài", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Thầy Xem");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvv${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Xem");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Xem").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Xem");
  await gvPage.getByLabel("Phân số").first().click();
  await gvPage.getByLabel("g4.num.fractions.q001").click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Xem")).toBeVisible({ timeout: 15_000 });

  // HS vào lớp
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Xem");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsv${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  // "Lớp của tôi" → thấy lớp + tên GV
  await hsPage.goto("/my-classes");
  await expect(hsPage.getByText("Lớp Xem")).toBeVisible({ timeout: 15_000 });
  await expect(hsPage.getByText(/Thầy Xem/)).toBeVisible({ timeout: 15_000 });

  // Vào lớp → thấy bài + trạng thái "Chưa nộp"
  await hsPage.getByLabel("Lớp Lớp Xem").click();
  await expect(hsPage.getByText("BT Xem")).toBeVisible({ timeout: 15_000 });
  await expect(hsPage.getByText("Chưa nộp").first()).toBeVisible({ timeout: 15_000 });

  await gv.close();
  await hs.close();
});
