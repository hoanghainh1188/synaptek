import { expect, test } from "@playwright/test";

// Luồng KHÁCH (nội dung bundle, không cần Supabase). Bộ chọn 2 tầng cấp→lớp (D54) — nay đã có nội dung
// THCS thật (Toán lớp 6 Số nguyên, pilot) nên hàng "Cấp" HIỆN với Tiểu học + THCS.
test("bộ chọn 2 tầng: Tiểu học 1–5 ↔ THCS 6–9, chuyển cấp đổi dải lớp", async ({ page }) => {
  await page.goto("/");
  // Mặc định Tiểu học: có hàng "Cấp" + lớp 1–5, chưa có lớp 6.
  await expect(page.getByLabel("Cấp Tiểu học")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Cấp THCS")).toBeVisible();
  for (const g of [1, 2, 3, 4, 5]) await expect(page.getByLabel(`Lớp ${g}`)).toBeVisible();
  await expect(page.getByLabel("Lớp 6")).toHaveCount(0);

  // Chuyển THCS: dải lớp đổi sang 6–9, mất 1–5. Lớp 6 có 2 chủ đề: Số nguyên + Phân số.
  await page.getByLabel("Cấp THCS").click();
  for (const g of [6, 7, 8, 9]) await expect(page.getByLabel(`Lớp ${g}`)).toBeVisible();
  await expect(page.getByLabel("Lớp 1")).toHaveCount(0);
  await expect(page.getByLabel("Số nguyên")).toBeVisible();
  // exact: tránh khớp nhầm thẻ gợi ý "Khái niệm phân số" (cold-start reco chứa chuỗi "phân số").
  await expect(page.getByLabel("Phân số", { exact: true })).toBeVisible();
});

// THCS Toán lớp 6 (Số nguyên) — chấm đúng câu số nguyên âm (engine đã hỗ trợ số âm, D45-style).
test("THCS lớp 6 Số nguyên: luyện + chấm đúng câu số âm", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  await page.getByLabel("Số nguyên").click();
  await expect(page).toHaveURL(/practice\/g6\.num\.integers/, { timeout: 10_000 });
  // Câu đầu "Số đối của -9 là số nào?" → 9.
  await expect(page.getByText("Số đối của -9")).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Phím 9").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});

// THCS Toán lớp 6 (Phân số) — khoe moat: HS nhập phân số CHƯA rút gọn tương đương vẫn chấm ĐÚNG.
test("THCS lớp 6 Phân số: nhập phân số tương đương vẫn đúng (moat)", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  await page.getByLabel("Phân số", { exact: true }).click();
  await expect(page).toHaveURL(/practice\/g6\.num\.fractions/, { timeout: 10_000 });
  // Câu đầu "Rút gọn phân số 6/8 về tối giản" → 3/4. Engine chấm theo GIÁ TRỊ nên 9/12 (=3/4) cũng đúng.
  // MathText render "6/8" thành phân số (tách node) → chỉ khớp phần text liền trước.
  await expect(page.getByText(/Rút gọn phân số/)).toBeVisible({ timeout: 10_000 });
  for (const k of ["9", "/", "1", "2"]) await page.getByLabel(`Phím ${k}`).click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});

// THCS Toán lớp 6 (Số thập phân) — chấm đúng số thập phân ÂM nhập bằng dấu phẩy VN (D8).
test("THCS lớp 6 Số thập phân: nhập số thập phân âm (phẩy VN) → chấm đúng", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  await page.getByLabel("Số thập phân", { exact: true }).click();
  await expect(page).toHaveURL(/practice\/g6\.num\.decimals/, { timeout: 10_000 });
  // Câu đầu "Số đối của 2,5 là số nào?" → -2,5. Bàn phím numeric có phím '-' và ',' (D8/D45).
  await expect(page.getByText(/Số đối của 2,5/)).toBeVisible({ timeout: 10_000 });
  for (const k of ["-", "2", ",", "5"]) await page.getByLabel(`Phím ${k}`).click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});

// THCS Toán lớp 6 (Số tự nhiên) — luyện + chấm đúng câu lũy thừa.
test("THCS lớp 6 Số tự nhiên: luyện lũy thừa → chấm đúng", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  // exact: tránh khớp nhầm skill lớp 4 chứa "số tự nhiên" (cold-start reco).
  await page.getByLabel("Số tự nhiên", { exact: true }).click();
  await expect(page).toHaveURL(/practice\/g6\.num\.naturals/, { timeout: 10_000 });
  // Câu đầu "Tính giá trị lũy thừa: 2^3" → 8. MathText render "2^3" thành mũ → assert text liền trước.
  await expect(page.getByText(/Tính giá trị lũy thừa/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Phím 8").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});

// THCS Toán lớp 6 (Hình học trực quan) — mạch mới "Hình học và Đo lường", chấm đúng câu nhận biết hình.
test("THCS lớp 6 Hình học: nhận biết hình → chấm đúng", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  await page.getByLabel("Hình học trực quan", { exact: true }).click();
  await expect(page).toHaveURL(/practice\/g6\.geo\.plane/, { timeout: 10_000 });
  // Câu đầu "Hình có 6 cạnh bằng nhau và 6 góc bằng nhau là hình gì?" → Lục giác đều (mcq).
  await expect(page.getByText(/6 cạnh bằng nhau/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Lục giác đều").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});

// THCS Toán lớp 6 (Xác suất) — mạch mới thứ 3 "Thống kê và Xác suất", chấm đúng câu đếm kết quả.
test("THCS lớp 6 Xác suất: đếm kết quả có thể → chấm đúng", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cấp THCS").click();
  // exact: skill name chứa "Thống kê"/"Xác suất" (cold-start reco).
  await expect(page.getByLabel("Thống kê", { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Xác suất", { exact: true }).click();
  await expect(page).toHaveURL(/practice\/g6\.sta\.prob/, { timeout: 10_000 });
  // Câu đầu "Gieo một con xúc xắc 6 mặt. Có mấy kết quả có thể xảy ra?" → 6.
  await expect(page.getByText(/mấy kết quả có thể/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Phím 6").click();
  await page.getByText("Kiểm tra").click();
  await expect(page.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 10_000 });
});
