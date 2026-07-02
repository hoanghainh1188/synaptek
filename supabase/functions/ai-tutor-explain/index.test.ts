// Test gia sư AI (D46). deno test ai-tutor-explain/index.test.ts
// Chỉ test hàm THUẦN (validateInput/buildUserMessage) — không gọi Gemini thật/không cần Supabase live.
import { assertEquals, assert } from "jsr:@std/assert@1";
import { validateInput, buildUserMessage, type ExplainInput } from "./index.ts";

Deno.test("validateInput: hợp lệ → trả object đã trim", () => {
  const r = validateInput({ prompt: " 2+2=? ", studentAnswer: " 5 ", correctAnswer: "4" });
  assert(r);
  assertEquals(r?.prompt, "2+2=?");
  assertEquals(r?.studentAnswer, "5");
  assertEquals(r?.correctAnswer, "4");
});

Deno.test("validateInput: thiếu trường bắt buộc → null", () => {
  assertEquals(validateInput({ prompt: "x", studentAnswer: "y" }), null);
});

Deno.test("validateInput: chuỗi rỗng/chỉ khoảng trắng → null", () => {
  assertEquals(validateInput({ prompt: "  ", studentAnswer: "y", correctAnswer: "z" }), null);
});

Deno.test("validateInput: chuỗi quá dài → null (chống lạm dụng chi phí API)", () => {
  const long = "a".repeat(301);
  assertEquals(validateInput({ prompt: long, studentAnswer: "y", correctAnswer: "z" }), null);
});

Deno.test("validateInput: không phải object → null", () => {
  assertEquals(validateInput("chuỗi"), null);
  assertEquals(validateInput(null), null);
  assertEquals(validateInput(undefined), null);
});

Deno.test("validateInput: diagnosis không hợp lệ → null", () => {
  assertEquals(
    validateInput({ prompt: "x", studentAnswer: "y", correctAnswer: "z", diagnosis: "bogus" }),
    null,
  );
});

Deno.test("validateInput: diagnosis hợp lệ → giữ nguyên", () => {
  const r = validateInput({
    prompt: "x",
    studentAnswer: "y",
    correctAnswer: "z",
    diagnosis: "sign",
  });
  assertEquals(r?.diagnosis, "sign");
});

Deno.test("validateInput: không có diagnosis → undefined, vẫn hợp lệ", () => {
  const r = validateInput({ prompt: "x", studentAnswer: "y", correctAnswer: "z" });
  assert(r);
  assertEquals(r?.diagnosis, undefined);
});

Deno.test("buildUserMessage: gồm đề/đáp án HS/đáp án đúng + gợi ý chẩn đoán", () => {
  const input: ExplainInput = {
    prompt: "2+2=?",
    studentAnswer: "5",
    correctAnswer: "4",
    diagnosis: "offByOne",
  };
  const msg = buildUserMessage(input);
  assert(msg.includes("Đề bài: 2+2=?"));
  assert(msg.includes("Học sinh trả lời: 5"));
  assert(msg.includes("Đáp án đúng: 4"));
  assert(msg.includes("lệch đúng 1 đơn vị"));
});

Deno.test("buildUserMessage: không có diagnosis → không có dòng gợi ý chẩn đoán", () => {
  const msg = buildUserMessage({ prompt: "x", studentAnswer: "y", correctAnswer: "z" });
  assert(!msg.includes("Gợi ý chẩn đoán"));
});
