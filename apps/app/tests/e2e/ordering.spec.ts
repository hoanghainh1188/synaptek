import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase + functions. Câu SẮP THỨ TỰ: soạn → giao → HS thấy controls ↑↓ → nộp → chấm (có điểm).
test("câu sắp thứ tự: soạn → giao → HS sắp xếp → chấm", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Order");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvr${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  // Soạn ordering: 1,2,3 (đúng thứ tự)
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Sắp thứ tự").click();
  await gvPage.getByLabel("Đề bài").fill("Sắp xếp tăng dần");
  await gvPage.getByLabel("Mục 1").fill("1");
  await gvPage.getByLabel("Mục 2").fill("2");
  await gvPage.getByLabel("Thêm mục").click();
  await gvPage.getByLabel("Mục 3").fill("3");
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Order");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Order").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Order");
  await gvPage.getByLabel(/custom:Sắp xếp tăng dần/).click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Order")).toBeVisible({ timeout: 15_000 });

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò Order");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsr${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Order").click();
  // Thấy controls sắp xếp + tương tác (đưa "1" lên đầu)
  await expect(hsPage.getByText("Sắp đúng thứ tự (dùng ↑ ↓):")).toBeVisible({ timeout: 15_000 });
  await hsPage.getByLabel("Lên 1").click();
  await hsPage.getByLabel("Lên 1").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: \d+%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
