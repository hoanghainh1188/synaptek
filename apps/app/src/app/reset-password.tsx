// Đặt mật khẩu mới sau khi bấm link khôi phục (D47). Supabase tự cấp phiên "recovery" tạm khi phát
// hiện link trong URL (web: detectSessionInUrl) — event PASSWORD_RECOVERY, xem lib/supabase/auth.tsx.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { Mascot } from "@/components/Mascot";

const MIN_LEN = 6;
// Supabase xử lý link khôi phục trong URL (detectSessionInUrl) BẤT ĐỒNG BỘ sau khi mount — cần đợi
// một khoảng ngắn trước khi kết luận "link không hợp lệ", tránh chớp nhầm lỗi cho link ĐANG xử lý.
const RECOVERY_CHECK_MS = 2500;

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const { updatePassword, recoveryMode, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (recoveryMode) {
      setChecking(false);
      return;
    }
    const t = setTimeout(() => setChecking(false), RECOVERY_CHECK_MS);
    return () => clearTimeout(t);
  }, [recoveryMode]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < MIN_LEN;
  const valid = password.length >= MIN_LEN && password === confirm;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const res = await updatePassword(password);
    setBusy(false);
    if (res.error) setError(res.error);
    else setDone(true);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxWidth: 480,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <View className="items-center">
        <Mascot size={56} />
        <Text className="mt-2 font-display text-xl font-extrabold text-brand">
          Đặt mật khẩu mới
        </Text>
      </View>

      <View className="mt-6 gap-3">
        {loading || (checking && !recoveryMode) ? (
          <ActivityIndicator />
        ) : done ? (
          <View className="rounded-lg bg-ok/10 p-4">
            <Text className="font-display text-base font-bold text-ink">Đã đổi mật khẩu ✓</Text>
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityLabel="Về trang chủ"
              className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Về trang chủ</Text>
            </Pressable>
          </View>
        ) : !recoveryMode ? (
          <View className="rounded-lg bg-no/10 p-4">
            <Text className="text-sm text-ink">
              Link khôi phục không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi lại email khôi phục.
            </Text>
            <Pressable
              onPress={() => router.replace("/forgot-password")}
              accessibilityLabel="Yêu cầu lại"
              className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Yêu cầu lại</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View>
              <Text className="mb-1 text-sm font-bold text-muted">Mật khẩu mới</Text>
              <TextInput
                className="min-h-[52px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
                placeholderTextColor="#a1a1aa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••"
                accessibilityLabel="Mật khẩu mới"
              />
              {tooShort && (
                <Text className="mt-1 text-xs text-no">Cần ít nhất {MIN_LEN} ký tự.</Text>
              )}
            </View>
            <View>
              <Text className="mb-1 text-sm font-bold text-muted">Nhập lại mật khẩu</Text>
              <TextInput
                className="min-h-[52px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
                placeholderTextColor="#a1a1aa"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="••••••"
                accessibilityLabel="Nhập lại mật khẩu"
              />
              {mismatch && <Text className="mt-1 text-xs text-no">Mật khẩu chưa khớp.</Text>}
            </View>
            {error && <Text className="text-sm font-semibold text-no">{error}</Text>}
            <Pressable
              onPress={submit}
              disabled={busy || !valid}
              accessibilityLabel="Đổi mật khẩu"
              className={`min-h-[52px] items-center justify-center rounded-md ${busy || !valid ? "bg-line" : "bg-brand"}`}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-display text-lg font-bold text-white">Đổi mật khẩu</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}
