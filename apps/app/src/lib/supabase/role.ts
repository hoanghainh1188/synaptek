// Vai trò người dùng (M3 US1, D22). Đọc/cập nhật profiles.role (đã có ở 0001: student|teacher|parent).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";

export type Role = "student" | "teacher" | "parent";

/** Vai trò của HS/GV hiện tại (mặc định 'student' khi chưa đăng nhập / chưa có dữ liệu). */
export function useMyRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["role", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<Role> => {
      if (!supabase || !user) return "student";
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return ((data?.role as Role) ?? "student") satisfies Role;
    },
  });
}

/** Đặt vai trò cho người dùng hiện tại (tự chọn — D22). Guest → no-op. */
export function useSetRole() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (role: Role) => {
      if (!supabase || !user) return;
      const { error } = await supabase.from("profiles").update({ role }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["role"] }),
  });
}
