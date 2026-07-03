// Đọc/đổi tên hiển thị (profiles.full_name, D49). RLS: profiles_update_own. Guest → null/no-op.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";

/** Tên hiển thị hiện tại của người dùng (null = chưa đặt). */
export function useMyFullName() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["full-name", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<string | null> => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.full_name as string | null) ?? null;
    },
  });
}

/** Đổi tên hiển thị cho người dùng hiện tại. */
export function useSetFullName() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fullName: string) => {
      if (!supabase || !user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["full-name"] }),
  });
}
