// Bài nộp (M3 US2): HS nộp → Edge `grade-assignment` (service-role chấm + ghi auto_score, ẩn đáp án D4).
// HS đọc bài nộp của mình; điểm hiển thị = final ?? auto (qua @synaptek/classroom). Guest → no-op/null.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { displayScore } from "@synaptek/classroom";
import { supabase } from "./client";
import { useAuth } from "./auth";

export interface SubmissionRow {
  assignmentId: string;
  autoScore: number | null;
  finalScore: number | null;
  isOverride: boolean;
  feedback: string | null;
  displayScore: number | null;
  submittedAt: string;
}

export interface GradeResponse {
  assignmentId: string;
  autoScore: number;
  perQuestion: Record<string, { isCorrect: boolean; feedbackCode: string }>;
}

/** HS nộp bài → gọi Edge chấm chính thức. Trả kết quả (KHÔNG kèm đáp án). */
export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      assignmentId: string;
      answers: Record<string, string | string[]>;
    }): Promise<GradeResponse> => {
      if (!supabase) throw new Error("Chưa cấu hình.");
      const { data, error } = await supabase.functions.invoke("grade-assignment", {
        body: { assignmentId: args.assignmentId, answers: args.answers },
      });
      if (error) throw error;
      return data as GradeResponse;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["submission"] }),
  });
}

/** Bài nộp của HS hiện tại cho một assignment (xem điểm cuối + nhận xét). */
export function useMySubmission(assignmentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["submission", assignmentId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && assignmentId),
    queryFn: async (): Promise<SubmissionRow | null> => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from("submissions")
        .select("assignment_id, auto_score, final_score, is_override, feedback, submitted_at")
        .eq("assignment_id", assignmentId)
        .eq("student_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const auto = data.auto_score === null ? null : Number(data.auto_score);
      const final = data.final_score === null ? null : Number(data.final_score);
      return {
        assignmentId: data.assignment_id as string,
        autoScore: auto,
        finalScore: final,
        isOverride: Boolean(data.is_override),
        feedback: (data.feedback as string | null) ?? null,
        displayScore: displayScore(auto, final),
        submittedAt: data.submitted_at as string,
      };
    },
  });
}
