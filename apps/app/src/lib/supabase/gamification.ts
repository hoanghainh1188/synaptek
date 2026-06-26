// Đọc & ghi gamification_state + student_badges qua Supabase (RLS: của HS đã đăng nhập). Guest → no-op.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GamificationState } from "@synaptek/learning-path";
import { supabase } from "./client";
import { useAuth } from "./auth";

export interface GamificationSnapshot {
  state: GamificationState;
  earnedBadgeIds: string[];
}

const INITIAL: GamificationState = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticedOn: null,
};

/** Trạng thái gamification + huy hiệu đã mở của HS hiện tại. */
export function useGamification() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gamification", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<GamificationSnapshot> => {
      if (!supabase || !user) return { state: INITIAL, earnedBadgeIds: [] };
      const [stateRes, badgesRes] = await Promise.all([
        supabase
          .from("gamification_state")
          .select("total_xp, current_streak, longest_streak, last_practiced_on")
          .eq("student_id", user.id)
          .maybeSingle(),
        supabase.from("student_badges").select("badge_id").eq("student_id", user.id),
      ]);
      if (stateRes.error) throw stateRes.error;
      if (badgesRes.error) throw badgesRes.error;
      const row = stateRes.data;
      return {
        state: row
          ? {
              totalXp: (row.total_xp as number) ?? 0,
              currentStreak: (row.current_streak as number) ?? 0,
              longestStreak: (row.longest_streak as number) ?? 0,
              lastPracticedOn: (row.last_practiced_on as string | null) ?? null,
            }
          : INITIAL,
        earnedBadgeIds: (badgesRes.data ?? []).map((b) => b.badge_id as string),
      };
    },
  });
}

export interface GamificationWrite {
  state: GamificationState;
  /** Huy hiệu MỚI đạt (sẽ insert on-conflict-do-nothing → mở đúng một lần). */
  newBadgeIds: string[];
}

/** Lưu state + huy hiệu mới sau phiên (chỉ khi đăng nhập; guest → no-op). */
export function useSaveGamification() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ state, newBadgeIds }: GamificationWrite) => {
      if (!supabase || !user) return; // guest → không lưu
      const { error: stateErr } = await supabase.from("gamification_state").upsert(
        {
          student_id: user.id,
          total_xp: state.totalXp,
          current_streak: state.currentStreak,
          longest_streak: state.longestStreak,
          last_practiced_on: state.lastPracticedOn,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" },
      );
      if (stateErr) throw stateErr;
      if (newBadgeIds.length > 0) {
        // PK (student_id, badge_id) → ignoreDuplicates đảm bảo idempotent (mở một lần).
        const { error: badgeErr } = await supabase.from("student_badges").upsert(
          newBadgeIds.map((badge_id) => ({ student_id: user.id, badge_id })),
          { onConflict: "student_id,badge_id", ignoreDuplicates: true },
        );
        if (badgeErr) throw badgeErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gamification"] }),
  });
}
