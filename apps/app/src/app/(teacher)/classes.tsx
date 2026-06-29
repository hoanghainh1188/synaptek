// Route GV — danh sách lớp + tạo lớp (M3 US1, T012). Guard role=teacher.
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { useMyRole } from "@/lib/supabase/role";
import { useCreateClass, useMyClasses } from "@/lib/supabase/classes";
import { Mascot } from "@/components/Mascot";
import { BackButton } from "@/components/BackButton";

export default function TeacherClasses() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = useMyRole();
  const classes = useMyClasses();
  const createClass = useCreateClass();
  const [name, setName] = useState("");

  const wrap = (children: React.ReactNode) => (
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
      {children}
    </ScrollView>
  );

  if (!user) {
    return wrap(
      <Pressable
        onPress={() => router.push("/login")}
        accessibilityLabel="Đăng nhập"
        className="mt-4 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
      >
        <Mascot size={36} color="#ffffff" />
        <Text className="flex-1 font-bold text-white">
          Đăng nhập bằng tài khoản giáo viên để quản lý lớp.
        </Text>
      </Pressable>,
    );
  }

  if (role.data && role.data !== "teacher") {
    return wrap(
      <View className="mt-4 rounded-lg bg-surface p-5 shadow-sm">
        <Text className="font-display text-lg font-bold text-ink">Khu vực giáo viên</Text>
        <Text className="mt-2 text-sm text-muted">
          Mục này dành cho giáo viên. Bạn có thể đổi vai trò trong hồ sơ nếu bạn là giáo viên.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Về trang chủ</Text>
        </Pressable>
      </View>,
    );
  }

  const canCreate = name.trim().length > 0 && !createClass.isPending;

  return wrap(
    <>
      <BackButton />
      <Text className="font-display text-3xl font-extrabold text-ink">Lớp của tôi</Text>

      <View className="mt-5 rounded-lg bg-surface p-4 shadow-sm">
        <Text className="mb-1 text-sm font-bold text-muted">Tạo lớp mới</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên lớp (vd: Toán 4A)"
            placeholderTextColor="#a1a1aa"
            className="min-h-[48px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
          />
          <Pressable
            accessibilityLabel="Tạo lớp"
            disabled={!canCreate}
            onPress={() => createClass.mutate(name.trim(), { onSuccess: () => setName("") })}
            className={`min-h-[48px] items-center justify-center rounded-md px-4 ${canCreate ? "bg-brand" : "bg-line"}`}
          >
            <Text className="font-display font-bold text-white">Tạo</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-6 gap-3">
        {classes.data?.length === 0 && (
          <View className="rounded-lg border-2 border-dashed border-line p-6">
            <Text className="text-center text-muted">
              Chưa có lớp nào — tạo lớp đầu tiên ở trên nhé!
            </Text>
          </View>
        )}
        {classes.data?.map((c) => (
          <Pressable
            key={c.id}
            accessibilityLabel={c.name}
            onPress={() => router.push(`/class/${c.id}`)}
            className="flex-row items-center gap-3 rounded-lg bg-surface p-4 shadow-sm"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
              <Mascot size={24} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-base font-bold text-ink">{c.name}</Text>
              <Text className="text-xs font-semibold text-muted">Mã mời: {c.inviteCode}</Text>
            </View>
            <Text className="text-2xl text-muted">›</Text>
          </Pressable>
        ))}
      </View>
    </>,
  );
}
