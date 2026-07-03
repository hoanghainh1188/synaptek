// Auth tối thiểu (D16): email/mật khẩu qua Supabase. Guest khi chưa cấu hình / chưa đăng nhập.
// Quên mật khẩu (D47): resetPasswordForEmail gửi link khôi phục; updatePassword đặt mật khẩu mới
// (cần phiên "recovery" tạm — Supabase tự cấp khi phát hiện link trong URL, web: detectSessionInUrl).
// Đổi mật khẩu khi ĐÃ đăng nhập (D48): changePassword xác thực lại mật khẩu HIỆN TẠI trước khi đổi —
// chống đổi mật khẩu khi phiên bị chiếm dụng (vd thiết bị công cộng còn đăng nhập) mà không biết mật khẩu thật.
// Đăng xuất thiết bị khác (D50): signOut({scope:"others"}) — supabase-js hỗ trợ sẵn, KHÔNG cần Admin
// API/service-role. Không có API liệt kê CHI TIẾT từng phiên (thiết bị/vị trí) ở client — chỉ thu hồi được.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "./client";

interface AuthValue {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  /** true khi phiên hiện tại đến từ link khôi phục mật khẩu (event PASSWORD_RECOVERY) — dùng để
   *  màn reset-password biết cần hiện form đặt mật khẩu mới, khác đăng nhập bình thường. */
  recoveryMode: boolean;
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUp(
    email: string,
    password: string,
    fullName?: string,
    role?: "student" | "teacher" | "parent",
  ): Promise<{ error?: string }>;
  signOut(): Promise<void>;
  resetPasswordForEmail(email: string): Promise<{ error?: string }>;
  updatePassword(newPassword: string): Promise<{ error?: string }>;
  changePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }>;
  /** Thu hồi phiên đăng nhập ở MỌI thiết bị khác, giữ nguyên phiên hiện tại (D50). */
  signOutOtherDevices(): Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      if (event === "SIGNED_OUT") setRecoveryMode(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    user,
    loading,
    enabled: supabaseEnabled,
    recoveryMode,
    async signIn(email, password) {
      if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    async signUp(email, password, fullName, role) {
      if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName ?? "", role: role ?? "student" } },
      });
      return error ? { error: error.message } : {};
    },
    async signOut() {
      await supabase?.auth.signOut();
    },
    async resetPasswordForEmail(email) {
      if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL("reset-password"),
      });
      return error ? { error: error.message } : {};
    },
    async updatePassword(newPassword) {
      if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) setRecoveryMode(false);
      return error ? { error: error.message } : {};
    },
    async changePassword(currentPassword, newPassword) {
      if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
      if (!user?.email) return { error: "Không xác định được email tài khoản." };
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) return { error: "Mật khẩu hiện tại không đúng." };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return error ? { error: error.message } : {};
    },
    async signOutOtherDevices() {
      if (!supabase) return { error: "Chưa cấu hình đăng nhập." };
      const { error } = await supabase.auth.signOut({ scope: "others" });
      return error ? { error: error.message } : {};
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}
