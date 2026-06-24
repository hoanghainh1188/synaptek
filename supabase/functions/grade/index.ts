// Edge Function `grade` — CHẤM CHÍNH THỨC server-side (D4).
//
// Đây là consumer THỨ HAI của @synaptek/grading-engine (consumer #1 là app client). CÙNG một
// engine TS thuần chạy ở cả hai nơi — không viết lại logic (D5). Import theo TÊN package qua
// import map (supabase/functions/deno.json), đúng như client import.
//
// Bất biến quan trọng: client CHỈ gửi { questionId, answer }. Đáp án đúng KHÔNG BAO GIỜ rời server
// — nó được tra ở server (tạm thời từ stub dưới đây; sau sẽ đọc content/questions + DB). Nhờ vậy học
// sinh không thể xem trước đáp án hay sửa điểm.
import { grade, type GradeInput, type QuestionType } from "@synaptek/grading-engine";

// TODO(M1): thay stub này bằng việc đọc content/questions/*.json (ground-truth, D6) phía server.
type QuestionKey = { type: QuestionType; correct: string | string[]; tolerance?: number };
const QUESTION_KEYS: Record<string, QuestionKey> = {
  "demo-frac-1": { type: "fraction", correct: "1/2" },
  "demo-num-1": { type: "numeric", correct: "0.5" },
  "demo-expr-1": { type: "expression", correct: "2x+4" },
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { questionId?: string; answer?: string | string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { questionId, answer } = body;
  if (!questionId || answer === undefined) {
    return json({ error: "missing_fields", need: ["questionId", "answer"] }, 400);
  }

  const key = QUESTION_KEYS[questionId];
  if (!key) return json({ error: "unknown_question", questionId }, 404);

  const input: GradeInput = {
    type: key.type,
    correct: key.correct,
    answer,
    options: key.tolerance ? { tolerance: key.tolerance } : undefined,
  };
  const r = grade(input);

  // Trả về kết quả — KHÔNG kèm `correct` (giữ đáp án ở server).
  return json({
    questionId,
    isCorrect: r.isCorrect,
    score: r.score,
    feedbackCode: r.feedbackCode,
  });
});
