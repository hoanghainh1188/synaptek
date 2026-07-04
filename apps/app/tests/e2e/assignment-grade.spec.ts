import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// M3 US2 (T025) — CẦN Supabase + `supabase functions serve grade-assignment`. KHÔNG chạy ở CI (auth-gated).
// GV (vai trò Giáo viên) tạo lớp + giao bài Phân số; HS vào lớp + nộp → chấm chính thức server-side hiện điểm.
test("GV giao bài → HS nộp → chấm chính thức hiện điểm", async ({ browser }) => {
  const stamp = Date.now();

  // ── GV: tạo lớp + giao bài ────────────────────────────────────────────────────
  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Hoa");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gv${stamp}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);

  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Toán 4B");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Toán 4B").click();
  await expect(gvPage.getByText("Mã mời", { exact: true })).toBeVisible({ timeout: 15_000 });
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill("Phân số");
  await gvPage.getByLabel("Phân số").first().click(); // chủ đề Phân số
  // chọn câu đầu tiên hiện ra (checkbox row)
  await gvPage.getByLabel("g4.num.fractions.q001").click();
  await gvPage.getByLabel("Giao bài").click(); // nút giao (đáy composer)
  await expect(gvPage.getByText("1 câu · chạm để chấm")).toBeVisible({ timeout: 15_000 });

  // ── HS: vào lớp + làm + nộp ────────────────────────────────────────────────────
  const hs = await browser.newContext();
  const hsPage = await hs.newPage();
  await hsPage.goto("/login");
  await hsPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await hsPage.getByPlaceholder("Tên của em").fill("Bé An");
  await hsPage.getByPlaceholder("email@vidu.com").fill(`hs${stamp}@test.local`);
  await hsPage.getByPlaceholder("••••••").fill("matkhau123");
  await hsPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(hsPage);

  await hsPage.goto("/join");
  await hsPage.getByPlaceholder("VD: 7K2MQ9").fill(code);
  await hsPage.getByLabel("Vào lớp").click();
  await expect(hsPage.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });

  await hsPage.goto("/assignments");
  await hsPage.getByText("Phân số").click();
  await hsPage.getByLabel("1/2").click(); // đáp án đúng
  await hsPage.getByLabel("Nộp bài").click();
  await expect(hsPage.getByText(/Điểm: 100%/)).toBeVisible({ timeout: 20_000 });
  // Sau khi nộp: hiện lời giải câu content (đáp án + giải thích)
  await expect(hsPage.getByText("Lời giải").first()).toBeVisible({ timeout: 15_000 });

  await gv.close();
  await hs.close();
});
