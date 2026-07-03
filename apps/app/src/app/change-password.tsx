// Đổi mật khẩu khi ĐÃ đăng nhập (D48). Khác reset-password.tsx (qua email lúc quên) — ở đây xác thực
// lại mật khẩu HIỆN TẠI trước khi đổi (xem changePassword trong lib/supabase/auth.tsx).
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { BackButton } from "@/components/BackButton";

const MIN_LEN = 6;

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const { changePassword, user } = useAuth();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < MIN_LEN;
  const valid = current.trim().length > 0 && password.length >= MIN_LEN && password === confirm;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const res = await changePassword(current, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDone(true);
      setCurrent("");
      setPassword("");
      setConfirm("");
    }
  };

  if (!user) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16 }}>
        <BackButton />
        <Text className="mt-4 text-sm text-muted">Cần đăng nhập để đổi mật khẩu.</Text>
      </ScrollView>
    );
  }

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
      <BackButton />
      <Text className="mt-4 font-display text-2xl font-extrabold text-ink">Đổi mật khẩu</Text>

      <View className="mt-6 gap-3">
        {done ? (
          <View className="rounded-lg bg-ok/10 p-4">
            <Text className="font-display text-base font-bold text-ink">Đã đổi mật khẩu ✓</Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Về hồ sơ"
              className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Về hồ sơ</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View>
              <Text className="mb-1 text-sm font-bold text-muted">Mật khẩu hiện tại</Text>
              <TextInput
                className="min-h-[52px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
                placeholderTextColor="#a1a1aa"
                value={current}
                onChangeText={setCurrent}
                secureTextEntry
                placeholder="••••••"
                accessibilityLabel="Mật khẩu hiện tại"
              />
            </View>
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
              <Text className="mb-1 text-sm font-bold text-muted">Nhập lại mật khẩu mới</Text>
              <TextInput
                className="min-h-[52px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
                placeholderTextColor="#a1a1aa"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="••••••"
                accessibilityLabel="Nhập lại mật khẩu mới"
              />
              {mismatch && <Text className="mt-1 text-xs text-no">Mật khẩu chưa khớp.</Text>}
            </View>
            {error && <Text className="text-sm font-semibold text-no">{error}</Text>}
            <Pressable
              onPress={submit}
              disabled={busy || !valid}
              accessibilityLabel="Xác nhận đổi mật khẩu"
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
