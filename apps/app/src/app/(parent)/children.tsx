// Route PH — "Con của tôi": nhập mã liên kết + danh sách con + gỡ (M4 US1). Guard role=parent.
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { normalizeInviteCode } from "@synaptek/classroom";
import { useAuth } from "@/lib/supabase/auth";
import { useMyRole } from "@/lib/supabase/role";
import { useLinkChild, useMyChildren, useUnlink } from "@/lib/supabase/parent";
import { Mascot } from "@/components/Mascot";
import { BackButton } from "@/components/BackButton";

export default function Children() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = useMyRole();
  const children = useMyChildren();
  const link = useLinkChild();
  const unlink = useUnlink();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const wrap = (c: React.ReactNode) => (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      {c}
    </ScrollView>
  );

  if (!user)
    return wrap(
      <Pressable
        onPress={() => router.push("/login")}
        accessibilityLabel="Đăng nhập"
        className="mt-4 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
      >
        <Mascot size={36} color="#ffffff" />
        <Text className="flex-1 font-bold text-white">Đăng nhập bằng tài khoản phụ huynh.</Text>
      </Pressable>,
    );

  if (role.data && role.data !== "parent")
    return wrap(
      <View className="mt-4 rounded-lg bg-surface p-5 shadow-sm">
        <Text className="font-display text-lg font-bold text-ink">Khu vực phụ huynh</Text>
        <Text className="mt-2 text-sm text-muted">
          Mục này dành cho phụ huynh. Bạn có thể đổi vai trò trong hồ sơ.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Về trang chủ</Text>
        </Pressable>
      </View>,
    );

  const submit = () => {
    setMsg(null);
    link.mutate(normalizeInviteCode(code), {
      onSuccess: () => {
        setMsg("Đã liên kết với con! 🎉");
        setCode("");
      },
      onError: (e) => setMsg(e instanceof Error ? e.message : "Mã không đúng."),
    });
  };

  return wrap(
    <>
      <BackButton />
      <Text className="font-display text-3xl font-extrabold text-ink">Con của tôi</Text>

      {/* Nhập mã liên kết */}
      <View className="mt-5 rounded-lg bg-surface p-4 shadow-sm">
        <Text className="mb-1 text-sm font-bold text-muted">Liên kết với con bằng mã</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="Mã con cung cấp"
            placeholderTextColor="#a1a1aa"
            className="min-h-[48px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-center font-display text-lg tracking-widest text-ink"
          />
          <Pressable
            accessibilityLabel="Liên kết"
            disabled={code.trim().length === 0 || link.isPending}
            onPress={submit}
            className={`min-h-[48px] items-center justify-center rounded-md px-4 ${code.trim().length > 0 ? "bg-brand" : "bg-line"}`}
          >
            {link.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-display font-bold text-white">Liên kết</Text>
            )}
          </Pressable>
        </View>
        {msg && (
          <Text className={`mt-2 text-sm font-semibold ${link.isError ? "text-no" : "text-ok"}`}>
            {msg}
          </Text>
        )}
      </View>

      {/* Danh sách con */}
      <View className="mt-6 gap-2">
        {children.data?.length === 0 && (
          <View className="rounded-lg border-2 border-dashed border-line p-6">
            <Text className="text-center text-muted">
              Chưa liên kết con nào — nhập mã con cung cấp ở trên.
            </Text>
          </View>
        )}
        {children.data?.map((c) => (
          <View
            key={c.id}
            className="flex-row items-center gap-3 rounded-lg bg-surface p-4 shadow-sm"
          >
            <Pressable
              accessibilityLabel={`Theo dõi ${c.fullName ?? "con"}`}
              onPress={() => router.push(`/child/${c.id}`)}
              className="flex-1 flex-row items-center gap-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand">
                <Text className="font-display font-extrabold text-white">
                  {(c.fullName ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="flex-1 font-display text-base font-bold text-ink">
                {c.fullName ?? "Con"}
              </Text>
              <Text className="text-2xl text-muted">›</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Gỡ ${c.fullName ?? "con"}`}
              onPress={() => unlink.mutate({ parentId: user.id, studentId: c.id })}
              className="min-h-[40px] items-center justify-center rounded-md px-2"
            >
              <Text className="font-bold text-no">Gỡ</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </>,
  );
}
