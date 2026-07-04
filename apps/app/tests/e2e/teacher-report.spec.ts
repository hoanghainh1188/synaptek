import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase + functions serve (chấm). KHÔNG chạy ở CI (auth-gated).
// GV tạo lớp + giao bài → HS nộp (100%) → GV xem "Báo cáo lớp" thấy HS + 100%.
test("GV xem báo cáo lớp (HS × bài + điểm)", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Báo Cáo");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvr${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp BC");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp BC").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT BC");
  await gvPage.getByLabel("Phân số").first().click();
  await gvPage.getByLabel("g4.num.fractions.q001").click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT BC")).toBeVisible({ timeout: 15_000 });

  // HS vào lớp + nộp đúng
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò BC");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsr${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT BC").click();
  await hsPage.getByLabel("1/2").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  // GV mở báo cáo → thấy HS + 100%
  await gvPage.getByLabel("Báo cáo lớp").click();
  await expect(gvPage.getByText("Trò BC")).toBeVisible({ timeout: 15_000 });
  await expect(gvPage.getByText("100%").first()).toBeVisible({ timeout: 15_000 });
  // Insight: mục "Cần chú ý" hiện (HS 100% → 0 cảnh báo)
  await expect(gvPage.getByText(/Cần chú ý/)).toBeVisible({ timeout: 15_000 });

  await gv.close();
  await hs.close();
});
