import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase + functions. Fill-blank "không theo thứ tự" → HS điền đúng tập (khác vị trí) vẫn 100%.
test("tùy chọn chấm: fill-blank không theo thứ tự", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Opt");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvo${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  // Soạn fill-blank 3 ô (2,4,6), bật KHÔNG theo thứ tự
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Điền chỗ trống").click();
  await gvPage.getByLabel("Đề bài").fill("Ba số chẵn đầu: __ __ __");
  await gvPage.getByLabel("Đáp án ô 1").fill("2");
  await gvPage.getByLabel("Đáp án ô 2").fill("4");
  await gvPage.getByLabel("Thêm ô đáp án").click();
  await gvPage.getByLabel("Đáp án ô 3").fill("6");
  await gvPage.getByLabel("Không theo thứ tự").click();
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Opt");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Opt").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Opt");
  await gvPage.getByLabel(/custom:Ba số chẵn đầu/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Opt")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Opt");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hso${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Opt").click();
  // Điền KHÁC thứ tự: 6, 2, 4 (tập đúng) → unordered → 100%
  await hsPage.getByPlaceholder("Ô 1").fill("6");
  await hsPage.getByPlaceholder("Ô 2").fill("2");
  await hsPage.getByPlaceholder("Ô 3").fill("4");
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
