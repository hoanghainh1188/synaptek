// Đọc & ghi skill_mastery qua Supabase (RLS: chỉ của HS đã đăng nhập). Guest → no-op.
// Khi khách đăng nhập, app gọi useUpsertMastery với mastery tính trong bộ nhớ (gồm chẩn đoán) — U1.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";

export interface SkillMasteryRow {
  skillId: string;
  mastery: number;
  attemptsCount: number;
  dueAt: string | null;
}

export interface MasteryUpsert {
  skillId: string;
  mastery: number;
  attemptsCount: number;
  lastReviewed?: string;
  dueAt?: string | null;
}

/** Tiến độ mastery của HS hiện tại (để dựng lộ trình + heatmap). */
export function useSkillMastery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["skill_mastery", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<SkillMasteryRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("skill_mastery")
        .select("skill_id, mastery, attempts_count, due_at")
        .eq("student_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        skillId: r.skill_id as string,
        mastery: Number(r.mastery),
        attemptsCount: (r.attempts_count as number) ?? 0,
        dueAt: (r.due_at as string | null) ?? null,
      }));
    },
  });
}

/** Upsert nhiều dòng mastery (chỉ khi đã đăng nhập; guest → no-op). */
export function useUpsertMastery() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: MasteryUpsert[]) => {
      if (!supabase || !user || rows.length === 0) return; // guest → không lưu
      const payload = rows.map((r) => ({
        student_id: user.id,
        skill_id: r.skillId,
        mastery: r.mastery,
        attempts_count: r.attemptsCount,
        last_reviewed: r.lastReviewed ?? new Date().toISOString(),
        due_at: r.dueAt ?? null,
      }));
      const { error } = await supabase
        .from("skill_mastery")
        .upsert(payload, { onConflict: "student_id,skill_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skill_mastery"] }),
  });
}
