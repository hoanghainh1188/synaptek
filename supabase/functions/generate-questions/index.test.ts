// Test AI nháp câu (D-authoring-ai). deno test generate-questions/index.test.ts
// Chỉ test hàm THUẦN (validateInput/buildUserMessage) — không gọi Gemini thật/không cần Supabase live.
import { assertEquals, assert } from "jsr:@std/assert@1";
import { validateInput, buildUserMessage } from "./index.ts";

Deno.test("validateInput: hợp lệ → trả object đã trim", () => {
  const r = validateInput({ topic: " số nguyên lớp 6 ", count: 5 });
  assert(r);
  assertEquals(r?.topic, "số nguyên lớp 6");
  assertEquals(r?.count, 5);
  assertEquals(r?.subject, undefined);
});

Deno.test("validateInput: kèm subject", () => {
  const r = validateInput({ topic: "phân số", count: 3, subject: "Toán" });
  assertEquals(r?.subject, "Toán");
});

Deno.test("validateInput: topic rỗng → null", () => {
  assertEquals(validateInput({ topic: "   ", count: 3 }), null);
});

Deno.test("validateInput: topic quá dài → null", () => {
  assertEquals(validateInput({ topic: "a".repeat(301), count: 3 }), null);
});

Deno.test("validateInput: count không hợp lệ (0, âm, >20, không nguyên) → null", () => {
  for (const c of [0, -1, 21, 2.5, "x"]) {
    assertEquals(validateInput({ topic: "x", count: c }), null, `count=${c}`);
  }
});

Deno.test("validateInput: count biên 1 và 20 hợp lệ", () => {
  assert(validateInput({ topic: "x", count: 1 }));
  assert(validateInput({ topic: "x", count: 20 }));
});

Deno.test("buildUserMessage: chứa số câu + chủ đề + môn", () => {
  const m = buildUserMessage({ topic: "cộng trừ số nguyên", count: 4, subject: "Toán" });
  assert(m.includes("4 câu"));
  assert(m.includes("cộng trừ số nguyên"));
  assert(m.includes("Môn: Toán"));
  assert(m.includes("###"));
});

Deno.test("buildUserMessage: không môn thì không nhắc 'Môn:'", () => {
  const m = buildUserMessage({ topic: "phân số", count: 2 });
  assert(!m.includes("Môn:"));
});
