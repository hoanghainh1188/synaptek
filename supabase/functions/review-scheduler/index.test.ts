// Test idempotency scheduler (SC-006).  Chạy: deno test supabase/functions/review-scheduler/index.test.ts
// Dùng fake client mô phỏng PK review_reminders(student_id, due_date) — không cần mạng/DB.
import { assertEquals } from "jsr:@std/assert@1";
import { runScheduler, type SchedulerClient } from "./index.ts";

/** Fake client: HS đến hạn cố định; review_reminders dedup theo (student_id|due_date). */
function makeFake(dueStudents: string[], tokensByStudent: Record<string, string[]> = {}) {
  const reminders = new Set<string>(); // "student|due_date"
  const pushed = new Set<string>();
  const client: SchedulerClient = {
    dueStudentIds: () => Promise.resolve(dueStudents),
    insertReminder: (s, d) => {
      const k = `${s}|${d}`;
      if (reminders.has(k)) return Promise.resolve(false); // ON CONFLICT DO NOTHING
      reminders.add(k);
      return Promise.resolve(true);
    },
    enabledTokens: (s) => Promise.resolve(tokensByStudent[s] ?? []),
    markPushed: (s, d) => {
      pushed.add(`${s}|${d}`);
      return Promise.resolve();
    },
  };
  return { client, reminders, pushed };
}

const NOW = new Date("2026-06-26T03:00:00Z"); // 10:00 VN → due_date 2026-06-26

Deno.test("chạy 2 lần cùng due_date → đúng 1 dòng nhắc/HS (idempotent, SC-006)", async () => {
  const fake = makeFake(["u1", "u2"], { u1: ["tok-1"] });
  let pushCalls = 0;
  const push = (tokens: string[]) => {
    if (tokens.length) pushCalls++;
    return Promise.resolve(tokens.length > 0);
  };

  const r1 = await runScheduler(fake.client, NOW, push);
  assertEquals(r1.created, 2, "lần 1: tạo 2 nhắc");
  assertEquals(r1.pushed, 1, "lần 1: chỉ u1 có token → push 1");

  const r2 = await runScheduler(fake.client, NOW, push);
  assertEquals(r2.created, 0, "lần 2: không tạo thêm (ON CONFLICT DO NOTHING)");
  assertEquals(r2.pushed, 0, "lần 2: không gửi lại");

  assertEquals(fake.reminders.size, 2, "tổng cộng đúng 2 dòng nhắc");
  assertEquals(pushCalls, 1, "push chỉ gọi đúng 1 lần (u1, lần 1)");
});

Deno.test("HS không có token enabled → vẫn tạo nhắc, không push, không lỗi", async () => {
  const fake = makeFake(["u3"]); // không token
  const r = await runScheduler(fake.client, NOW, () => Promise.resolve(false));
  assertEquals(r.created, 1, "vẫn tạo nhắc (in-app)");
  assertEquals(r.pushed, 0, "không push");
  assertEquals(fake.reminders.has("u3|2026-06-26"), true);
});

Deno.test("push lỗi → pushed_at giữ null (markPushed không gọi), nhắc vẫn còn", async () => {
  const fake = makeFake(["u4"], { u4: ["tok-4"] });
  const r = await runScheduler(fake.client, NOW, () => Promise.resolve(false)); // push thất bại
  assertEquals(r.created, 1);
  assertEquals(r.pushed, 0);
  assertEquals(fake.pushed.has("u4|2026-06-26"), false, "không markPushed khi push lỗi");
  assertEquals(fake.reminders.has("u4|2026-06-26"), true, "nhắc không bị rollback");
});
