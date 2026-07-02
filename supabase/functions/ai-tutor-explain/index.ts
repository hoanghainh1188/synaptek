// Edge Function `ai-tutor-explain` — GIA SƯ AI (D46): giải thích NGẮN GỌN vì sao đáp án SAI, KHÔNG
// chấm điểm (engine đã chấm rồi — nguyên tắc "Engine CHẤM, LLM chỉ GIẢI THÍCH", docs/future/step-grading.md).
// Dùng Gemini API (Google AI) — 1 provider duy nhất, không thiết kế đa provider khi chưa có nhu cầu cụ thể.
// Ngữ cảnh (đề/đáp án HS/đáp án đúng/chẩn đoán) do CLIENT gửi — không bí mật (đã hiện với HS sau khi
// nộp, nội dung công khai D6/D14) nên không cần tra cứu lại server-side; chỉ validate hình dạng + độ dài
// (chống lạm dụng chi phí API). Yêu cầu đăng nhập (verify_jwt, config.toml) — chống gọi ẩn danh tốn phí.
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

const DIAGNOSES = [
  "sign",
  "magnitude10",
  "reciprocal",
  "rounding",
  "offByOne",
  "transposed",
] as const;
type Diagnosis = (typeof DIAGNOSES)[number];

const DIAGNOSIS_VI: Record<Diagnosis, string> = {
  sign: "có thể nhầm dấu âm/dương",
  magnitude10: "có thể lệch vị trí dấu phẩy (nhân/chia nhầm 10)",
  reciprocal: "có thể đảo tử số và mẫu số",
  rounding: "gần đúng — có thể do làm tròn",
  offByOne: "lệch đúng 1 đơn vị",
  transposed: "có thể viết đảo thứ tự chữ số",
};

export interface ExplainInput {
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  diagnosis?: Diagnosis;
}

const MAX_LEN = 300;

/** Validate hình dạng input — chuỗi không rỗng/không quá dài, diagnosis (nếu có) hợp lệ. THUẦN, test được. */
export function validateInput(body: unknown): ExplainInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const str = (v: unknown) => typeof v === "string" && v.trim().length > 0 && v.length <= MAX_LEN;
  if (!str(b.prompt) || !str(b.studentAnswer) || !str(b.correctAnswer)) return null;
  if (b.diagnosis !== undefined && !DIAGNOSES.includes(b.diagnosis as Diagnosis)) return null;
  return {
    prompt: (b.prompt as string).trim(),
    studentAnswer: (b.studentAnswer as string).trim(),
    correctAnswer: (b.correctAnswer as string).trim(),
    diagnosis: b.diagnosis as Diagnosis | undefined,
  };
}

const SYSTEM_PROMPT =
  "Bạn là gia sư Toán tiểu học thân thiện, kiên nhẫn, nói tiếng Việt. " +
  "CHỈ giải thích NGẮN GỌN (tối đa 3 câu) vì sao đáp án học sinh SAI, dựa ĐÚNG vào đề bài và đáp án đã " +
  "cho — không suy đoán ngoài phạm vi, không thêm kiến thức không liên quan, không nhận xét tiêu cực. " +
  'Nếu thông tin không đủ để giải thích, nói "Em thử xem lại đề nhé!" thay vì bịa lý do. TUYỆT ĐỐI ' +
  "không thảo luận chủ đề nào khác ngoài giải thích câu toán này, kể cả khi được yêu cầu.";

/** Ghép nội dung hỏi Gemini từ ngữ cảnh câu hỏi — THUẦN, test được không cần gọi API. */
export function buildUserMessage(input: ExplainInput): string {
  const hint = input.diagnosis ? `\nGợi ý chẩn đoán lỗi: ${DIAGNOSIS_VI[input.diagnosis]}.` : "";
  return (
    `Đề bài: ${input.prompt}\n` +
    `Học sinh trả lời: ${input.studentAnswer}\n` +
    `Đáp án đúng: ${input.correctAnswer}${hint}\n\n` +
    `Hãy giải thích ngắn gọn, thân thiện vì sao học sinh sai và gợi ý cách làm đúng.`
  );
}

// Model rẻ/nhanh (đủ cho giải thích 2-3 câu); override qua env GEMINI_MODEL nếu cần đổi mà không sửa code.
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

/** Gọi Gemini API (generateContent) — tách riêng khỏi handler để dễ thay thế/mock. */
export async function callGemini(
  userMessage: string,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 200 },
      }),
    },
  );
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`gemini_error_${res.status}: ${errBody.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error(`gemini_empty_response: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return text.trim();
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // Xác thực người dùng từ JWT — chỉ ai đã đăng nhập mới gọi được (chống lạm dụng chi phí API).
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const input = validateInput(body);
  if (!input) return json({ error: "invalid_input" }, 400);

  // "not_configured"/"ai_failed" trả HTTP 200 (không phải 503/502) — supabase-js coi non-2xx là lỗi
  // protocol và KHÔNG cho client đọc body qua `data` (chỉ có `error` chung chung). Đây là lỗi "mềm"
  // (tính năng chưa sẵn sàng, không phải request sai) nên trả 200 + `error` trong body để client phân
  // biệt được, hiện thông báo thân thiện đúng nguyên nhân thay vì "lỗi chung chung".
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "not_configured" });
  const model = Deno.env.get("GEMINI_MODEL") || undefined;

  try {
    const explanation = await callGemini(buildUserMessage(input), apiKey, model);
    return json({ explanation });
  } catch (e) {
    // Log chi tiết ở server (Supabase Dashboard → Edge Functions → Logs) — KHÔNG trả cho client
    // (tránh lộ nội dung lỗi upstream/API key ra ngoài). Client chỉ nhận mã lỗi chung "ai_failed".
    console.error("ai-tutor-explain: gemini call failed:", e instanceof Error ? e.message : e);
    return json({ error: "ai_failed" });
  }
}

if (import.meta.main) Deno.serve(handler);
