// Gia sư AI (D46): giải thích NGẮN GỌN vì sao đáp án SAI — KHÔNG chấm điểm (engine đã chấm, D4).
// Ngữ cảnh gửi lên không bí mật (đã hiện với HS): đề bài, đáp án HS, đáp án đúng, chẩn đoán (nếu có).
import { useMutation } from "@tanstack/react-query";
import type { Diagnosis } from "@synaptek/grading-engine";
import { supabase } from "./client";

export interface ExplainWrongAnswerInput {
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  diagnosis?: Diagnosis;
}

/** Hỏi gia sư AI vì sao HS trả lời sai. Ném lỗi thân thiện tiếng Việt khi chưa cấu hình / API lỗi. */
export function useExplainWrongAnswer() {
  return useMutation({
    mutationFn: async (input: ExplainWrongAnswerInput): Promise<string> => {
      if (!supabase) throw new Error("Chưa cấu hình Supabase.");
      const { data, error } = await supabase.functions.invoke("ai-tutor-explain", {
        body: input,
      });
      if (error) throw new Error("Không hỏi được gia sư AI, thử lại sau nhé.");
      if (data?.error === "not_configured") {
        throw new Error("Gia sư AI chưa sẵn sàng, thử lại sau nhé.");
      }
      if (data?.error) throw new Error("Không hỏi được gia sư AI, thử lại sau nhé.");
      return data.explanation as string;
    },
  });
}
