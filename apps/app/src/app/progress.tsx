// Route tiến độ (US2, T033, FR-009). Gộp attempts → tiến độ theo chủ đề.
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { useAttempts } from "@/lib/supabase/attempts";
import { aggregateProgress } from "@/lib/progress";
import { getTopic, strandOf, topicOfQuestion } from "@/lib/content";
import { strandColors, type StrandKey } from "@/theme/tokens";
import { Mascot } from "@/components/Mascot";

export default function Progress() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const attempts = useAttempts();

  const top = { paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 40 };

  if (!user) {
    return (
      <ScrollView contentContainerStyle={top}>
        <BackButton />
        <View className="mt-10 items-center gap-3">
          <Mascot size={56} />
          <Text className="font-display text-xl font-extrabold text-ink">Theo dõi tiến độ</Text>
          <Text className="text-center text-muted">
            Đăng nhập để lưu và xem tiến độ học của em nhé.
          </Text>
          <Pressable
            onPress={() => router.push("/login")}
            className="mt-2 min-h-[48px] items-center justify-center rounded-md bg-brand px-6"
          >
            <Text className="font-display text-base font-bold text-white">Đăng nhập</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const prog = Object.values(aggregateProgress(attempts.data ?? [], topicOfQuestion));

  return (
    <ScrollView contentContainerStyle={top}>
      <BackButton />
      <Text className="mt-2 font-display text-3xl font-extrabold text-ink">Tiến độ của em</Text>

      {prog.length === 0 ? (
        <View className="mt-8 items-center gap-2">
          <Mascot size={48} />
          <Text className="text-center text-muted">
            {attempts.isLoading ? "Đang tải…" : "Chưa có dữ liệu — luyện tập để bắt đầu nhé!"}
          </Text>
        </View>
      ) : (
        <View className="mt-5 gap-3">
          {prog.map((p) => {
            const topic = getTopic(p.topicId);
            const color = strandColors[strandOf(p.topicId) as StrandKey] ?? strandColors.num;
            const pct = p.attempted === 0 ? 0 : Math.round((p.correct / p.attempted) * 100);
            return (
              <View key={p.topicId} className="rounded-lg bg-surface p-4 shadow-sm">
                <Text className="font-display text-lg font-bold text-ink">
                  {topic?.name ?? p.topicId}
                </Text>
                <View className="mt-2 flex-row items-center gap-2">
                  <View
                    className="h-2 flex-1 overflow-hidden rounded-full"
                    style={{ backgroundColor: color + "22" }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </View>
                  <Text className="text-xs font-bold text-muted">
                    {p.correct}/{p.attempted} câu · {pct}% đúng
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      className="h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
    >
      <Text className="text-lg text-muted">←</Text>
    </Pressable>
  );
}
