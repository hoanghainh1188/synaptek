// Route HS — tham gia lớp bằng mã mời (M3 US1, T014). Auto-join khi mã hợp lệ (D24).
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { normalizeInviteCode } from "@synaptek/classroom";
import { useAuth } from "@/lib/supabase/auth";
import { useJoinClass } from "@/lib/supabase/classes";
import { Mascot } from "@/components/Mascot";

export default function Join() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const join = useJoinClass();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = () => {
    setMsg(null);
    const normalized = normalizeInviteCode(code);
    join.mutate(normalized, {
      onSuccess: () => {
        setMsg("Đã vào lớp! 🎉");
        setCode("");
      },
      onError: (e) => setMsg(e instanceof Error ? e.message : "Mã không đúng."),
    });
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
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
        <Text className="mt-2 font-display text-2xl font-extrabold text-ink">Vào lớp</Text>
        <Text className="text-sm text-muted">Nhập mã mời giáo viên cho em</Text>
      </View>

      {!user ? (
        <Pressable
          onPress={() => router.push("/login")}
          className="mt-6 min-h-[48px] items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Đăng nhập để vào lớp</Text>
        </Pressable>
      ) : (
        <View className="mt-6 gap-3">
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="VD: 7K2MQ9"
            placeholderTextColor="#a1a1aa"
            className="min-h-[56px] rounded-md border-2 border-line bg-surface px-3 text-center font-display text-2xl tracking-widest text-ink"
          />
          <Pressable
            accessibilityLabel="Vào lớp"
            disabled={code.trim().length === 0 || join.isPending}
            onPress={submit}
            className={`min-h-[52px] items-center justify-center rounded-md ${code.trim().length > 0 ? "bg-brand" : "bg-line"}`}
          >
            {join.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-display text-lg font-bold text-white">Vào lớp</Text>
            )}
          </Pressable>
          {msg && (
            <Text
              className={`text-center text-sm font-semibold ${join.isError ? "text-no" : "text-ok"}`}
            >
              {msg}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}
