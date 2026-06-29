// Lưu & truy vấn attempts qua Supabase (RLS: chỉ của HS đã đăng nhập). Guest → no-op.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";
import type { AttemptLike } from "@/lib/progress";

export interface NewAttempt {
  questionId: string;
  skillId?: string;
  answer: string | string[];
  isCorrect: boolean;
  score: number;
}

/** Lưu một lần trả lời (chỉ khi đã đăng nhập). */
export function useSaveAttempt() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewAttempt) => {
      if (!supabase || !user) return; // guest → không lưu
      const { error } = await supabase.from("attempts").insert({
        student_id: user.id,
        question_id: a.questionId,
        skill_id: a.skillId ?? null,
        answer: a.answer,
        is_correct: a.isCorrect,
        score: a.score,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attempts"] }),
  });
}

/** Tất cả attempts của HS hiện tại (để gộp tiến độ). */
export function useAttempts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["attempts", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<AttemptLike[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("attempts")
        .select("question_id, skill_id, is_correct, created_at")
        .eq("student_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        questionId: r.question_id as string,
        skillId: (r.skill_id as string | null) ?? null,
        isCorrect: r.is_correct as boolean,
        createdAt: r.created_at as string,
      }));
    },
  });
}
