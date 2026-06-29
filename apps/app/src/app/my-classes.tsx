// Route HS — "Lớp của tôi": danh sách lớp đang tham gia (tên lớp + GV + sĩ số). Chạm → chi tiết lớp.
import { ScrollView, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { useMyJoinedClasses } from "@/lib/supabase/classes";
import { BackButton } from "@/components/BackButton";
import { Mascot } from "@/components/Mascot";

export default function MyClasses() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const classes = useMyJoinedClasses();

  return (
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
      <BackButton />
      <Text className="font-display text-3xl font-extrabold text-ink">Lớp của tôi</Text>

      {!user ? (
        <Pressable
          onPress={() => router.push("/login")}
          accessibilityLabel="Đăng nhập"
          className="mt-4 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
        >
          <Mascot size={36} color="#ffffff" />
          <Text className="flex-1 font-bold text-white">Đăng nhập để xem lớp của em.</Text>
        </Pressable>
      ) : (
        <View className="mt-5 gap-2">
          {classes.data?.length === 0 && (
            <View className="rounded-lg border-2 border-dashed border-line p-6">
              <Text className="text-center text-muted">
                Em chưa tham gia lớp nào. Dùng “Vào lớp bằng mã” để tham gia nhé!
              </Text>
              <Pressable
                accessibilityLabel="Vào lớp bằng mã"
                onPress={() => router.push("/join")}
                className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
              >
                <Text className="font-display font-bold text-white">Vào lớp bằng mã</Text>
              </Pressable>
            </View>
          )}
          {classes.data?.map((c) => (
            <Pressable
              key={c.id}
              accessibilityLabel={`Lớp ${c.name}`}
              onPress={() => router.push(`/my-class/${c.id}`)}
              className="flex-row items-center gap-3 rounded-lg bg-surface p-4 shadow-sm"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand">
                <Text className="font-display font-extrabold text-white">
                  {c.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-display text-base font-bold text-ink">{c.name}</Text>
                <Text className="text-xs font-semibold text-muted">
                  {c.teacherName ?? "Giáo viên"} · {c.memberCount} thành viên
                </Text>
              </View>
              <Text className="text-2xl text-muted">›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
