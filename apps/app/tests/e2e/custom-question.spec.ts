import { expect, test } from "@playwright/test";

// CẦN Supabase + functions serve (chấm). KHÔNG chạy ở CI (auth-gated).
// GV soạn câu tự tạo → giao cho lớp → HS làm → chấm server-side (đáp án ẩn, lấy từ DB).
test("GV soạn câu → giao → HS làm → chấm", async ({ browser }) => {
  const s = Date.now();

  // GV: đăng ký + soạn câu mcq
  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Thầy Tự Soạn");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvq${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  await gvPage.goto("/questions");
  await gvPage.getByLabel("Đề bài").fill("Tự soạn: 2 + 2 = ?");
  await gvPage.getByLabel("Lựa chọn 1").fill("4");
  await gvPage.getByLabel("Lựa chọn 2").fill("5");
  await gvPage.getByLabel("Đáp án đúng 1").click(); // chọn "4" làm đáp án
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  // GV: tạo lớp + giao bài dùng câu tự soạn
  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp Tự Soạn");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp Tự Soạn").click();
  // lấy mã mời để HS vào
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT Tự Soạn");
  await gvPage.getByLabel("custom:Tự soạn: 2 + 2 = ?").click(); // chọn câu tự soạn
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT Tự Soạn")).toBeVisible({ timeout: 15_000 });

  // HS: vào lớp + làm bài
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hsq${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  await hsPage.goto("/assignments");
  await hsPage.getByText("BT Tự Soạn").click();
  await hsPage.getByLabel("4").click(); // đáp án đúng (ẩn — chấm ở Edge)
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});

// Loại câu mới: true-false — soạn → giao → HS làm → chấm.
test("GV soạn câu Đúng/Sai → giao → HS làm → chấm", async ({ browser }) => {
  const s = Date.now();
  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Thầy TF");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvtf${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();

  // Soạn câu true-false (đáp án Đúng)
  await gvPage.goto("/questions");
  await gvPage.getByLabel("Đúng/Sai").click();
  await gvPage.getByLabel("Đề bài").fill("TF: 2 + 2 = 4?");
  await gvPage.getByLabel("Đáp án Đúng").click();
  await gvPage.getByLabel("Lưu câu hỏi").click();
  await expect(gvPage.getByText("Đã lưu câu hỏi ✓")).toBeVisible({ timeout: 15_000 });

  // Tạo lớp + giao bài dùng câu TF
  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp TF");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp TF").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("BT TF");
  await gvPage.getByLabel("custom:TF: 2 + 2 = 4?").click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText("BT TF")).toBeVisible({ timeout: 15_000 });

  // HS vào lớp + làm
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Trò TF");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hstf${s}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  await hsPage.goto("/assignments");
  await hsPage.getByText("BT TF").click();
  await hsPage.getByLabel("Đúng").click(); // đáp án đúng
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });

  await gv.close();
  await hs.close();
});
