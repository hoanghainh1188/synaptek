// Quên mật khẩu (D47): gửi link khôi phục qua email. Luôn hiện thông báo GIỐNG NHAU dù email có tồn
// tại hay không — chống dò email đã đăng ký (account enumeration); Supabase cũng thiết kế API vậy.
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { Mascot } from "@/components/Mascot";

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const { resetPasswordForEmail, enabled } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const res = await resetPasswordForEmail(email.trim());
    setBusy(false);
    // Luôn báo "đã gửi" khi không có lỗi thật (định dạng/rate-limit) — không tiết lộ email có tồn tại.
    if (res.error) setError(res.error);
    else setSent(true);
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
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Quay lại"
        className="mb-4 h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
      >
        <Text className="text-lg text-muted">←</Text>
      </Pressable>
      <View className="items-center">
        <Mascot size={56} />
        <Text className="mt-2 font-display text-xl font-extrabold text-brand">Quên mật khẩu?</Text>
        <Text className="text-center text-sm text-muted">
          Nhập email đã dùng để đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </Text>
      </View>

      <View className="mt-6 gap-3">
        {!enabled ? (
          <Text className="text-sm text-muted">Chưa cấu hình đăng nhập.</Text>
        ) : sent ? (
          <View className="rounded-lg bg-ok/10 p-4">
            <Text className="font-display text-base font-bold text-ink">
              Đã gửi email (nếu tài khoản tồn tại) ✓
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Kiểm tra hộp thư (kể cả mục spam) và bấm vào link để đặt mật khẩu mới.
            </Text>
          </View>
        ) : (
          <>
            <View>
              <Text className="mb-1 text-sm font-bold text-muted">Email</Text>
              <TextInput
                className="min-h-[52px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
                placeholderTextColor="#a1a1aa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@vidu.com"
                accessibilityLabel="Email"
              />
            </View>
            {error && <Text className="text-sm font-semibold text-no">{error}</Text>}
            <Pressable
              onPress={submit}
              disabled={busy || !email.trim()}
              accessibilityLabel="Gửi email khôi phục"
              className={`min-h-[52px] items-center justify-center rounded-md ${busy || !email.trim() ? "bg-line" : "bg-brand"}`}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-display text-lg font-bold text-white">
                  Gửi email khôi phục
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}
