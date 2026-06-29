// Đọc/đặt avatar của HS (profiles.avatar). RLS: profiles_update_own. Guest → null/no-op.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";

/** Avatar key hiện tại của HS (null = chưa chọn → mặc định). */
export function useMyAvatar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["avatar", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<string | null> => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.avatar as string | null) ?? null;
    },
  });
}

/** Đặt avatar (key) cho HS hiện tại. */
export function useSetAvatar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!supabase || !user) return;
      const { error } = await supabase.from("profiles").update({ avatar: key }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avatar"] }),
  });
}
