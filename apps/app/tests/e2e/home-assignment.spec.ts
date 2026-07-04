import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase + functions serve (chấm). KHÔNG chạy ở CI (auth-gated).
// PH liên kết con → giao bài tại nhà → HS thấy & nộp → chấm server-side → PH thấy bài đã giao.
test("PH giao bài tại nhà → HS làm → chấm", async ({ browser }) => {
  const s = Date.now();

  // HS tạo mã liên kết
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Na");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`kid${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);
  await hsPage.goto("/profile");
  await hsPage.getByLabel("Tạo mã liên kết phụ huynh").click();
  const code = (await hsPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  // PH liên kết + giao bài
  const ph = await browser.newContext();
  const phPage = await ph.newPage();
  await phPage.goto("/login");
  await phPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await phPage.getByPlaceholder("Tên của em").fill("Bố Hùng");
  await phPage.getByLabel("Phụ huynh").click();
  await phPage.getByPlaceholder("email@vidu.com").fill(`dad${s}@test.local`);
  await phPage.getByPlaceholder("••••••").fill("matkhau123");
  await phPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(phPage);
  await phPage.goto("/children");
  await phPage.getByPlaceholder("Mã con cung cấp").fill(code);
  await phPage.getByLabel("Liên kết").click();
  await phPage.getByLabel("Theo dõi Bé Na").click();
  await phPage.getByLabel("Giao bài cho con").click();
  await expect(phPage.getByPlaceholder("VD: Ôn tập Phân số")).toBeVisible({ timeout: 15_000 });
  await phPage.getByPlaceholder("VD: Ôn tập Phân số").fill("Bài nhà 1");
  await phPage.getByLabel("Phân số").first().click();
  await phPage.getByLabel("g4.num.fractions.q001").click();
  await phPage.getByLabel("Giao bài", { exact: true }).click();
  // quay lại bảng theo dõi: thấy "Bài đã giao"
  await expect(phPage.getByText("Bài nhà 1")).toBeVisible({ timeout: 15_000 });

  // HS thấy bài & nộp
  await hsPage.goto("/assignments");
  await expect(hsPage.getByText("Bài nhà 1")).toBeVisible({ timeout: 15_000 });
  await hsPage.getByText("Bài nhà 1").click();
  // q001 là mcq, đáp án đúng "1/2" → chọn (choice có accessibilityLabel) rồi nộp
  await hsPage.getByLabel("1/2").click();
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await hs.close();
  await ph.close();
});
