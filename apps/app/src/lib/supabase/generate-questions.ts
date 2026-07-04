// AI nháp câu hỏi (D-authoring-ai): gọi Edge `generate-questions` → nhận khối MARKDOWN theo chủ đề GV mô
// tả → client đổ vào ô nhập của màn import → GV sửa → xem trước có tự-chấm → lưu. LLM chỉ NHÁP; engine
// (tự-chấm) + người duyệt là cửa chốt. Ném lỗi thân thiện tiếng Việt khi chưa cấu hình key / API lỗi.
import { useMutation } from "@tanstack/react-query";
import { supabase } from "./client";

export interface GenerateQuestionsInput {
  topic: string;
  count: number;
  subject?: string;
}

export function useGenerateQuestions() {
  return useMutation({
    mutationFn: async (input: GenerateQuestionsInput): Promise<string> => {
      if (!supabase) throw new Error("Chưa cấu hình Supabase.");
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: input,
      });
      if (error) throw new Error("Không gọi được AI, thử lại sau nhé.");
      if (data?.error === "not_configured") {
        throw new Error("Tính năng AI nháp chưa sẵn sàng (chưa cấu hình khoá).");
      }
      if (data?.error) throw new Error("AI nháp thất bại, thử lại sau nhé.");
      return data.markdown as string;
    },
  });
}
