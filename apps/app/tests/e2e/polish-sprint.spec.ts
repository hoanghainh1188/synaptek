import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// Polish sprint — CẦN Supabase. KHÔNG chạy ở CI (auth-gated).
// (1) GV: tạo bài → SỬA tên → XOÁ. (2) Đổi vai trò trong Hồ sơ (student → teacher).

test("GV sửa + xoá bài tập", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô Edit");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`gve${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  await page.goto("/classes");
  await page.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Edit");
  await page.getByLabel("Tạo lớp").click();
  await page.getByLabel("Lớp Edit").click();

  // tạo bài
  await page.getByLabel("Soạn bài tập").click();
  await page.getByPlaceholder("VD: Ôn tập Phân số").fill("Bài Gốc");
  await page.getByLabel("Phân số").first().click();
  await page.getByLabel("g4.num.fractions.q001").click(); // chọn 1 câu (label = id, duy nhất)
  await page.getByLabel("Giao bài").click();
  await expect(page.getByText("Bài Gốc")).toBeVisible({ timeout: 15_000 });

  // sửa tên
  await page.getByLabel("Sửa Bài Gốc").click();
  await expect(page.getByText("Sửa bài tập")).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("VD: Ôn tập Phân số").fill("Bài Đã Sửa");
  await page.getByLabel("Lưu thay đổi").click();
  await expect(page.getByText("Bài Đã Sửa")).toBeVisible({ timeout: 15_000 });

  // xoá (có xác nhận)
  await page.getByLabel("Xoá Bài Đã Sửa").click();
  await page.getByLabel("Xác nhận xoá").click();
  await expect(page.getByText("Chưa giao bài nào.")).toBeVisible({ timeout: 15_000 });
});

// Học sinh (trẻ em) KHÔNG được tự đổi vai trò — không hiện nút đổi (chống tự "leo" lên GV/PH; DB cũng
// chặn ở migration 0026).
test("học sinh KHÔNG đổi được vai trò (khoá)", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Bé Role");
  await page.getByPlaceholder("email@vidu.com").fill(`role${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  await page.goto("/profile");
  await expect(page.getByLabel("Bài được giao")).toBeVisible({ timeout: 15_000 });
  // HS: thấy "Vai trò: Học sinh" nhưng KHÔNG có nút "Đổi vai trò".
  await expect(page.getByText(/Vai trò: Học sinh/)).toBeVisible();
  await expect(page.getByLabel("Đổi vai trò")).toHaveCount(0);
});

// GV vẫn đổi được vai trò nhưng CHỈ giữa GV<->PH (không có tuỳ chọn Học sinh).
test("giáo viên đổi vai trò sang phụ huynh (không có tuỳ chọn học sinh)", async ({ page }) => {
  const s = Date.now();
  await page.goto("/login");
  await page.getByText("Chưa có tài khoản? Đăng ký").click();
  await page.getByPlaceholder("Tên của em").fill("Cô Role");
  await page.getByLabel("Giáo viên").click();
  await page.getByPlaceholder("email@vidu.com").fill(`grole${s}@test.local`);
  await page.getByPlaceholder("••••••").fill("matkhau123");
  await page.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(page);

  await page.goto("/profile");
  await page.getByLabel("Đổi vai trò").click();
  await expect(page.getByLabel("Chọn Học sinh")).toHaveCount(0);
  await page.getByLabel("Chọn Phụ huynh").click();
  await page.getByLabel("Xác nhận đổi vai trò").click();
  await expect(page.getByLabel("Con của tôi")).toBeVisible({ timeout: 15_000 });
});
