// Edge Function `generate-questions` (D-authoring-ai) — AI NHÁP câu hỏi: sinh khối MARKDOWN theo chủ đề
// GV/PH mô tả, ĐÚNG định dạng parser `markdown-questions.ts` hiểu → client đổ vào ô nhập → GV sửa → xem
// trước có TỰ-CHẤM (engine lọc câu sai đáp án) → lưu. LLM chỉ NHÁP, engine + người duyệt là cửa chốt
// (giống pipeline soạn nội dung của repo: AI nháp → gate tự-chấm → người duyệt, D55/D65).
// Dùng Gemini (1 provider, như ai-tutor-explain D46). Bắt buộc đăng nhập (verify_jwt) — chống gọi ẩn
// danh tốn phí. Chưa có GEMINI_API_KEY → trả "not_configured" (HTTP 200) → client báo graceful.
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

export interface GenerateInput {
  topic: string; // chủ đề GV mô tả, vd "lớp 6, cộng trừ số nguyên"
  count: number; // số câu muốn sinh (1..20)
  subject?: string; // nhãn môn (vd "Toán") — chỉ để nhắc ngữ cảnh
}

const MAX_TOPIC_LEN = 300;
const MAX_COUNT = 20;

/** Validate hình dạng input — THUẦN, test được không cần gọi API. */
export function validateInput(body: unknown): GenerateInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.topic !== "string" || b.topic.trim() === "" || b.topic.length > MAX_TOPIC_LEN)
    return null;
  const n = Number(b.count);
  if (!Number.isInteger(n) || n < 1 || n > MAX_COUNT) return null;
  const subject =
    typeof b.subject === "string" && b.subject.trim() !== "" ? b.subject.trim() : undefined;
  return { topic: b.topic.trim(), count: n, subject };
}

const SYSTEM_PROMPT =
  "Bạn là trợ lý soạn đề Toán Việt Nam, bám Chương trình GDPT 2018. Nhiệm vụ: sinh câu hỏi luyện tập " +
  "theo yêu cầu và XUẤT RA ĐÚNG định dạng Markdown dưới đây, KHÔNG thêm lời dẫn hay giải thích nào ngoài " +
  "các câu.\n\n" +
  "Định dạng mỗi câu:\n" +
  "### <đề bài>\n" +
  "Nếu là trắc nghiệm: mỗi lựa chọn một dòng, đánh dấu đáp án đúng bằng * [x] và sai bằng * [ ].\n" +
  "Nếu KHÔNG phải trắc nghiệm: một dòng `answer: <đáp án>`.\n" +
  "Thêm một dòng `explain: <lời giải ngắn gọn một câu>`.\n\n" +
  "Quy tắc BẮT BUỘC:\n" +
  "- Số thập phân dùng DẤU PHẨY kiểu Việt Nam (ví dụ 2,5 — KHÔNG dùng 2.5).\n" +
  "- Phân số viết dạng a/b (ví dụ 3/4).\n" +
  "- Câu đúng/sai: dùng `answer: đúng` hoặc `answer: sai`.\n" +
  "- CHỈ dùng bốn loại: trắc nghiệm, số, phân số, đúng/sai. KHÔNG dùng ảnh, biểu đồ, hình vẽ.\n" +
  "- Đáp án phải CHÍNH XÁC tuyệt đối (sẽ bị kiểm tự động bằng máy).\n" +
  "- Toán phải đúng và phù hợp lứa tuổi nêu trong yêu cầu.";

/** Ghép nội dung hỏi Gemini — THUẦN, test được. */
export function buildUserMessage(input: GenerateInput): string {
  const subj = input.subject ? ` Môn: ${input.subject}.` : "";
  return (
    `Hãy soạn ${input.count} câu hỏi luyện tập về chủ đề: ${input.topic}.${subj}\n` +
    `Xuất ra đúng định dạng Markdown đã hướng dẫn, mỗi câu bắt đầu bằng "### ".`
  );
}

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

/** Gọi Gemini API — tách riêng để dễ mock/thay thế. */
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
        generationConfig: { maxOutputTokens: 2048 },
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

  // Lỗi mềm trả HTTP 200 + `error` trong body (supabase-js chặn đọc body khi non-2xx) — client phân
  // biệt để báo thông báo thân thiện đúng nguyên nhân.
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "not_configured" });
  const model = Deno.env.get("GEMINI_MODEL") || undefined;

  try {
    const markdown = await callGemini(buildUserMessage(input), apiKey, model);
    return json({ markdown });
  } catch (e) {
    console.error("generate-questions: gemini failed:", e instanceof Error ? e.message : e);
    return json({ error: "ai_failed" });
  }
}

if (import.meta.main) Deno.serve(handler);
