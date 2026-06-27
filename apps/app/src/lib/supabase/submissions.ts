// Bài nộp (M3 US2): HS nộp → Edge `grade-assignment` (service-role chấm + ghi auto_score, ẩn đáp án D4).
// HS đọc bài nộp của mình; điểm hiển thị = final ?? auto (qua @synaptek/classroom). Guest → no-op/null.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { displayScore, isValidScore } from "@synaptek/classroom";
import { supabase } from "./client";
import { useAuth } from "./auth";

export interface SubmissionRow {
  assignmentId: string;
  autoScore: number | null;
  finalScore: number | null;
  isOverride: boolean;
  feedback: string | null;
  displayScore: number | null;
  attemptCount: number;
  startedAt: string | null;
  submittedAt: string | null;
}

/** Bắt đầu làm bài (đặt mốc started_at cho timer — RPC start_attempt). Trả mốc bắt đầu (ISO). */
export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string): Promise<string | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase.rpc("start_attempt", {
        p_assignment_id: assignmentId,
      });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["submission"] }),
  });
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

export interface GradedSubmission {
  studentId: string;
  fullName: string | null;
  autoScore: number | null;
  finalScore: number | null;
  isOverride: boolean;
  feedback: string | null;
  displayScore: number | null;
}

/** GV xem mọi bài nộp của một assignment (RLS owns_class) + tên HS (teaches_student). */
export function useAssignmentSubmissions(assignmentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["submission", "assignment", assignmentId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && assignmentId),
    queryFn: async (): Promise<GradedSubmission[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("submissions")
        .select("student_id, auto_score, final_score, is_override, feedback, profiles(full_name)")
        .eq("assignment_id", assignmentId);
      if (error) throw error;
      return (data ?? []).map((r) => {
        const auto = r.auto_score === null ? null : Number(r.auto_score);
        const final = r.final_score === null ? null : Number(r.final_score);
        return {
          studentId: r.student_id as string,
          fullName:
            ((r.profiles as { full_name?: string | null } | null)?.full_name as string | null) ??
            null,
          autoScore: auto,
          finalScore: final,
          isOverride: Boolean(r.is_override),
          feedback: (r.feedback as string | null) ?? null,
          displayScore: displayScore(auto, final),
        };
      });
    },
  });
}

/** GV ghi đè điểm + nhận xét (audit: auto_score giữ nguyên — chỉ server ghi). */
export function useOverrideGrade(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { studentId: string; finalScore: number; feedback: string }) => {
      if (!supabase) return;
      if (!isValidScore(args.finalScore)) throw new Error("Điểm phải trong khoảng 0–1.");
      const { error } = await supabase
        .from("submissions")
        .update({ final_score: args.finalScore, feedback: args.feedback, is_override: true })
        .eq("assignment_id", assignmentId)
        .eq("student_id", args.studentId);
      if (error) throw error;
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
        .select(
          "assignment_id, auto_score, final_score, is_override, feedback, attempt_count, started_at, submitted_at",
        )
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
        attemptCount: (data.attempt_count as number) ?? 0,
        startedAt: (data.started_at as string | null) ?? null,
        submittedAt: (data.submitted_at as string | null) ?? null,
      };
    },
  });
}
