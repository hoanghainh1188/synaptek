// Test xóa tài khoản (D52). deno test delete-account/index.test.ts
// Chỉ test hàm THUẦN (blocksDeletion) — không cần Supabase live/service-role thật.
import { assertEquals } from "jsr:@std/assert@1";
import { blocksDeletion } from "./index.ts";

Deno.test("GV còn lớp có học sinh → chặn", () => {
  assertEquals(blocksDeletion("teacher", 1), true);
  assertEquals(blocksDeletion("teacher", 3), true);
});

Deno.test("GV không còn lớp có học sinh → không chặn", () => {
  assertEquals(blocksDeletion("teacher", 0), false);
});

Deno.test("HS/PH không bao giờ bị chặn (không sở hữu lớp)", () => {
  assertEquals(blocksDeletion("student", 5), false);
  assertEquals(blocksDeletion("parent", 5), false);
});
