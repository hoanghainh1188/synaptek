// Đọc/đặt avatar của HS (profiles.avatar). RLS: profiles_update_own. Guest → null/no-op.
// Avatar ảnh thật (D51): LỰA CHỌN THÊM bên cạnh emoji mở khoá theo XP, không thay thế — profiles
// .avatar_photo_url (null = đang dùng emoji). Bucket Storage riêng 'avatars' (giới hạn 2MB, chỉ ảnh).
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

/** Upload ảnh đại diện lên Storage (bucket public 'avatars', thư mục theo uid) → trả public URL. */
export async function uploadAvatarPhoto(file: File, userId: string): Promise<string> {
  if (!supabase) throw new Error("Chưa cấu hình Supabase.");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type || "image/png" });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

/** URL ảnh đại diện thật hiện tại (null = đang dùng emoji). */
export function useMyAvatarPhoto() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["avatar-photo", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<string | null> => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_photo_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.avatar_photo_url as string | null) ?? null;
    },
  });
}

/** Đặt (hoặc xoá — truyền null để quay lại emoji) URL ảnh đại diện. */
export function useSetAvatarPhoto() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (url: string | null) => {
      if (!supabase || !user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_photo_url: url })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avatar-photo"] }),
  });
}
