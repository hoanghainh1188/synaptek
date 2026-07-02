// Edge Function `ai-tutor-explain` — GIA SƯ AI (D46): giải thích NGẮN GỌN vì sao đáp án SAI, KHÔNG
// chấm điểm (engine đã chấm rồi — nguyên tắc "Engine CHẤM, LLM chỉ GIẢI THÍCH", docs/future/step-grading.md).
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

/** Ghép nội dung hỏi Claude từ ngữ cảnh câu hỏi — THUẦN, test được không cần gọi API. */
export function buildUserMessage(input: ExplainInput): string {
  const hint = input.diagnosis ? `\nGợi ý chẩn đoán lỗi: ${DIAGNOSIS_VI[input.diagnosis]}.` : "";
  return (
    `Đề bài: ${input.prompt}\n` +
    `Học sinh trả lời: ${input.studentAnswer}\n` +
    `Đáp án đúng: ${input.correctAnswer}${hint}\n\n` +
    `Hãy giải thích ngắn gọn, thân thiện vì sao học sinh sai và gợi ý cách làm đúng.`
  );
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/** Gọi Anthropic Messages API — tách riêng khỏi handler để dễ thay thế/mock. */
export async function callClaude(
  userMessage: string,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_error_${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || text.trim() === "") throw new Error("anthropic_empty_response");
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
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "not_configured" });

  try {
    const explanation = await callClaude(buildUserMessage(input), apiKey);
    return json({ explanation });
  } catch {
    return json({ error: "ai_failed" });
  }
}

if (import.meta.main) Deno.serve(handler);
