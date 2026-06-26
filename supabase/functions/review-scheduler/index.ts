// Edge Function `review-scheduler` — job nền nhắc ôn (D21). Chạy bằng SERVICE ROLE (bỏ qua RLS, đọc
// xuyên HS). Tái dùng `dayKeyVN` từ @synaptek/learning-path qua bản _shared tự sinh (D13) — không viết lại.
//
// Kích hoạt: Supabase Cron (pg_cron) gọi định kỳ qua net.http_post (xem supabase/README.md). Không nhận
// input người dùng. Idempotent nhờ PK review_reminders(student_id, due_date) + ON CONFLICT DO NOTHING.
//
// Bất biến (SC-006): chạy 2 lần cùng due_date của một HS → đúng 1 dòng nhắc; HS không có push token vẫn
// tạo nhắc (in-app); push lỗi → pushed_at giữ null, KHÔNG rollback. Push là best-effort (FR-017).
import { createClient } from "@supabase/supabase-js";
import { dayKeyVN } from "@synaptek/learning-path";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Gửi push Expo (best-effort). Trả true nếu gửi được (≥1 token). Lỗi/timeout → false, không ném. */
export async function sendExpoPush(tokens: string[]): Promise<boolean> {
  if (tokens.length === 0) return false;
  try {
    const messages = tokens.map((to) => ({
      to,
      title: "Đến giờ ôn tập rồi!",
      body: "Có kỹ năng cần ôn hôm nay. Vào luyện vài phút nhé!",
      sound: "default",
    }));
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    return res.ok;
  } catch (_e) {
    return false; // best-effort: nuốt lỗi, in-app vẫn hoạt động
  }
}

// Giao diện client tối thiểu mà scheduler cần (để test bằng fake, không cần mạng/DB).
export interface SchedulerClient {
  dueStudentIds(nowIso: string): Promise<string[]>;
  /** Chèn nhắc idempotent. Trả true nếu là dòng MỚI (chưa có cho due_date này). */
  insertReminder(studentId: string, dueDate: string): Promise<boolean>;
  enabledTokens(studentId: string): Promise<string[]>;
  markPushed(studentId: string, dueDate: string, atIso: string): Promise<void>;
}

export interface SchedulerResult {
  dueDate: string;
  students: number;
  created: number;
  pushed: number;
}

/** Lõi job (thuần I/O qua client inject). Tất định theo `now`. Test idempotency dùng fake client. */
export async function runScheduler(
  client: SchedulerClient,
  now: Date,
  push: (tokens: string[]) => Promise<boolean> = sendExpoPush,
): Promise<SchedulerResult> {
  const dueDate = dayKeyVN(now.getTime());
  const students = await client.dueStudentIds(now.toISOString());

  let created = 0;
  let pushed = 0;
  for (const studentId of students) {
    const isNew = await client.insertReminder(studentId, dueDate);
    if (!isNew) continue; // đã nhắc trong chu kỳ này → idempotent
    created++;
    const tokens = await client.enabledTokens(studentId);
    if (await push(tokens)) {
      pushed++;
      await client.markPushed(studentId, dueDate, new Date(now.getTime()).toISOString());
    }
  }
  return { dueDate, students: students.length, created, pushed };
}

/** Client thật trên supabase-js service-role. ON CONFLICT DO NOTHING + RETURNING để biết dòng mới. */
function supabaseClient(url: string, serviceRole: string): SchedulerClient {
  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  return {
    async dueStudentIds(nowIso) {
      const { data, error } = await admin
        .from("skill_mastery")
        .select("student_id")
        .lte("due_at", nowIso);
      if (error) throw new Error(error.message);
      return [...new Set((data ?? []).map((r) => r.student_id as string))];
    },
    async insertReminder(studentId, dueDate) {
      const { data, error } = await admin
        .from("review_reminders")
        .upsert(
          { student_id: studentId, due_date: dueDate },
          { onConflict: "student_id,due_date", ignoreDuplicates: true },
        )
        .select("student_id");
      if (error) return false; // không chặn HS khác
      return Boolean(data && data.length > 0);
    },
    async enabledTokens(studentId) {
      const { data } = await admin
        .from("push_tokens")
        .select("token")
        .eq("student_id", studentId)
        .eq("enabled", true);
      return (data ?? []).map((t) => t.token as string);
    },
    async markPushed(studentId, dueDate, atIso) {
      await admin
        .from("review_reminders")
        .update({ pushed_at: atIso })
        .eq("student_id", studentId)
        .eq("due_date", dueDate);
    },
  };
}

export async function handler(req: Request): Promise<Response> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Bảo vệ: chỉ chấp nhận lời gọi mang service-role key (cron đặt trong Authorization header).
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${serviceRole}`) return json({ error: "unauthorized" }, 401);

  try {
    const result = await runScheduler(supabaseClient(url, serviceRole), new Date());
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ error: "scheduler_failed", detail: String(e) }, 500);
  }
}

// Chỉ khởi động server khi chạy trực tiếp (không khi import để test).
if (import.meta.main) Deno.serve(handler);
