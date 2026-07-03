// Edge Function `delete-account` (D52): xóa TÀI KHOẢN CỦA CHÍNH MÌNH (không có ai xóa hộ ai) — soft
// delete qua auth.admin.deleteUser(id, true), BẮT BUỘC service-role → không thể làm ở client.
// GV bị CHẶN nếu còn lớp có học sinh (bảo vệ dữ liệu điểm/bài giao của HS khỏi mất đột ngột) — phải
// xóa/chuyển giao lớp trước. HS/PH không có ràng buộc này (chỉ có "con"/lớp tham gia, không sở hữu).
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** GV có lớp còn học sinh → chặn xóa. THUẦN (nhận số đếm sẵn), test được không cần DB thật. */
export function blocksDeletion(role: string, classesWithStudents: number): boolean {
  return role === "teacher" && classesWithStudents > 0;
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
  const uid = userData.user.id;

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { data: profile } = await admin.from("profiles").select("role").eq("id", uid).maybeSingle();
  const role = (profile?.role as string | undefined) ?? "student";

  if (role === "teacher") {
    const { data: myClasses } = await admin
      .from("classes")
      .select("id")
      .eq("owner_teacher_id", uid);
    const classIds = (myClasses ?? []).map((c) => c.id as string);
    let classesWithStudents = 0;
    if (classIds.length > 0) {
      const { count } = await admin
        .from("class_members")
        .select("class_id", { count: "exact", head: true })
        .in("class_id", classIds);
      classesWithStudents = count ?? 0;
    }
    if (blocksDeletion(role, classesWithStudents)) {
      return json({ error: "has_active_classes" });
    }
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(uid, true);
  if (delErr) {
    console.error("delete-account: deleteUser failed:", delErr.message);
    return json({ error: "delete_failed" });
  }
  await admin.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", uid);

  return json({ ok: true });
}

if (import.meta.main) Deno.serve(handler);
