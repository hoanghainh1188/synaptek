// Edge Function `grade-assignment` — CHẤM CHÍNH THỨC một bài nộp (M3 US2, D4). HS phải đăng nhập.
// Dùng lại @synaptek/grading-engine (moat) + ANSWER_KEYS tự sinh từ content/ (D6/D13). ĐÁP ÁN KHÔNG
// rời server: phản hồi chỉ gồm isCorrect/feedbackCode/score, KHÔNG kèm `correct`. auto_score do server ghi.
import { grade, type GradeInput } from "@synaptek/grading-engine";
import { createClient } from "@supabase/supabase-js";
import { checkSubmitAllowed, pickForStudent } from "@synaptek/classroom";
import { ANSWER_KEYS, type AnswerKey } from "../_shared/answer-keys.ts";

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

export interface PerQuestion {
  isCorrect: boolean;
  feedbackCode: string;
}

export interface GradeResult {
  autoScore: number;
  perQuestion: Record<string, PerQuestion>;
}

/**
 * Chấm thuần một bài nộp: với mỗi questionId, tra đáp án ở `keys`, chấm bằng engine.
 * Câu thiếu key → BỎ QUA (FR-017). KHÔNG trả `correct`. Tất định.
 */
export function gradeSubmission(
  questionIds: string[],
  answers: Record<string, string | string[]>,
  keys: Record<string, AnswerKey> = ANSWER_KEYS,
): GradeResult {
  const perQuestion: Record<string, PerQuestion> = {};
  let sum = 0;
  let n = 0;
  for (const qid of questionIds) {
    const key = keys[qid];
    if (!key) continue; // câu thiếu trong answer-keys → bỏ qua, không vỡ
    const input: GradeInput = {
      type: key.type,
      correct: key.correct,
      answer: answers[qid] ?? "",
      options:
        key.tolerance !== undefined || key.unordered || key.roundTo !== undefined
          ? { tolerance: key.tolerance, unordered: key.unordered, roundTo: key.roundTo }
          : undefined,
    };
    const r = grade(input);
    perQuestion[qid] = { isCorrect: r.isCorrect, feedbackCode: r.feedbackCode };
    sum += r.score;
    n++;
  }
  return { autoScore: n > 0 ? sum / n : 0, perQuestion };
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // Xác thực HS từ JWT.
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
  const studentId = userData.user.id;

  let body: { assignmentId?: string; answers?: Record<string, string | string[]> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const { assignmentId, answers } = body;
  if (!assignmentId || !answers) return json({ error: "missing_fields" }, 400);

  // Service-role: đọc assignment + kiểm membership + ghi auto_score (bỏ qua RLS, có kiểm tay).
  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { data: asg, error: asgErr } = await admin
    .from("assignments")
    .select(
      "class_id, assignee_student_id, question_ids, due_at, allow_late, max_attempts, time_limit_minutes, pool_pick_count",
    )
    .eq("id", assignmentId)
    .maybeSingle();
  if (asgErr || !asg) return json({ error: "unknown_assignment" }, 404);

  // Thành viên: bài LỚP → là member của lớp; bài TẠI NHÀ → đúng con được giao.
  if (asg.class_id) {
    const { data: member } = await admin
      .from("class_members")
      .select("student_id")
      .eq("class_id", asg.class_id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (!member) return json({ error: "not_member" }, 403);
    // Giao cho HS cụ thể (D30): nếu bài có target mà HS không thuộc → từ chối.
    const { data: targets } = await admin
      .from("assignment_targets")
      .select("student_id")
      .eq("assignment_id", assignmentId);
    if (targets && targets.length > 0 && !targets.some((t) => t.student_id === studentId)) {
      return json({ error: "not_targeted" }, 403);
    }
  } else if (asg.assignee_student_id !== studentId) {
    return json({ error: "not_member" }, 403);
  }

  // Trạng thái bài nộp hiện có (số lần đã nộp + mốc bắt đầu cho timer).
  const { data: existing } = await admin
    .from("submissions")
    .select("attempt_count, started_at")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  // ENFORCE giới hạn ở server (D4) — logic chung với client qua @synaptek/classroom.
  const decision = checkSubmitAllowed(
    {
      dueAt: asg.due_at ? Date.parse(asg.due_at as string) : null,
      allowLate: asg.allow_late as boolean,
      maxAttempts: (asg.max_attempts as number | null) ?? null,
      timeLimitMinutes: (asg.time_limit_minutes as number | null) ?? null,
    },
    {
      attemptCount: (existing?.attempt_count as number) ?? 0,
      startedAt: existing?.started_at ? Date.parse(existing.started_at as string) : null,
    },
    Date.now(),
  );
  if (!decision.allowed) return json({ error: decision.reason }, 403);

  // Câu tự soạn (D28): id không có trong ANSWER_KEYS → lấy đáp án từ custom_questions (service-role).
  const qids = asg.question_ids as string[];
  const customIds = qids.filter((q) => !ANSWER_KEYS[q]);
  const mergedKeys: Record<string, AnswerKey> = { ...ANSWER_KEYS };
  if (customIds.length > 0) {
    const { data: customRows } = await admin
      .from("custom_questions")
      .select("id, type, correct, options")
      .in("id", customIds);
    for (const c of customRows ?? []) {
      const type = c.type as AnswerKey["type"];
      // fill-blank & multi: đáp án nhiều phần lưu JSON array trong cột text → parse về mảng cho engine.
      let correct: string | string[] = c.correct as string;
      if (type === "fill-blank" || type === "multi" || type === "ordering" || type === "matching") {
        try {
          const arr = JSON.parse(c.correct as string);
          if (Array.isArray(arr)) correct = arr.map(String);
        } catch {
          /* giữ nguyên chuỗi nếu lỗi */
        }
      }
      // Tùy chọn chấm tự soạn (D28+): tolerance / unordered / roundTo.
      const o = (c.options ?? {}) as { tolerance?: number; unordered?: boolean; roundTo?: number };
      mergedKeys[c.id as string] = {
        type,
        correct,
        ...(o.tolerance !== undefined ? { tolerance: o.tolerance } : {}),
        ...(o.unordered ? { unordered: true } : {}),
        ...(o.roundTo !== undefined ? { roundTo: o.roundTo } : {}),
      };
    }
  }

  // Ngẫu nhiên hoá pool (D31): chấm ĐÚNG bộ con HS nhận (cùng pickForStudent với client).
  const poolPick = asg.pool_pick_count as number | null;
  const gradeIds = poolPick ? pickForStudent(qids, poolPick, `${assignmentId}|${studentId}`) : qids;
  const { autoScore, perQuestion } = gradeSubmission(gradeIds, answers, mergedKeys);

  const { error: upErr } = await admin.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: studentId,
      answers,
      auto_score: autoScore,
      attempt_count: ((existing?.attempt_count as number) ?? 0) + 1,
      graded_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" },
  );
  if (upErr) return json({ error: "save_failed", detail: upErr.message }, 500);

  // KHÔNG kèm đáp án (D4).
  return json({ assignmentId, autoScore, perQuestion });
}

if (import.meta.main) Deno.serve(handler);
