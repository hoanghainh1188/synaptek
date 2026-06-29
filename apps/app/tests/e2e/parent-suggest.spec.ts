import { expect, test } from "@playwright/test";

// CẦN Supabase. PH gợi ý hành động: con có điểm yếu → PH thấy "💡 Gợi ý" → giao bài prefilled câu.
test("PH gợi ý ôn điểm yếu → giao bài đã chọn sẵn câu", async ({ browser }) => {
  const s = Date.now();

  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé Sug");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`sug${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  // Luyện 1 câu → tạo dữ liệu điểm yếu
  await hsPage.goto("/practice/g4.num.fractions");
  await hsPage.getByLabel("1/2").click();
  await hsPage.getByText("Kiểm tra").click();
  await expect(hsPage.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 15_000 });
  // Tạo mã liên kết
  await hsPage.goto("/profile");
  await hsPage.getByLabel("Tạo mã liên kết phụ huynh").click();
  const code = (await hsPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  const ph = await browser.newContext();
  const phPage = await ph.newPage();
  await phPage.goto("/login");
  await phPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await phPage.getByPlaceholder("Tên của em").fill("Mẹ Sug");
  await phPage.getByLabel("Phụ huynh").click();
  await phPage.getByPlaceholder("email@vidu.com").fill(`momsug${s}@test.local`);
  await phPage.getByPlaceholder("••••••").fill("matkhau123");
  await phPage.getByText("Đăng ký", { exact: true }).click();
  await phPage.goto("/children");
  await phPage.getByPlaceholder("Mã con cung cấp").fill(code);
  await phPage.getByLabel("Liên kết").click();
  await expect(phPage.getByText(/Đã liên kết/)).toBeVisible({ timeout: 15_000 });
  await phPage.getByLabel("Theo dõi Bé Sug").click();

  // Gợi ý hiện → giao bài → composer đã chọn sẵn câu
  await expect(phPage.getByText("💡 Gợi ý tuần này")).toBeVisible({ timeout: 15_000 });
  await phPage.getByLabel("Giao bài ôn điểm yếu").click();
  await expect(phPage.getByText(/Đã chọn [1-9]\d* câu/)).toBeVisible({ timeout: 15_000 });

  await hs.close();
  await ph.close();
});
