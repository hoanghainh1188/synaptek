import { expect, test } from "@playwright/test";
import { waitSignedIn } from "./_helpers";

// CẦN Supabase (KHÔNG cần functions). BXH lớp: HS thấy bạn cùng lớp + XP, có đánh dấu "(em)".
test("bảng xếp hạng lớp hiện bạn cùng lớp + XP", async ({ browser }) => {
  const s = Date.now();

  const gv = await browser.newContext();
  const gvPage = await gv.newPage();
  await gvPage.goto("/login");
  await gvPage.getByText("Chưa có tài khoản? Đăng ký").click();
  await gvPage.getByPlaceholder("Tên của em").fill("Cô BXH");
  await gvPage.getByLabel("Giáo viên").click();
  await gvPage.getByPlaceholder("email@vidu.com").fill(`gvb${s}@test.local`);
  await gvPage.getByPlaceholder("••••••").fill("matkhau123");
  await gvPage.getByText("Đăng ký", { exact: true }).click();
  await waitSignedIn(gvPage);
  await gvPage.goto("/classes");
  await gvPage.getByPlaceholder("Tên lớp (vd: Toán 4A)").fill("Lớp BXH");
  await gvPage.getByLabel("Tạo lớp").click();
  await gvPage.getByLabel("Lớp BXH").click();
  const code = (await gvPage.locator("text=/^[0-9A-Z]{6}$/").first().textContent())?.trim() ?? "";

  const join = async (name: string, email: string, practice: boolean) => {
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
    if (practice) {
      await p.goto("/practice/g4.num.fractions");
      await p.getByLabel("1/2").click();
      await p.getByText("Kiểm tra").click();
      await expect(p.getByText(/Tuyệt vời/)).toBeVisible({ timeout: 15_000 });
    }
    return p;
  };
  const aPage = await join("Trò A", `lba${s}@test.local`, true); // có XP
  await join("Trò B", `lbb${s}@test.local`, false); // 0 XP

  // Trò A mở lớp → BXH thấy cả A (em) lẫn B
  await aPage.goto("/my-classes");
  await aPage.getByText("Lớp BXH").click();
  await expect(aPage.getByText("🏆 Bảng xếp hạng")).toBeVisible({ timeout: 15_000 });
  await expect(aPage.getByText(/Trò A \(em\)/)).toBeVisible({ timeout: 15_000 });
  await expect(aPage.getByText("Trò B", { exact: true })).toBeVisible({ timeout: 15_000 });

  await gv.close();
});
