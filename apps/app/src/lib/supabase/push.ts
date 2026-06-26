// Lưu/cập nhật push_tokens qua Supabase (RLS của HS). Guest → no-op. (US3, T048, FR-019)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";
import type { PushRegistration } from "@/lib/notifications";

/** Lưu token thiết bị (enabled=true). PK (student_id, token) → upsert idempotent. */
export function useSavePushToken() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reg: PushRegistration) => {
      if (!supabase || !user) return; // guest → không lưu
      const { error } = await supabase
        .from("push_tokens")
        .upsert(
          { student_id: user.id, token: reg.token, platform: reg.platform, enabled: true },
          { onConflict: "student_id,token" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["push_tokens"] }),
  });
}

/** Bật/tắt thông báo cho mọi thiết bị của HS (FR-019). */
export function useSetPushEnabled() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!supabase || !user) return;
      const { error } = await supabase
        .from("push_tokens")
        .update({ enabled })
        .eq("student_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["push_tokens"] }),
  });
}
