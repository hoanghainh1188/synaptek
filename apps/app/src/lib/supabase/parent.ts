// Phụ huynh (M4): HS tạo/thu hồi mã liên kết · PH liên kết (RPC)/danh sách con/gỡ · đọc tiến độ con (read-only).
// Tái dùng @synaptek/classroom (mã mời) + @synaptek/learning-path (điểm yếu). RLS lo cô lập PH–con. Guest → no-op/[].
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeInviteCode } from "@synaptek/classroom";
import { skillWeakness, type HeatCell } from "@synaptek/learning-path";
import { displayScore } from "@synaptek/classroom";
import { supabase } from "./client";
import { useAuth } from "./auth";

/** Số ngẫu nhiên an toàn cho mã (crypto nếu có). */
function randomInts(n: number): number[] {
  const out: number[] = [];
  const g = globalThis.crypto;
  if (g?.getRandomValues) {
    const buf = new Uint32Array(n);
    g.getRandomValues(buf);
    for (const v of buf) out.push(v);
  } else {
    for (let i = 0; i < n; i++) out.push(Math.floor(Math.random() * 0xffffffff));
  }
  return out;
}

// ── HS: mã liên kết phụ huynh ───────────────────────────────────────────────
/** Mã liên kết hiện tại của HS (null = chưa tạo). */
export function useMyParentCode() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["parent-code", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<string | null> => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("parent_link_code")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.parent_link_code as string | null) ?? null;
    },
  });
}

/** HS tạo/đặt lại mã liên kết (thu hồi mã cũ). */
export function useRegenerateParentCode() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!supabase || !user) return;
      const code = makeInviteCode(randomInts(6));
      const { error } = await supabase
        .from("profiles")
        .update({ parent_link_code: code })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-code"] }),
  });
}

/** HS thu hồi mã (đặt null) — PH cũ vẫn liên kết, chỉ chặn liên kết mới. */
export function useClearParentCode() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!supabase || !user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ parent_link_code: null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-code"] }),
  });
}

// ── Liên kết ────────────────────────────────────────────────────────────────
export interface LinkRow {
  id: string; // id người kia (con với PH; PH với HS)
  fullName: string | null;
}

/** PH nhập mã → liên kết (RPC). Ném khi mã sai/tự-liên-kết. */
export function useLinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      if (!supabase) throw new Error("Chưa cấu hình.");
      const { data, error } = await supabase.rpc("link_parent_by_code", { code });
      if (error) throw new Error("Mã không đúng hoặc không thể liên kết.");
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["my-parents"] });
    },
  });
}

/** PH: danh sách con đã liên kết. */
export function useMyChildren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["children", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<LinkRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("parent_links")
        .select("student_id, profiles!parent_links_student_id_fkey(full_name)")
        .eq("parent_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.student_id as string,
        fullName:
          ((r.profiles as { full_name?: string | null } | null)?.full_name as string | null) ??
          null,
      }));
    },
  });
}

/** HS: danh sách PH đang theo dõi. */
export function useMyParents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-parents", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<LinkRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("parent_links")
        .select("parent_id, profiles!parent_links_parent_id_fkey(full_name)")
        .eq("student_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.parent_id as string,
        fullName:
          ((r.profiles as { full_name?: string | null } | null)?.full_name as string | null) ??
          null,
      }));
    },
  });
}

/** Gỡ liên kết (PH hoặc HS). */
export function useUnlink() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (other: { parentId: string; studentId: string }) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("parent_links")
        .delete()
        .eq("parent_id", other.parentId)
        .eq("student_id", other.studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["my-parents"] });
    },
  });
}

// ── PH: theo dõi tiến độ 1 con (read-only, RLS-gated) ───────────────────────
export interface ChildProgress {
  fullName: string | null;
  totalXp: number;
  currentStreak: number;
  attemptsCount: number;
  correctCount: number;
  weakSkills: HeatCell[];
  submissions: { assignmentId: string; displayScore: number | null }[];
}

export function useChildProgress(childId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["child-progress", childId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && childId),
    queryFn: async (): Promise<ChildProgress | null> => {
      if (!supabase || !user) return null;
      const [prof, attempts, mastery, gami, subs] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", childId).maybeSingle(),
        supabase.from("attempts").select("skill_id, is_correct").eq("student_id", childId),
        supabase.from("skill_mastery").select("skill_id, mastery").eq("student_id", childId),
        supabase
          .from("gamification_state")
          .select("total_xp, current_streak")
          .eq("student_id", childId)
          .maybeSingle(),
        supabase
          .from("submissions")
          .select("assignment_id, auto_score, final_score")
          .eq("student_id", childId),
      ]);
      const masteryMap = new Map<string, number>(
        (mastery.data ?? []).map((m) => [m.skill_id as string, Number(m.mastery)]),
      );
      const attemptRows = (attempts.data ?? []).map((a) => ({
        skillId: a.skill_id as string,
        isCorrect: a.is_correct as boolean,
      }));
      return {
        fullName: (prof.data?.full_name as string | null) ?? null,
        totalXp: (gami.data?.total_xp as number) ?? 0,
        currentStreak: (gami.data?.current_streak as number) ?? 0,
        attemptsCount: attemptRows.length,
        correctCount: attemptRows.filter((a) => a.isCorrect).length,
        weakSkills: skillWeakness(
          attemptRows.filter((a) => a.skillId),
          masteryMap,
        ).slice(0, 5),
        submissions: (subs.data ?? []).map((s) => ({
          assignmentId: s.assignment_id as string,
          displayScore: displayScore(
            s.auto_score === null ? null : Number(s.auto_score),
            s.final_score === null ? null : Number(s.final_score),
          ),
        })),
      };
    },
  });
}
