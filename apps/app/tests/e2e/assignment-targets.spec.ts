import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase (KHÔNG cần functions). Giao bài cho HS cụ thể: chỉ HS được nhắm thấy bài.
test("giao cho HS cụ thể: chỉ HS được nhắm thấy bài", async ({ browser }) => {
  const s = Date.now();
  const title = `Bài riêng ${s}`;

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô Target");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvt${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);
  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp TGT");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp TGT").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  // 2 HS vào lớp
  const join = async (name: string, email: string) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto("/login");
    await p.getByText("Chưa có tài khoản? Đăng ký").click();
    await p.getByPlaceholder("Tên của em").fill(name);
    await p.getByPlaceholder("email@vidu.com").fill(email);
    await p.getByPlaceholder("••••••").fill("matkhau123");
    await p.getByText("Đăng ký", { exact: true }).click();
    await waitSignedIn(p);
    await p.goto("/join");
    await p.getByPlaceholder("VD: 7K2MQ9").fill(code);
    await p.getByLabel("Vào lớp").click();
    await expect(p.getByText(/Đã vào lớp/)).toBeVisible({ timeout: 15_000 });
    return p;
  };
  const aPage = await join("Trò A", `ta${s}@test.local`);
  const bPage = await join("Trò B", `tb${s}@test.local`);

  // GV soạn bài → giao CHỈ Trò A
  await gvPage.getByLabel("Soạn bài tập").click();
  await gvPage.getByPlaceholder("VD: Ôn tập Phân số").fill(title);
  await gvPage.getByLabel("Giao một số HS").click();
  await gvPage.getByLabel("Chọn Trò A").click();
  await gvPage.getByLabel("Phân số").first().click();
  await gvPage.getByLabel("g4.num.fractions.q001").click();
  await gvPage.getByLabel("Giao bài", { exact: true }).click();
  await expect(gvPage.getByText(title)).toBeVisible({ timeout: 15_000 });

  // Trò A thấy; Trò B KHÔNG thấy
  await aPage.goto("/assignments");
  await expect(aPage.getByText(title)).toBeVisible({ timeout: 15_000 });
  await bPage.goto("/assignments");
  await bPage.waitForTimeout(1500);
  await expect(bPage.getByText(title)).toHaveCount(0);

  await gv.close();
});
