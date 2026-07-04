import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase (chấm client + lưu attempt qua RLS; KHÔNG cần functions). KHÔNG chạy ở CI (auth-gated).
// HS làm sai 1 câu → trang chủ hiện "Ôn lại câu sai" → ôn lại đúng → câu được giải quyết (mất khỏi danh sách).
test("ôn lại câu sai: sai → ôn → đúng → tự loại", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Ôn");
  await page.getByPlaceholder("email@vidu.com").fill(`rev${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  // Làm SAI câu đầu chủ đề Phân số (q001 mcq: đúng "1/2", chọn "1/3" = sai)
  await page.goto("/practice/g4.num.fractions");
  await page.getByLabel("1/3").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Gần đúng/).first()).toBeVisible({ timeout: 15_000 });

  // Trang chủ: hiện lối ôn lại
  await page.goto("/");
  const entry = page.getByLabel(/Ôn lại câu sai/);
  await expect(entry).toBeVisible({ timeout: 15_000 });
  await entry.click();

  // Màn ôn: chờ lựa chọn (chỉ có ở màn ôn) rồi làm ĐÚNG "1/2"
  await expect(page.getByLabel("1/2")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("1/2").click();
  await page.getByLabel("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/).first()).toBeVisible({ timeout: 15_000 });

  // Màn kết quả (SessionResult dùng chung): có % đúng + nút Luyện lại
  await page.getByText("Xem kết quả →").click();
  await expect(page.getByText(/% đúng/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Luyện lại")).toBeVisible();

  // Về trang chủ: không còn lối "Ôn lại câu sai" (đã giải quyết)
  await page.goto("/");
  await expect(page.getByLabel(/Ôn lại câu sai/)).toHaveCount(0, { timeout: 15_000 });
});
