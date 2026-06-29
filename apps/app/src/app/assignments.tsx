// Route HS — bài tập được giao (M3 US2, T024). RLS chỉ trả bài của lớp em là thành viên.
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { useMyAssignments } from "@/lib/supabase/assignments";
import { Mascot } from "@/components/Mascot";
import { BackButton } from "@/components/BackButton";

export default function Assignments() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const list = useMyAssignments();

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
      <Text className="font-display text-3xl font-extrabold text-ink">Bài được giao</Text>

      {!user ? (
        <Pressable
          onPress={() => router.push("/login")}
          className="mt-4 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
        >
          <Mascot size={36} color="#ffffff" />
          <Text className="flex-1 font-bold text-white">Đăng nhập để xem bài cô/thầy giao.</Text>
        </Pressable>
      ) : (
        <View className="mt-5 gap-3">
          {list.data?.length === 0 && (
            <View className="rounded-lg border-2 border-dashed border-line p-6">
              <Text className="text-center text-muted">Chưa có bài nào được giao.</Text>
            </View>
          )}
          {list.data?.map((a) => (
            <Pressable
              key={a.id}
              accessibilityLabel={a.title}
              onPress={() => router.push(`/assignment/${a.id}`)}
              className="flex-row items-center gap-3 rounded-lg bg-surface p-4 shadow-sm"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                <Text style={{ fontSize: 20 }}>📝</Text>
              </View>
              <View className="flex-1">
                <Text className="font-display text-base font-bold text-ink">{a.title}</Text>
                <Text className="text-xs font-semibold text-muted">{a.questionIds.length} câu</Text>
              </View>
              <Text className="text-2xl text-muted">›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
